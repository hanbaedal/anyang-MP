import { MANAGE_IMAGE_MAX_BYTES, MANAGE_IMAGE_MAX_MB } from "@/lib/image-upload-limits";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요."));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function supportsWebp(): boolean {
  try {
    return document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

/**
 * If the file is already ≤ maxBytes, returns it unchanged.
 * Otherwise resizes / re-encodes (WebP or JPEG) until ≤ maxBytes.
 */
export async function ensureImageWithinMaxBytes(
  file: File,
  maxBytes: number = MANAGE_IMAGE_MAX_BYTES,
): Promise<{ file: File; compressed: boolean }> {
  if (!(file instanceof File) || file.size < 1) {
    throw new Error("사진 파일을 선택해 주세요.");
  }
  if (file.size <= maxBytes) {
    return { file, compressed: false };
  }

  const img = await loadImage(file);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (!width || !height) {
    throw new Error("이미지 크기를 확인할 수 없습니다. 다른 파일을 선택해 주세요.");
  }

  const maxDim = 4096;
  if (Math.max(width, height) > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const useWebp = supportsWebp();
  const mime = useWebp ? "image/webp" : "image/jpeg";
  const ext = useWebp ? "webp" : "jpg";

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("이 브라우저에서는 이미지 압축을 지원하지 않습니다.");
  }

  const qualities = [0.92, 0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25];

  for (let scale = 1; scale >= 0.3; scale *= 0.85) {
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, mime, quality);
      if (!blob) continue;
      if (blob.size <= maxBytes) {
        const base = file.name.replace(/\.[^.]+$/, "") || "photo";
        const next = new File([blob], `${base}.${ext}`, { type: mime, lastModified: Date.now() });
        return { file: next, compressed: true };
      }
    }
  }

  throw new Error(
    `${MANAGE_IMAGE_MAX_MB}MB 이하로 줄이지 못했습니다. 해상도가 더 낮은 사진을 선택해 주세요.`,
  );
}
