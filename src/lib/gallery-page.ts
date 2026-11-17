import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import { getDb, hasMongo } from "./mongo";

/** 공개 갤러리 페이지 — 상단 배너 배경만 CMS 아님 */
export type GalleryPageSettings = {
  heroImage: string;
  updatedAt: string;
};

const localFile = dataFile("gallery-page.local.json");
const DOC_ID = "gallery-page";

const empty: GalleryPageSettings = {
  heroImage: "",
  updatedAt: "",
};

function fromDoc(doc: Record<string, unknown> | null | undefined): GalleryPageSettings {
  if (!doc) return { ...empty };
  return {
    heroImage: String(doc.heroImage ?? "").trim(),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt ?? ""),
  };
}

export async function getGalleryPageSettings(): Promise<GalleryPageSettings> {
  if (hasMongo()) {
    try {
      const db = await getDb();
      if (db) {
        const row = await db.collection("gallery_page").findOne({ id: DOC_ID });
        if (row) return fromDoc(row as Record<string, unknown>);
      }
    } catch (error) {
      console.error("[gallery-page] mongo read failed, using file fallback", error);
    }
  }
  return fromDoc(await readJsonFile<GalleryPageSettings | null>(localFile, null));
}

export async function saveGalleryPageSettings(input: { heroImage?: string }): Promise<GalleryPageSettings> {
  const heroImage = String(input.heroImage ?? "").trim();
  const next: GalleryPageSettings = {
    heroImage,
    updatedAt: new Date().toISOString(),
  };

  if (hasMongo()) {
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    const update = heroImage
      ? { $set: { id: DOC_ID, ...next, updatedAt: new Date(next.updatedAt) } }
      : {
          $set: { id: DOC_ID, updatedAt: next.updatedAt },
          $unset: { heroImage: "" },
        };
    await db.collection("gallery_page").updateOne({ id: DOC_ID }, update, { upsert: true });
    return next;
  }

  await writeJsonFile(localFile, next);
  return next;
}