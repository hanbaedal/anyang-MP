import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import { getDb, hasMongo } from "./mongo";

/** 공개 공지 목록 페이지 공통(페이지 단위) 설정 — 글별 썸네일 아님 */
export type NoticesPageSettings = {
  /** 상단 배너 배경 */
  heroImage: string;
  /** 목록 좌측 큰 사진 (갤러리 연결) */
  listImage: string;
  galleryId: string;
  updatedAt: string;
};

const localFile = dataFile("notices-page.local.json");
const DOC_ID = "notices-page";

const empty: NoticesPageSettings = {
  heroImage: "",
  listImage: "",
  galleryId: "",
  updatedAt: "",
};

function fromDoc(doc: Record<string, unknown> | null | undefined): NoticesPageSettings {
  if (!doc) return { ...empty };
  return {
    heroImage: String(doc.heroImage ?? "").trim(),
    listImage: String(doc.listImage ?? "").trim(),
    galleryId: String(doc.galleryId ?? "").trim(),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt ?? ""),
  };
}

export async function getNoticesPageSettings(): Promise<NoticesPageSettings> {
  if (hasMongo()) {
    try {
      const db = await getDb();
      if (db) {
        const row = await db.collection("notices_page").findOne({ id: DOC_ID });
        if (row) return fromDoc(row as Record<string, unknown>);
      }
    } catch (error) {
      console.error("[notices-page] mongo read failed, using file fallback", error);
    }
  }
  return fromDoc(await readJsonFile<NoticesPageSettings | null>(localFile, null));
}

/** 공지 본문(목록) 좌측 사진 제거 — DB에 남아 있으면 한 번 비움 */
export async function clearNoticesListImage(): Promise<void> {
  const prev = await getNoticesPageSettings();
  if (!prev.listImage?.trim() && !prev.galleryId?.trim()) return;
  await saveNoticesPageSettings({ listImage: "", galleryId: "" });
}

export async function saveNoticesPageSettings(input: {
  heroImage?: string;
  listImage?: string;
  galleryId?: string;
}): Promise<NoticesPageSettings> {
  const prev = await getNoticesPageSettings();
  const heroImage = input.heroImage !== undefined ? String(input.heroImage).trim() : prev.heroImage;
  const listImage = input.listImage !== undefined ? String(input.listImage).trim() : prev.listImage;
  const galleryId = input.galleryId !== undefined ? String(input.galleryId).trim() : prev.galleryId;
  const next: NoticesPageSettings = {
    heroImage,
    listImage,
    galleryId,
    updatedAt: new Date().toISOString(),
  };

  if (hasMongo()) {
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    const $unset: Record<string, ""> = {};
    if (!next.heroImage) $unset.heroImage = "";
    if (!next.listImage) $unset.listImage = "";
    if (!next.galleryId) $unset.galleryId = "";
    const setDoc = { id: DOC_ID, ...next, updatedAt: new Date(next.updatedAt) };
    const update = Object.keys($unset).length ? { $set: setDoc, $unset } : { $set: setDoc };
    await db.collection("notices_page").updateOne({ id: DOC_ID }, update, { upsert: true });
    return next;
  }

  await writeJsonFile(localFile, next);
  return next;
}
