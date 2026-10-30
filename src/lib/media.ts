/** Gallery/product image paths. Git stores paths only; files stay in public/ unless IMAGE_CDN_BASE is set. */

/** PPT·구 CMS에 남은 저해상도 경로 → 저장소 내 더 큰 원본 */
const IMAGE_UPGRADES: Record<string, string> = {
  "/images/lawn-2.jpg": "/images/lawn.jpg",
  "/images/columbarium-2.jpg": "/images/columbarium-3.jpg",
  "/images/remodel.jpg": "/images/remodel-3.jpg",
  "/images/gallery-4.jpg": "/images/plots.jpg",
};

export function resolveImagePath(path: string) {
  if (!path) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return IMAGE_UPGRADES[normalized] || normalized;
}

export function imageCdnBase() {
  return (process.env.NEXT_PUBLIC_IMAGE_CDN_BASE || process.env.IMAGE_CDN_BASE || "").replace(/\/$/, "");
}

export function mediaUrl(path: string) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = resolveImagePath(path);
  const base = imageCdnBase();
  return base ? `${base}${normalized}` : normalized;
}

/** 업로드 파일 URL — Render 등에서는 GridFS를 /api/uploads 로 제공 */
export function uploadMediaUrl(relativeUnderUploads: string) {
  const clean = relativeUnderUploads.replace(/^\/+/, "").replace(/^uploads\//, "");
  return mediaUrl(`/api/uploads/${clean}`);
}

/** Public URL for an upload original (`/uploads/…` → `/api/uploads/…`). */
export function uploadOriginalUrl(path: string) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = resolveImagePath(path);
  if (normalized.startsWith("/api/uploads/")) return mediaUrl(normalized);
  if (normalized.startsWith("/uploads/")) {
    return uploadMediaUrl(normalized.replace(/^\/uploads\//, ""));
  }
  return mediaUrl(normalized);
}

/** GridFS `/api/uploads` (or `/uploads`) — already sized; skip Next image optimizer. */
export function isUploadMediaPath(path: string) {
  if (!path) return false;
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return false;
    }
  }
  const normalized = resolveImagePath(path);
  return normalized.startsWith("/uploads/") || normalized.startsWith("/api/uploads/");
}

/** Small thumbnail for 갤러리 grids. Originals stay at the same folder for lightbox. */
export function thumbUrl(path: string) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = resolveImagePath(path);
  if (normalized.startsWith("/uploads/") || normalized.startsWith("/api/uploads/")) {
    let rel = normalized.replace(/^\/(api\/)?uploads\//, "");
    if (rel.startsWith("thumbs/")) rel = rel.slice("thumbs/".length);
    const thumbFile = rel.replace(/\.(png|webp|gif|jpe?g)$/i, ".jpg");
    return uploadMediaUrl(`thumbs/${thumbFile}`);
  }
  const thumb = normalized.replace(/^\/images\//, "/images/thumbs/");
  return mediaUrl(thumb === normalized ? normalized : thumb);
}
