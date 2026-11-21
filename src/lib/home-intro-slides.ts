import { randomUUID } from "node:crypto";
import type { ViewSlide } from "@/components/home-view-slides";
import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import {
  defaultHomeHeroTextScale,
  defaultHomeIntroHeroCopy,
  HOME_HERO_TEXT_SCALE_MAX,
  HOME_HERO_TEXT_SCALE_MIN,
  HOME_INTRO_HERO_COPY_LIMITS,
  HOME_INTRO_SLIDE_FALLBACK_ALT,
  HOME_INTRO_SLIDE_FALLBACK_SRC,
  HOME_INTRO_SLIDES_MAX,
  isPersistableHomeIntroSlideSrc,
  type HomeHeroTextScale,
  type HomeIntroHeroCopy,
  type HomeIntroSlide,
  type HomeIntroSlidesSettings,
} from "./home-intro-slides-types";
import { getDb, hasMongo } from "./mongo";
import { deleteUploadObject } from "./upload-store";
import {
  defaultHomeHeroTextColor,
  defaultHomeHeroTextFont,
  normalizeHomeHeroTextColor,
  normalizeHomeHeroTextFont,
} from "./home-hero-text-style";
import { defaultSiteSocialLinks, normalizeSiteSocialLinks } from "./site-social";

export type { HomeIntroHeroCopy, HomeIntroSlide, HomeIntroSlidesSettings } from "./home-intro-slides-types";
export {
  defaultHomeIntroHeroCopy,
  HOME_INTRO_HERO_COPY_LIMITS,
  HOME_INTRO_SLIDE_FALLBACK_ALT,
  HOME_INTRO_SLIDE_FALLBACK_SRC,
  HOME_INTRO_SLIDES_MAX,
  HOME_INTRO_SLIDE_SRC_REJECT_MSG,
  isPersistableHomeIntroSlideSrc,
} from "./home-intro-slides-types";

const localFile = dataFile("home-intro-slides.local.json");
const SETTINGS_KEY = "home_intro_slides";

export function defaultHomeIntroSlidesSettings(): HomeIntroSlidesSettings {
  return {
    slides: [],
    heroCopy: defaultHomeIntroHeroCopy(),
    heroTextScale: defaultHomeHeroTextScale(),
    heroTextFont: defaultHomeHeroTextFont(),
    heroTextColor: defaultHomeHeroTextColor(),
    socialLinks: defaultSiteSocialLinks(),
    updatedAt: new Date().toISOString(),
  };
}

function clampScale(n: number) {
  return Math.min(HOME_HERO_TEXT_SCALE_MAX, Math.max(HOME_HERO_TEXT_SCALE_MIN, Math.round(n / 10) * 10));
}

export function normalizeHomeHeroTextScale(raw: unknown): HomeHeroTextScale {
  const base = defaultHomeHeroTextScale();
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Record<string, unknown>;
  return {
    kicker: clampScale(Number(row.kicker ?? base.kicker)),
    heroLine1: clampScale(Number(row.heroLine1 ?? base.heroLine1)),
    heroLine2: clampScale(Number(row.heroLine2 ?? base.heroLine2)),
    lead: clampScale(Number(row.lead ?? base.lead)),
  };
}

function trimHeroField(value: unknown, max: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

export function normalizeHomeIntroHeroCopy(raw: unknown): HomeIntroHeroCopy {
  const base = defaultHomeIntroHeroCopy();
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Record<string, unknown>;
  return {
    kicker: trimHeroField(row.kicker, HOME_INTRO_HERO_COPY_LIMITS.kicker) || base.kicker,
    heroLine1: trimHeroField(row.heroLine1, HOME_INTRO_HERO_COPY_LIMITS.heroLine1) || base.heroLine1,
    heroLine2: trimHeroField(row.heroLine2, HOME_INTRO_HERO_COPY_LIMITS.heroLine2) || base.heroLine2,
    lead: trimHeroField(row.lead, HOME_INTRO_HERO_COPY_LIMITS.lead) || base.lead,
  };
}

/** 공개 표시·폴백 포함. 저장 가능 여부는 isPersistableHomeIntroSlideSrc. */
export function isSafeHomeIntroSlideSrc(src: string): boolean {
  return isPersistableHomeIntroSlideSrc(src);
}

function normalizeSlide(raw: unknown, index: number): HomeIntroSlide | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const src = String(row.src ?? "").trim();
  // AMP-157: 갤러리 /images 시드와 업로드 경로를 동일 allowlist로 저장
  if (!isPersistableHomeIntroSlideSrc(src)) return null;
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
    heroCopy: normalizeHomeIntroHeroCopy(doc.heroCopy),
    heroTextScale: normalizeHomeHeroTextScale(doc.heroTextScale),
    heroTextFont: normalizeHomeHeroTextFont(doc.heroTextFont),
    heroTextColor: normalizeHomeHeroTextColor(doc.heroTextColor),
    socialLinks: normalizeSiteSocialLinks(doc.socialLinks),
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

/** 공개 홈용. Mongo 읽기 실패 시에만 로컬·기본값. 저장 API에서는 쓰지 말 것. */
export async function getHomeIntroSlidesSettings(): Promise<HomeIntroSlidesSettings> {
  if (hasMongo()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const fromMongo = await readFromMongo();
        if (fromMongo) return fromMongo;
      } catch (error) {
        console.error("[home-intro-slides] mongo read failed", error);
        if (attempt === 1) break;
      }
      await new Promise((r) => setTimeout(r, 250));
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
    heroCopy: normalizeHomeIntroHeroCopy(input.heroCopy),
    heroTextScale: normalizeHomeHeroTextScale(input.heroTextScale),
    heroTextFont: normalizeHomeHeroTextFont(input.heroTextFont),
    heroTextColor: normalizeHomeHeroTextColor(input.heroTextColor),
    socialLinks: normalizeSiteSocialLinks(input.socialLinks),
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
          heroCopy: settings.heroCopy,
          heroTextScale: settings.heroTextScale,
          heroTextFont: settings.heroTextFont,
          heroTextColor: settings.heroTextColor,
          socialLinks: settings.socialLinks,
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

export function homeIntroSlidesToViewSlides(settings: HomeIntroSlidesSettings): ViewSlide[] {
  if (settings.slides.length > 0) {
    return settings.slides.map((s) => ({ src: s.src, alt: s.alt }));
  }
  return [{ src: HOME_INTRO_SLIDE_FALLBACK_SRC, alt: HOME_INTRO_SLIDE_FALLBACK_ALT }];
}

/** 공개 홈에 넘길 ViewSlide[] — 등록 없으면 05.jpg 한 장 */
export async function getHomeIntroSlidesForPublic(): Promise<ViewSlide[]> {
  const settings = await getHomeIntroSlidesSettings();
  return homeIntroSlidesToViewSlides(settings);
}
