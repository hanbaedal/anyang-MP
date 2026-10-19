import { randomUUID } from "node:crypto";
import { GALLERY } from "./content";
import type { GalleryTag } from "./content";
import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import { getDb, hasMongo } from "./mongo";
import { GALLERY_TAGS, type GalleryPhoto } from "./gallery-types";
import type { Locale } from "./i18n";
import { CONTENT_LOCALES, localizeStoredText, translateText, type ContentLocale } from "./translate-content";

export type { GalleryPhoto } from "./gallery-types";
export { GALLERY_TAGS } from "./gallery-types";

const localFile = dataFile("gallery.local.json");

export function defaultGallery(): GalleryPhoto[] {
  return GALLERY.map((item, index) => ({
    id: `seed-${index + 1}`,
    src: item.src,
    alt: item.alt,
    tags: item.tags,
  }));
}

function fromDoc(doc: Record<string, unknown>): GalleryPhoto {
  const tags = Array.isArray(doc.tags)
    ? doc.tags.filter((tag): tag is GalleryTag => GALLERY_TAGS.includes(tag as GalleryTag))
    : [];
  return {
    id: String(doc.id ?? doc._id ?? ""),
    src: String(doc.src ?? ""),
    alt: String(doc.alt ?? ""),
    tags,
    i18n: doc.i18n && typeof doc.i18n === "object" ? (doc.i18n as GalleryPhoto["i18n"]) : undefined,
  };
}

async function readStored(): Promise<GalleryPhoto[] | null> {
  if (hasMongo()) {
    try {
      const db = await getDb();
      if (db) {
        const rows = await db.collection("gallery").find({}).sort({ sort: 1, createdAt: 1 }).toArray();
        if (rows.length) return rows.map((row) => fromDoc(row as Record<string, unknown>));
        return null;
      }
    } catch (error) {
      console.error("[gallery] mongo read failed", error);
    }
  }
  const local = await readJsonFile<GalleryPhoto[] | null>(localFile, null);
  return local && local.length ? local : null;
}

export async function listGallery(): Promise<GalleryPhoto[]> {
  return (await readStored()) ?? defaultGallery();
}

export async function listGalleryLocalized(locale: Locale): Promise<GalleryPhoto[]> {
  return (await listGallery()).map((item) => {
    if (locale === "en" || locale === "zh") {
      const alt = item.i18n?.[locale]?.alt || localizeStoredText(item.alt, locale);
      return { ...item, alt };
    }
    return item;
  });
}

async function fillGalleryAltI18n(alt: string): Promise<GalleryPhoto["i18n"]> {
  const i18n: NonNullable<GalleryPhoto["i18n"]> = {};
  for (const to of CONTENT_LOCALES) {
    try {
      i18n[to] = { alt: await translateText(alt, to as ContentLocale) };
    } catch (error) {
      console.error(`[gallery] translate alt ${to} failed`, error);
    }
  }
  return i18n;
}

/** Local-only full rewrite. Mongo paths use atomic insert/update/delete instead. */
async function persistLocal(items: GalleryPhoto[]) {
  await writeJsonFile(localFile, items);
}

/**
 * If Mongo gallery is empty, materialize seed rows once so update/delete by id work.
 * Concurrent first-writers may race; unique `id` keeps duplicates from sticking.
 */
async function ensureMongoMaterialized(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
  const col = db.collection("gallery");
  const any = await col.findOne({}, { projection: { _id: 1 } });
  if (any) return;
  const seeds = defaultGallery();
  try {
    await col.createIndex({ id: 1 }, { unique: true });
  } catch {
    /* index may already exist */
  }
  try {
    await col.insertMany(
      seeds.map((item, sort) => ({
        ...item,
        sort,
        createdAt: new Date(),
      })),
      { ordered: false },
    );
  } catch (error) {
    // Another request may have seeded concurrently (duplicate key) — OK.
    const code = (error as { code?: number })?.code;
    if (code !== 11000) throw error;
  }
}

