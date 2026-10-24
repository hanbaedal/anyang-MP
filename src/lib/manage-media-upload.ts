import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  HOME_HERO_AUDIO_MAX_BYTES,
  HOME_HERO_AUDIO_MAX_LABEL,
  HOME_HERO_VIDEO_MAX_BYTES,
  HOME_HERO_VIDEO_MAX_LABEL,
} from "./home-hero-types";
import { hasMongo } from "./mongo";
import { putUploadObject } from "./upload-store";

export async function saveHomeHeroUpload(
  file: File,
  kind: "video" | "audio",
): Promise<{ ok: true; src: string } | { ok: false; error: string }> {
  if (!(file instanceof File) || file.size < 1) {
    return { ok: false, error: "파일을 선택해 주세요." };
  }
  const max = kind === "video" ? HOME_HERO_VIDEO_MAX_BYTES : HOME_HERO_AUDIO_MAX_BYTES;
  const maxLabel = kind === "video" ? HOME_HERO_VIDEO_MAX_LABEL : HOME_HERO_AUDIO_MAX_LABEL;
  if (file.size > max) {
    return { ok: false, error: `${kind === "video" ? "동영상" : "음악"}은 ${maxLabel} 이하만 올릴 수 있습니다.` };
  }

  const type = file.type;
  if (kind === "video") {
    const okType = type === "video/mp4" || type === "video/webm" || file.name.match(/\.(mp4|webm)$/i);
    if (!okType) return { ok: false, error: "MP4 또는 WebM 동영상만 올릴 수 있습니다." };
  } else {
    const okType =
      type === "audio/mpeg" ||
      type === "audio/mp3" ||
      type === "audio/wav" ||
      type === "audio/x-wav" ||
      file.name.match(/\.(mp3|wav|m4a)$/i);
    if (!okType) return { ok: false, error: "MP3·WAV·M4A 음악만 올릴 수 있습니다." };
  }

  const ext =
    kind === "video"
      ? file.name.match(/\.webm$/i) || type === "video/webm"
        ? "webm"
        : "mp4"
      : file.name.match(/\.wav$/i) || type.includes("wav")
        ? "wav"
        : file.name.match(/\.m4a$/i)
          ? "m4a"
          : "mp3";

  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const src = `/uploads/home-hero/${name}`;
  const key = `uploads/home-hero/${name}`;

  if (hasMongo()) {
    try {
      await putUploadObject(key, buf, type || undefined);
      return { ok: true, src };
    } catch (error) {
      console.error("[home-hero-upload] gridfs failed", error);
      return { ok: false, error: "파일 저장에 실패했습니다. MongoDB 연결을 확인해 주세요." };
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads", "home-hero");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return { ok: true, src };
}
