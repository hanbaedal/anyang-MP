import { randomUUID } from "node:crypto";
import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import type { HomeHeroSet, HomeHeroSettings } from "./home-hero-types";
import { HOME_HERO_MAX_SETS, HOME_HERO_UNPUBLISHED } from "./home-hero-types";
import { getDb, hasMongo } from "./mongo";
import { deleteUploadObject } from "./upload-store";

export type { HomeHeroSet, HomeHeroSettings } from "./home-hero-types";
export { HOME_HERO_MAX_SETS, HOME_HERO_UNPUBLISHED } from "./home-hero-types";

const localFile = dataFile("home-hero.local.json");
const SETTINGS_KEY = "home_hero";

function builtinSet(now: string): HomeHeroSet {
  return {
    id: "builtin-set",
    label: "기본",
    videoSrc: "/videos/home-hero.mp4",
    audioSrc: "/audio/home-bgm.mp3",
    videoLabel: "기본 배포 영상",
    audioLabel: "기본 배포 음악",
    createdAt: now,
  };
}

export function defaultHomeHeroSettings(): HomeHeroSettings {
  const now = new Date().toISOString();
  const set = builtinSet(now);
  return {
    sets: [set],
    activeSetId: set.id,
    posterSrc: "/images/hero.jpg",
    updatedAt: now,
    videoSrc: set.videoSrc,
    audioSrc: set.audioSrc,
  };
}

export function isSafeHomeMediaPath(src: string) {
  if (!src.startsWith("/") || src.includes("..")) return false;
  return /^\/(videos|audio|uploads|api\/uploads|images)\//.test(src);
}

function applyActive(settings: Omit<HomeHeroSettings, "videoSrc" | "audioSrc"> & Partial<Pick<HomeHeroSettings, "videoSrc" | "audioSrc">>): HomeHeroSettings {
  const sets = settings.sets.slice(0, HOME_HERO_MAX_SETS);
  const posterSrc = isSafeHomeMediaPath(settings.posterSrc) ? settings.posterSrc : "/images/hero.jpg";
  const updatedAt = settings.updatedAt || new Date().toISOString();
  const builtin = builtinSet(updatedAt);

  // 등록 세트 없음·전부 비공개 → 홈은 기본 배포 미디어 (관리 목록에 builtin을 다시 넣지 않음)
  if (!sets.length || settings.activeSetId === HOME_HERO_UNPUBLISHED) {
    return {
      sets,
      activeSetId: HOME_HERO_UNPUBLISHED,
      posterSrc,
      updatedAt,
      videoSrc: builtin.videoSrc,
      audioSrc: builtin.audioSrc,
    };
  }

  const active = sets.find((s) => s.id === settings.activeSetId) || sets[0]!;
  return {
    sets,
    activeSetId: active.id,
    posterSrc,
    updatedAt,
    videoSrc: active.videoSrc,
    audioSrc: active.audioSrc || "",
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

/** 구형(단일 슬롯·videos/audios) 문서를 세트 목록으로 변환 */
function migrateLegacyDoc(doc: Record<string, unknown>): HomeHeroSet[] {
  const fromSets = Array.isArray(doc.sets)
    ? (doc.sets.map(normalizeSet).filter(Boolean) as HomeHeroSet[])
    : [];
  if (fromSets.length) return fromSets.slice(0, HOME_HERO_MAX_SETS);

  const videoSrc = String(doc.videoSrc ?? "");
  if (isSafeHomeMediaPath(videoSrc)) {
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
        id: String(videoMeta?.id || "legacy-set"),
        label: String(videoMeta?.label ?? "").trim() || "현재",
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
  // 빈 문자열 = 의도적 비공개. 문서에 키가 없으면 첫 세트(또는 비공개).
  const activeSetId =
    rawActive === HOME_HERO_UNPUBLISHED || rawActive === "none"
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
 * 타임아웃 기본값으로 기존 세트를 지우는 일을 막는다.
 */
export async function getHomeHeroSettingsForWrite(): Promise<HomeHeroSettings> {
  if (hasMongo()) {
    try {
      const fromMongo = await readHomeHeroFromMongo();
      if (fromMongo) return fromMongo;
      // 문서가 아직 없으면 기본 세트로 시작(첫 저장)
      return defaultHomeHeroSettings();
    } catch (error) {
      console.error("[home-hero] mongo write-read failed", error);
      throw new Error("데이터베이스에서 설정을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }
  const local = await readLocal();
  return local ? fromDoc(local as unknown as Record<string, unknown>) : defaultHomeHeroSettings();
}

export async function saveHomeHeroSettings(input: HomeHeroSettings): Promise<HomeHeroSettings> {
  const settings = applyActive({
    ...input,
    sets: input.sets
      .map(normalizeSet)
      .filter((s): s is HomeHeroSet => Boolean(s))
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
  if (!next.videoSrc || !isSafeHomeMediaPath(next.videoSrc)) {
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
  // 첫 사용자 세트면 공개 대상을 새 세트로
  const activeSetId = settings.sets.length === 0 || settings.activeSetId === "builtin-set" ? set.id : settings.activeSetId;

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
  if (!next.videoSrc || !isSafeHomeMediaPath(next.videoSrc)) {
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

/** 홈 공개 해제 — 홈은 기본 배포 영상·음악으로 돌아감 */
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
    // 파일 정리 실패해도 메타 삭제는 진행 (삭제 UX가 막히지 않게)
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
