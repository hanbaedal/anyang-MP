import { randomUUID } from "node:crypto";
import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import type { HomeHeroSet, HomeHeroSettings } from "./home-hero-types";
import {
  HOME_HERO_MAX_SETS,
  HOME_HERO_TRIMMED_INTRO,
  HOME_HERO_UNPUBLISHED,
  resolvePlayableHomeHeroSrc,
} from "./home-hero-types";
import { getDb, hasMongo } from "./mongo";
import { deleteUploadObject } from "./upload-store";

export type { HomeHeroSet, HomeHeroSettings } from "./home-hero-types";
export {
  HOME_HERO_MAX_SETS,
  HOME_HERO_TRIMMED_INTRO,
  HOME_HERO_UNPUBLISHED,
  resolvePlayableHomeHeroSrc,
} from "./home-hero-types";

const localFile = dataFile("home-hero.local.json");
const SETTINGS_KEY = "home_hero";

/** 홈 폴백 기본 영상 (관리 목록·4세트 카운트에 넣지 않음) */
export const HOME_HERO_BUILTIN_VIDEO = "/static/23838-337674789.mp4";

const BUILTIN_SET_IDS = new Set(["builtin-set", "legacy-set"]);

function builtinMedia() {
  return { videoSrc: HOME_HERO_BUILTIN_VIDEO, audioSrc: "" };
}

/** 직원이 올린 업로드만 등록 세트로 인정 (배포 기본·레거시 경로 제외) */
export function isUploadedHomeHeroSet(set: Pick<HomeHeroSet, "id" | "videoSrc">): boolean {
  if (BUILTIN_SET_IDS.has(set.id)) return false;
  const src = set.videoSrc;
  if (src === HOME_HERO_TRIMMED_INTRO || src.includes("1792833732020-5bf8df7029ab")) {
    return true;
  }
  return src.startsWith("/uploads/home-hero/") || src.startsWith("/api/uploads/home-hero/");
}

export function defaultHomeHeroSettings(): HomeHeroSettings {
  const now = new Date().toISOString();
  const media = builtinMedia();
  return {
    sets: [],
    activeSetId: HOME_HERO_UNPUBLISHED,
    posterSrc: "/images/hero.jpg",
    updatedAt: now,
    videoSrc: media.videoSrc,
    audioSrc: media.audioSrc,
  };
}

export function isSafeHomeMediaPath(src: string) {
  if (!src.startsWith("/") || src.includes("..")) return false;
  return /^\/(static|videos|audio|uploads|api\/uploads|images)\//.test(src);
}

function applyActive(settings: Omit<HomeHeroSettings, "videoSrc" | "audioSrc"> & Partial<Pick<HomeHeroSettings, "videoSrc" | "audioSrc">>): HomeHeroSettings {
  // 업로드 세트만 보관·카운트 (기본/레거시 「현재」 등 제외)
  const sets = settings.sets.filter(isUploadedHomeHeroSet).slice(0, HOME_HERO_MAX_SETS);
  const posterSrc = isSafeHomeMediaPath(settings.posterSrc) ? settings.posterSrc : "/images/hero.jpg";
  const updatedAt = settings.updatedAt || new Date().toISOString();
  const media = builtinMedia();

  const published =
    settings.activeSetId && settings.activeSetId !== HOME_HERO_UNPUBLISHED
      ? sets.find((s) => s.id === settings.activeSetId)
      : undefined;

  if (!published) {
    return {
      sets,
      activeSetId: HOME_HERO_UNPUBLISHED,
      posterSrc,
      updatedAt,
      videoSrc: media.videoSrc,
      audioSrc: media.audioSrc,
    };
  }

  return {
    sets,
    activeSetId: published.id,
    posterSrc,
    updatedAt,
    videoSrc: resolvePlayableHomeHeroSrc(published.videoSrc),
    audioSrc: published.audioSrc || "",
  };
}

function normalizeSet(raw: unknown): HomeHeroSet | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const videoSrc = String(row.videoSrc ?? "");
  if (!isSafeHomeMediaPath(videoSrc)) return null;
  const rawAudio = row.audioSrc;
  const audioSrc =
    rawAudio === "" || rawAudio === null || rawAudio === undefined
      ? ""
      : isSafeHomeMediaPath(String(rawAudio))
        ? String(rawAudio)
        : "";
  const label = String(row.label ?? "").trim() || String(row.videoLabel ?? "").trim() || "세트";
  return {
    id: String(row.id || randomUUID()),
    label: label.slice(0, 40),
    videoSrc,
    audioSrc,
    videoLabel: String(row.videoLabel ?? "").trim() || "영상",
    audioLabel: audioSrc ? String(row.audioLabel ?? "").trim() || "음악" : "",
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt ?? new Date().toISOString()),
  };
}

