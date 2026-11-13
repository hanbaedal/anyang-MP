import { randomUUID } from "node:crypto";
import type { ViewSlide } from "@/components/home-view-slides";
import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import {
  HOME_INTRO_SLIDE_FALLBACK_ALT,
  HOME_INTRO_SLIDE_FALLBACK_SRC,
  HOME_INTRO_SLIDES_MAX,
  type HomeIntroSlide,
  type HomeIntroSlidesSettings,
} from "./home-intro-slides-types";
import { getDb, hasMongo } from "./mongo";
import { deleteUploadObject } from "./upload-store";

export type { HomeIntroSlide, HomeIntroSlidesSettings } from "./home-intro-slides-types";
export {
  HOME_INTRO_SLIDE_FALLBACK_ALT,
  HOME_INTRO_SLIDE_FALLBACK_SRC,
  HOME_INTRO_SLIDES_MAX,
} from "./home-intro-slides-types";

const localFile = dataFile("home-intro-slides.local.json");
const SETTINGS_KEY = "home_intro_slides";
const READ_MS = 2_500;

export function defaultHomeIntroSlidesSettings(): HomeIntroSlidesSettings {
  return { slides: [], updatedAt: new Date().toISOString() };
}

export function isSafeHomeIntroSlideSrc(src: string): boolean {
  if (!src || src.includes("..")) return false;
  return (
    src.startsWith("/uploads/") ||
    src.startsWith("/api/uploads/") ||
    src === HOME_INTRO_SLIDE_FALLBACK_SRC
  );
}

function normalizeSlide(raw: unknown, index: number): HomeIntroSlide | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const src = String(row.src ?? "");
  if (!isSafeHomeIntroSlideSrc(src) || src === HOME_INTRO_SLIDE_FALLBACK_SRC) return null;
  // 폴백 정적 경로는 저장 목록에 넣지 않음 — 업로드만
  if (!src.startsWith("/uploads/") && !src.startsWith("/api/uploads/")) return null;
  const sort = typeof row.sort === "number" && Number.isFinite(row.sort) ? row.sort : index;
  return {
    id: String(row.id || randomUUID()),
    src,
    alt: String(row.alt ?? "").trim().slice(0, 80) || `메인 전경 ${index + 1}`,
    sort,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt ?? new Date().toISOString()),
  };
}

function fromDoc(doc: Record<string, unknown>): HomeIntroSlidesSettings {
  const rawSlides = Array.isArray(doc.slides) ? doc.slides : [];
  const slides = rawSlides
    .map((row, i) => normalizeSlide(row, i))
    .filter((s): s is HomeIntroSlide => Boolean(s))
    .sort((a, b) => a.sort - b.sort || a.createdAt.localeCompare(b.createdAt))
    .slice(0, HOME_INTRO_SLIDES_MAX)
    .map((s, i) => ({ ...s, sort: i }));
  return {
    slides,
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt ?? new Date().toISOString()),
  };
}

async function readLocal(): Promise<HomeIntroSlidesSettings | null> {
  return readJsonFile<HomeIntroSlidesSettings | null>(localFile, null);
}

async function readFromMongo(): Promise<HomeIntroSlidesSettings | null> {
  const db = await getDb();
  if (!db) return null;
  const row = await db.collection("site_settings").findOne({ key: SETTINGS_KEY });
  return row ? fromDoc(row as Record<string, unknown>) : null;
}

/** 공개 홈용. 느리면 빈 설정 → 폴백 장. 저장 API에서는 쓰지 말 것. */
export async function getHomeIntroSlidesSettings(): Promise<HomeIntroSlidesSettings> {
  if (hasMongo()) {
    try {
      const fromMongo = await Promise.race([
        readFromMongo(),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), READ_MS);
        }),
      ]);
      if (fromMongo) return fromMongo;
    } catch (error) {
      console.error("[home-intro-slides] mongo read failed", error);
    }
  }
  const local = await readLocal();
  return local ? fromDoc(local as unknown as Record<string, unknown>) : defaultHomeIntroSlidesSettings();
}

/** 관리 저장·삭제용. 실패 시 throw. */
export async function getHomeIntroSlidesSettingsForWrite(): Promise<HomeIntroSlidesSettings> {
  if (hasMongo()) {
    try {
      const fromMongo = await readFromMongo();
      return fromMongo ?? defaultHomeIntroSlidesSettings();
    } catch (error) {
      console.error("[home-intro-slides] mongo write-read failed", error);
      throw new Error("데이터베이스에서 설정을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }
  const local = await readLocal();
  return local ? fromDoc(local as unknown as Record<string, unknown>) : defaultHomeIntroSlidesSettings();
}

export async function saveHomeIntroSlidesSettings(
  input: HomeIntroSlidesSettings,
): Promise<HomeIntroSlidesSettings> {
  const settings = fromDoc({
    slides: input.slides,
    updatedAt: new Date().toISOString(),
  });

  if (hasMongo()) {
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    await db.collection("site_settings").updateOne(
      { key: SETTINGS_KEY },
      {
        $set: {
          key: SETTINGS_KEY,
          slides: settings.slides,
          updatedAt: new Date(settings.updatedAt),
        },
      },
      { upsert: true },
    );
    return settings;
  }

  await writeJsonFile(localFile, settings);
  return settings;
}

export async function removeHomeIntroSlideFile(src: string) {
  if (!src.startsWith("/uploads/") && !src.startsWith("/api/uploads/")) return;
  const key = src.replace(/^\/api\//, "").replace(/^\//, "");
  await deleteUploadObject(key);
}

/** 공개 홈에 넘길 ViewSlide[] — 등록 없으면 05.jpg 한 장 */
export async function getHomeIntroSlidesForPublic(): Promise<ViewSlide[]> {
  const settings = await getHomeIntroSlidesSettings();
  if (settings.slides.length > 0) {
    return settings.slides.map((s) => ({ src: s.src, alt: s.alt }));
  }
  return [{ src: HOME_INTRO_SLIDE_FALLBACK_SRC, alt: HOME_INTRO_SLIDE_FALLBACK_ALT }];
}