export async function addGalleryPhoto(input: { src: string; alt: string; tags: GalleryTag[] }) {
  const alt = input.alt.trim() || "공원 사진";
  const photo: GalleryPhoto = {
    id: randomUUID(),
    src: input.src,
    alt,
    tags: input.tags.length ? input.tags : ["일반"],
    i18n: await fillGalleryAltI18n(alt),
  };

  if (hasMongo()) {
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    const col = db.collection("gallery");
    try {
      await col.createIndex({ id: 1 }, { unique: true });
    } catch {
      /* index may already exist */
    }

    const existing = await col.findOne({}, { projection: { _id: 1 } });
    if (!existing) {
      // First write: seed defaults + new photo in one insert (no deleteMany rewrite).
      const items = [...defaultGallery(), photo];
      try {
        await col.insertMany(
          items.map((item, sort) => ({
            ...item,
            sort,
            createdAt: new Date(),
          })),
          { ordered: false },
        );
      } catch (error) {
        // Concurrent first-write may collide on seed ids — keep going if our photo landed.
        if (await col.findOne({ id: photo.id }, { projection: { _id: 1 } })) return photo;
        const code = (error as { code?: number })?.code;
        if (code !== 11000) throw error;
      }
      if (await col.findOne({ id: photo.id }, { projection: { _id: 1 } })) return photo;
      // Seeds won the race without our photo — append atomically.
      const last = await col.find().sort({ sort: -1 }).limit(1).next();
      const sort = typeof last?.sort === "number" ? last.sort + 1 : Date.now();
      await col.insertOne({ ...photo, sort, createdAt: new Date() });
      return photo;
    }

    const last = await col.find().sort({ sort: -1 }).limit(1).next();
    const sort = typeof last?.sort === "number" ? last.sort + 1 : Date.now();
    await col.insertOne({ ...photo, sort, createdAt: new Date() });
    return photo;
  }

  const items = await listGallery();
  items.push(photo);
  await persistLocal(items);
  return photo;
}

export async function updateGalleryPhoto(id: string, input: { alt?: string; tags?: GalleryTag[] }) {
  if (hasMongo()) {
    await ensureMongoMaterialized();
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    const col = db.collection("gallery");
    const existing = await col.findOne({ id });
    if (!existing) return { ok: false as const, error: "사진을 찾지 못했습니다." };

    const current = fromDoc(existing as Record<string, unknown>);
    const alt = input.alt !== undefined ? input.alt.trim() : current.alt;
    const altChanged = input.alt !== undefined && alt !== current.alt;
    const next: GalleryPhoto = {
      ...current,
      alt,
      tags: input.tags ?? current.tags,
      i18n: altChanged ? await fillGalleryAltI18n(alt) : current.i18n,
    };
    await col.updateOne(
      { id },
      {
        $set: {
          alt: next.alt,
          tags: next.tags,
          i18n: next.i18n,
        },
      },
    );
    return { ok: true as const, photo: next };
  }

  const items = await listGallery();
  const idx = items.findIndex((item) => item.id === id);
  if (idx < 0) return { ok: false as const, error: "사진을 찾지 못했습니다." };
  const alt = input.alt !== undefined ? input.alt.trim() : items[idx].alt;
  const altChanged = input.alt !== undefined && alt !== items[idx].alt;
  items[idx] = {
    ...items[idx],
    alt,
    tags: input.tags ?? items[idx].tags,
    i18n: altChanged ? await fillGalleryAltI18n(alt) : items[idx].i18n,
  };
  await persistLocal(items);
  return { ok: true as const, photo: items[idx] };
}

export async function deleteGalleryPhoto(id: string) {
  if (hasMongo()) {
    await ensureMongoMaterialized();
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    const result = await db.collection("gallery").deleteOne({ id });
    if (result.deletedCount < 1) return { ok: false as const, error: "사진을 찾지 못했습니다." };
    return { ok: true as const };
  }

  const items = await listGallery();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return { ok: false as const, error: "사진을 찾지 못했습니다." };
  await persistLocal(next);
  return { ok: true as const };
}