/** 구형(단일 슬롯·videos/audios) 문서를 세트 목록으로 변환 — 업로드만 남김 */
function migrateLegacyDoc(doc: Record<string, unknown>): HomeHeroSet[] {
  const fromSets = Array.isArray(doc.sets)
    ? (doc.sets.map(normalizeSet).filter(Boolean) as HomeHeroSet[])
    : [];
  if (fromSets.length) {
    return fromSets.filter(isUploadedHomeHeroSet).slice(0, HOME_HERO_MAX_SETS);
  }

  const videoSrc = String(doc.videoSrc ?? "");
  // 예전 단일 슬롯이 업로드가 아니면 「현재」레거시 세트로 만들지 않음
  if (isSafeHomeMediaPath(videoSrc) && isUploadedHomeHeroSet({ id: "legacy-set", videoSrc })) {
    const rawAudio = doc.audioSrc;
    const audioSrc =
      rawAudio === "" || rawAudio === null || rawAudio === undefined
        ? ""
        : isSafeHomeMediaPath(String(rawAudio))
          ? String(rawAudio)
          : "";
    const videos = Array.isArray(doc.videos) ? doc.videos : [];
    const audios = Array.isArray(doc.audios) ? doc.audios : [];
    const videoMeta = videos[0] && typeof videos[0] === "object" ? (videos[0] as Record<string, unknown>) : null;
    const audioMeta = audios[0] && typeof audios[0] === "object" ? (audios[0] as Record<string, unknown>) : null;
    return [
      {
        id: String(videoMeta?.id || randomUUID()),
        label: String(videoMeta?.label ?? "").trim() || "세트",
        videoSrc,
        audioSrc,
        videoLabel: String(videoMeta?.label ?? "").trim() || "영상",
        audioLabel: audioSrc ? String(audioMeta?.label ?? "").trim() || "음악" : "",
        createdAt:
          videoMeta?.createdAt instanceof Date
            ? videoMeta.createdAt.toISOString()
            : String(videoMeta?.createdAt ?? new Date().toISOString()),
      },
    ];
  }

  return [];
}

function fromDoc(doc: Record<string, unknown>): HomeHeroSettings {
  const base = defaultHomeHeroSettings();
  const sets = migrateLegacyDoc(doc);
  const rawActive = doc.activeSetId;
  const activeSetId =
    rawActive === HOME_HERO_UNPUBLISHED || rawActive === "none" || rawActive === "builtin-set" || rawActive === "legacy-set"
      ? HOME_HERO_UNPUBLISHED
      : rawActive === undefined || rawActive === null
        ? sets[0]?.id ?? HOME_HERO_UNPUBLISHED
        : String(rawActive);
  return applyActive({
    sets,
    activeSetId,
    posterSrc: String(doc.posterSrc ?? base.posterSrc),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt ?? base.updatedAt),
  });
}

export async function removeHomeHeroUploadFile(src: string) {
  if (!src.startsWith("/uploads/home-hero/") && !src.startsWith("/api/uploads/home-hero/")) return;
  const key = src.replace(/^\/api\//, "").replace(/^\//, "");
  await deleteUploadObject(key);
}

/** 다른 세트가 쓰지 않는 업로드만 삭제 */
async function removeSetFilesIfUnused(set: HomeHeroSet, remaining: HomeHeroSet[]) {
  const used = new Set(remaining.flatMap((s) => [s.videoSrc, s.audioSrc].filter(Boolean)));
  if (!used.has(set.videoSrc)) await removeHomeHeroUploadFile(set.videoSrc);
  if (set.audioSrc && !used.has(set.audioSrc)) await removeHomeHeroUploadFile(set.audioSrc);
}

async function readLocal(): Promise<HomeHeroSettings | null> {
  return readJsonFile<HomeHeroSettings | null>(localFile, null);
}

const HOME_HERO_READ_MS = 2_500;

async function readHomeHeroFromMongo(): Promise<HomeHeroSettings | null> {
  const db = await getDb();
  if (!db) return null;
  const row = await db.collection("site_settings").findOne({ key: SETTINGS_KEY });
  return row ? fromDoc(row as Record<string, unknown>) : null;
}

/**
 * 홈(공개) 읽기. Mongo가 느리면 기본값으로 빨리 내려 502·장시간 대기를 막는다.
 * 저장·공개·삭제 등 변경 API에서는 쓰지 말 것 — 타임아웃 시 기본값으로 덮어쓸 위험이 있다.
 */
export async function getHomeHeroSettings(): Promise<HomeHeroSettings> {
  if (hasMongo()) {
    try {
      const fromMongo = await Promise.race([
        readHomeHeroFromMongo(),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), HOME_HERO_READ_MS);
        }),
      ]);
      if (fromMongo) return fromMongo;
    } catch (error) {
      console.error("[home-hero] mongo read failed", error);
    }
  }
  const local = await readLocal();
  return local ? fromDoc(local as unknown as Record<string, unknown>) : defaultHomeHeroSettings();
}

