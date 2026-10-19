import { randomBytes } from "node:crypto";
import { MANAGE_IMAGE_MAX_BYTES, MANAGE_IMAGE_MAX_MB } from "@/lib/image-upload-limits";
import { saveUploadImageWithThumb } from "@/lib/upload-image-thumb";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function saveManageUpload(file: File): Promise<{ ok: true; src: string } | { ok: false; error: string }> {
  if (!file || file.size < 1) {
    return { ok: false, error: "사진 파일을 선택해 주세요." };
  }
  if (file.size > MANAGE_IMAGE_MAX_BYTES) {
    return { ok: false, error: `사진은 ${MANAGE_IMAGE_MAX_MB}MB 이하만 올릴 수 있습니다.` };
  }
  const type = file.type;
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : type === "image/gif" ? "gif" : "jpg";
  if (!ALLOWED.includes(type) && !file.name.match(/\.(jpe?g|png|webp|gif)$/i)) {
    return { ok: false, error: "JPG, PNG, WebP, GIF만 올릴 수 있습니다." };
  }
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { src } = await saveUploadImageWithThumb(name, buf);
  return { ok: true, src };
}
