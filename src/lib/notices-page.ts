import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import { getDb, hasMongo } from "./mongo";

/** 공개 공지 목록 페이지 공통(페이지 단위) 설정 — 글별 썸네일 아님 */
export type NoticesPageSettings = {
  /** 목록 좌측 큰 사진 (갤러리 연결) */
  listImage: string;
  galleryId: string;
  updatedAt: string;
};

const localFile = dataFile("notices-page.local.json");
const DOC_ID = "notices-page";

const empty: NoticesPageSettings = {
  listImage: "",
  galleryId: "",
  updatedAt: "",
};

function fromDoc(doc: Record<string, unknown> | null | undefined): NoticesPageSettings {
  if (!doc) return { ...empty };
  return {
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

export async function saveNoticesPageSettings(input: {
  listImage?: string;
  galleryId?: string;
}): Promise<NoticesPageSettings> {
  const listImage = String(input.listImage ?? "").trim();
  const galleryId = String(input.galleryId ?? "").trim();
  const next: NoticesPageSettings = {
    listImage,
    galleryId,
    updatedAt: new Date().toISOString(),
  };

  if (hasMongo()) {
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    await db.collection("notices_page").updateOne(
      { id: DOC_ID },
      { $set: { id: DOC_ID, ...next, updatedAt: new Date(next.updatedAt) } },
      { upsert: true },
    );
    return next;
  }

  await writeJsonFile(localFile, next);
  return next;
}