/**
 * 관리 저장·공개·삭제용. Mongo에 붙을 때까지 기다리고, 실패하면 throw한다.
 * 읽은 뒤 builtin/레거시 행이 있으면 업로드만 남겨 즉시 저장(프로덕션 정리).
 */
export async function getHomeHeroSettingsForWrite(): Promise<HomeHeroSettings> {
  if (hasMongo()) {
    try {
      const db = await getDb();
      if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
      const row = await db.collection("site_settings").findOne({ key: SETTINGS_KEY });
      if (!row) return defaultHomeHeroSettings();

      const raw = row as Record<string, unknown>;
      const cleaned = fromDoc(raw);
      const rawSets = Array.isArray(raw.sets) ? raw.sets : [];
      const hadNonUpload = rawSets.some((s) => {
        const n = normalizeSet(s);
        return n ? !isUploadedHomeHeroSet(n) : false;
      });
      const activeWasBuiltin =
        raw.activeSetId === "builtin-set" ||
        raw.activeSetId === "legacy-set" ||
        (typeof raw.activeSetId === "string" &&
          raw.activeSetId !== HOME_HERO_UNPUBLISHED &&
          !cleaned.sets.some((s) => s.id === raw.activeSetId) &&
          cleaned.activeSetId === HOME_HERO_UNPUBLISHED);

      if (hadNonUpload || activeWasBuiltin || rawSets.length !== cleaned.sets.length) {
        return saveHomeHeroSettings(cleaned);
      }
      return cleaned;
    } catch (error) {
      console.error("[home-hero] mongo write-read failed", error);
      throw new Error("데이터베이스에서 설정을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }
  const local = await readLocal();
  if (!local) return defaultHomeHeroSettings();
  const cleaned = fromDoc(local as unknown as Record<string, unknown>);
  if ((local.sets?.length ?? 0) !== cleaned.sets.length) {
    return saveHomeHeroSettings(cleaned);
  }
  return cleaned;
}

export async function saveHomeHeroSettings(input: HomeHeroSettings): Promise<HomeHeroSettings> {
  const settings = applyActive({
    ...input,
    sets: input.sets
      .map(normalizeSet)
      .filter((s): s is HomeHeroSet => Boolean(s))
      .filter(isUploadedHomeHeroSet)
      .slice(0, HOME_HERO_MAX_SETS),
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
          sets: settings.sets,
          activeSetId: settings.activeSetId,
          posterSrc: settings.posterSrc,
          videoSrc: settings.videoSrc,
          audioSrc: settings.audioSrc,
          updatedAt: new Date(settings.updatedAt),
        },
        $unset: { videos: "", audios: "" },
      },
      { upsert: true },
    );
    return settings;
  }

  await writeJsonFile(localFile, settings);
  return settings;
}

export async function addHomeHeroSet(
  settings: HomeHeroSettings,
  next: { videoSrc: string; audioSrc: string; label?: string; videoLabel?: string; audioLabel?: string },
): Promise<HomeHeroSettings> {
  if (!next.videoSrc || !isUploadedHomeHeroSet({ id: "x", videoSrc: next.videoSrc })) {
    throw new Error("영상을 등록한 뒤 저장해 주세요.");
  }
  if (next.audioSrc && !isSafeHomeMediaPath(next.audioSrc)) {
    throw new Error("음악 파일 경로가 올바르지 않습니다.");
  }
  if (settings.sets.length >= HOME_HERO_MAX_SETS) {
    throw new Error(`세트는 최대 ${HOME_HERO_MAX_SETS}개까지 등록할 수 있습니다. 하나를 삭제한 뒤 추가해 주세요.`);
  }

  const hasAudio = Boolean(next.audioSrc);
  const set: HomeHeroSet = {
    id: randomUUID(),
    label: (next.label?.trim() || next.videoLabel?.trim() || `세트 ${settings.sets.length + 1}`).slice(0, 40),
    videoSrc: next.videoSrc,
    audioSrc: hasAudio ? next.audioSrc : "",
    videoLabel: next.videoLabel?.trim() || "영상",
    audioLabel: hasAudio ? next.audioLabel?.trim() || "음악" : "",
    createdAt: new Date().toISOString(),
  };

  const sets = [...settings.sets, set];
  // 첫 업로드 세트면 공개
  const activeSetId =
    settings.sets.length === 0 || settings.activeSetId === HOME_HERO_UNPUBLISHED ? set.id : settings.activeSetId;

  return saveHomeHeroSettings({
    ...settings,
    sets,
    activeSetId,
  });
}

export async function replaceHomeHeroSet(
  settings: HomeHeroSettings,
  setId: string,
  next: { videoSrc: string; audioSrc: string; label?: string; videoLabel?: string; audioLabel?: string },
): Promise<HomeHeroSettings> {
  const idx = settings.sets.findIndex((s) => s.id === setId);
  if (idx < 0) throw new Error("선택한 세트를 찾을 수 없습니다.");
  if (!next.videoSrc || !isUploadedHomeHeroSet({ id: "x", videoSrc: next.videoSrc })) {
    throw new Error("영상을 등록한 뒤 저장해 주세요.");
  }
  if (next.audioSrc && !isSafeHomeMediaPath(next.audioSrc)) {
    throw new Error("음악 파일 경로가 올바르지 않습니다.");
  }

  const prev = settings.sets[idx]!;
  const hasAudio = Boolean(next.audioSrc);
  const replaced: HomeHeroSet = {
    ...prev,
    label: (next.label?.trim() || prev.label).slice(0, 40),
    videoSrc: next.videoSrc,
    audioSrc: hasAudio ? next.audioSrc : "",
    videoLabel: next.videoLabel?.trim() || prev.videoLabel || "영상",
    audioLabel: hasAudio ? next.audioLabel?.trim() || "음악" : "",
  };

  const sets = settings.sets.map((s, i) => (i === idx ? replaced : s));
  await removeSetFilesIfUnused(prev, sets);
  return saveHomeHeroSettings({ ...settings, sets });
}

export async function publishHomeHeroSet(settings: HomeHeroSettings, setId: string): Promise<HomeHeroSettings> {
  if (!settings.sets.some((s) => s.id === setId)) {
    throw new Error("선택한 세트를 찾을 수 없습니다.");
  }
  return saveHomeHeroSettings({ ...settings, activeSetId: setId });
}

/** 홈 공개 해제 — 홈은 기본 배포 영상으로 돌아감 */
export async function unpublishHomeHeroSet(settings: HomeHeroSettings): Promise<HomeHeroSettings> {
  return saveHomeHeroSettings({ ...settings, activeSetId: HOME_HERO_UNPUBLISHED });
}

export async function deleteHomeHeroSet(settings: HomeHeroSettings, setId: string): Promise<HomeHeroSettings> {
  const target = settings.sets.find((s) => s.id === setId);
  if (!target) throw new Error("선택한 세트를 찾을 수 없습니다.");

  const sets = settings.sets.filter((s) => s.id !== setId);
  try {
    await removeSetFilesIfUnused(target, sets);
  } catch (error) {
    console.error("[home-hero] set file cleanup failed", error);
  }
  const activeSetId = settings.activeSetId === setId ? HOME_HERO_UNPUBLISHED : settings.activeSetId;
  return saveHomeHeroSettings({ ...settings, sets, activeSetId });
}

export async function renameHomeHeroSet(
  settings: HomeHeroSettings,
  setId: string,
  label: string,
): Promise<HomeHeroSettings> {
  const next = label.trim().slice(0, 40);
  if (!next) throw new Error("세트 이름을 입력해 주세요.");
  if (!settings.sets.some((s) => s.id === setId)) {
    throw new Error("선택한 세트를 찾을 수 없습니다.");
  }
  return saveHomeHeroSettings({
    ...settings,
    sets: settings.sets.map((s) => (s.id === setId ? { ...s, label: next } : s)),
  });
}
