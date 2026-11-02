import { randomUUID } from "node:crypto";
import { GALLERY } from "./content";
import type { GalleryTag } from "./content";
import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import { getDb, hasMongo } from "./mongo";
import {
  GALLERY_TAGS,
  LOTS_GALLERY_TAG,
  type GalleryPhoto,
  type LotsGallerySlug,
} from "./gallery-types";
import type { Locale } from "./i18n";
import { CONTENT_LOCALES, localizeStoredText, translateText, type ContentLocale } from "./translate-content";

export type { GalleryPhoto, LotsGallerySlug } from "./gallery-types";
export { GALLERY_TAGS, LOTS_GALLERY_TAG } from "./gallery-types";

const localFile = dataFile("gallery.local.json");

export function defaultGallery(): GalleryPhoto[] {
  return GALLERY.map((item, index) => ({
    id: `seed-${index + 1}`,
    src: item.src,
    alt: item.alt,
    description: "",
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
    description: typeof doc.description === "string" ? doc.description : "",
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
      const description =
        item.i18n?.[locale]?.description ||
        (item.description ? localizeStoredText(item.description, locale) : item.description);
      return { ...item, alt, description };
    }
    return item;
  });
}

/** 분양안내 사진 격자: 갤러리 분류 태그와 일치하는 항목만. 없으면 빈 배열. */
export async function listLotsPhotosFromGallery(
  slug: LotsGallerySlug,
  locale: Locale,
): Promise<Array<{ id: string; title: string; text?: string; image: string }>> {
  const tag = LOTS_GALLERY_TAG[slug];
  const photos = await listGalleryLocalized(locale);
  return photos
    .filter((item) => item.tags.includes(tag))
    .map((item) => ({
      id: item.id,
      title: item.alt || tag,
      text: item.description?.trim() || undefined,
      image: item.src,
    }));
}

async function fillGalleryTextI18n(alt: string, description: string): Promise<GalleryPhoto["i18n"]> {
  const i18n: NonNullable<GalleryPhoto["i18n"]> = {};
  for (const to of CONTENT_LOCALES) {
    try {
      const localeFields: { alt: string; description?: string } = {
        alt: await translateText(alt, to as ContentLocale),
      };
      if (description.trim()) {
        localeFields.description = await translateText(description, to as ContentLocale);
      }
      i18n[to] = localeFields;
    } catch (error) {
      console.error(`[gallery] translate fields ${to} failed`, error);
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

export async function addGalleryPhoto(input: {
  src: string;
  alt: string;
  description?: string;
  tags: GalleryTag[];
}) {
  const alt = input.alt.trim() || "공원 사진";
  const description = (input.description ?? "").trim();
  const photo: GalleryPhoto = {
    id: randomUUID(),
    src: input.src,
    alt,
    description,
    tags: input.tags.length ? input.tags : ["일반"],
    i18n: await fillGalleryTextI18n(alt, description),
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

export async function updateGalleryPhoto(
  id: string,
  input: { alt?: string; description?: string; tags?: GalleryTag[] },
) {
  if (hasMongo()) {
    await ensureMongoMaterialized();
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    const col = db.collection("gallery");
    const existing = await col.findOne({ id });
    if (!existing) return { ok: false as const, error: "사진을 찾지 못했습니다." };

    const current = fromDoc(existing as Record<string, unknown>);
    const alt = input.alt !== undefined ? input.alt.trim() : current.alt;
    const description =
      input.description !== undefined ? input.description.trim() : (current.description ?? "");
    const textChanged =
      (input.alt !== undefined && alt !== current.alt) ||
      (input.description !== undefined && description !== (current.description ?? ""));
    const next: GalleryPhoto = {
      ...current,
      alt,
      description,
      tags: input.tags ?? current.tags,
      i18n: textChanged ? await fillGalleryTextI18n(alt, description) : current.i18n,
    };
    await col.updateOne(
      { id },
      {
        $set: {
          alt: next.alt,
          description: next.description,
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
  const description =
    input.description !== undefined ? input.description.trim() : (items[idx].description ?? "");
  const textChanged =
    (input.alt !== undefined && alt !== items[idx].alt) ||
    (input.description !== undefined && description !== (items[idx].description ?? ""));
  items[idx] = {
    ...items[idx],
    alt,
    description,
    tags: input.tags ?? items[idx].tags,
    i18n: textChanged ? await fillGalleryTextI18n(alt, description) : items[idx].i18n,
  };
  await persistLocal(items);
  return { ok: true as const, photo: items[idx] };
}

async function removeGalleryUploadFiles(src: string) {
  if (!src || (!src.includes("/uploads/") && !src.includes("/api/uploads/"))) return;
  const { deleteUploadObject } = await import("./upload-store");
  let rel = src.replace(/^\/+/, "").replace(/^(api\/)?uploads\//, "");
  if (!rel || rel.includes("..")) return;
  await deleteUploadObject(`uploads/${rel}`);
  const thumbRel = rel.startsWith("thumbs/")
    ? rel
    : `thumbs/${rel.replace(/\.(png|webp|gif|jpe?g)$/i, ".jpg")}`;
  await deleteUploadObject(`uploads/${thumbRel}`);
}

export async function deleteGalleryPhoto(id: string) {
  if (hasMongo()) {
    await ensureMongoMaterialized();
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    const existing = await db.collection("gallery").findOne({ id });
    if (!existing) return { ok: false as const, error: "사진을 찾지 못했습니다." };
    const src = String((existing as { src?: string }).src ?? "");
    const result = await db.collection("gallery").deleteOne({ id });
    if (result.deletedCount < 1) return { ok: false as const, error: "사진을 찾지 못했습니다." };
    await removeGalleryUploadFiles(src);
    return { ok: true as const };
  }

  const items = await listGallery();
  const target = items.find((item) => item.id === id);
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return { ok: false as const, error: "사진을 찾지 못했습니다." };
  await persistLocal(next);
  if (target) await removeGalleryUploadFiles(target.src);
  return { ok: true as const };
}
