import { pastelCardClass } from "@/lib/site";
import { cn } from "@/lib/utils";

/** 홈페이지관리에서 갤러리 사진을 연결했는지 */
export function cardHasGalleryImage(image?: string | null) {
  return Boolean(image?.trim());
}

/** @deprecated 사진 카드는 `guideCardPhotoCopyPanel` 사용 — 그라데이션만으로는 대비 부족 */
export const GUIDE_CARD_SKY_OVERLAY_FULL =
  "bg-gradient-to-r from-sky-400/40 via-sky-300/18 to-transparent";
export const GUIDE_CARD_SKY_OVERLAY_LEFT =
  "bg-gradient-to-r from-sky-500/26 to-transparent";

/**
 * 사진 위 텍스트 — 카드 전체가 아니라 **글·줄 단위** 배경 (box-decoration-break).
 * 큰 사각 박스 대신 사진이 많이 보이도록.
 */
export function guideCardPhotoCopyWrap({ dense }: { dense?: boolean } = {}) {
  return cn(
    "guide-card-photo-copy-wrap flex w-fit max-w-[min(100%,32rem)] flex-col",
    dense ? "gap-1.5" : "gap-2",
  );
}

/** 사진 위 제목·문단 — 배경·그림자 없음(투명) */
export function guideCardPhotoTextHighlight() {
  return cn(
    "bg-transparent shadow-none",
    "[box-decoration-break:clone] [-webkit-box-decoration-break:clone]",
  );
}

/** @deprecated — `guideCardPhotoCopyWrap` + `guideCardPhotoTextHighlight` 사용 */
export function guideCardPhotoCopyPanel(opts?: { dense?: boolean }) {
  return guideCardPhotoCopyWrap(opts);
}

/** 사진 하단 은은한 비네팅 — 텍스트 가독 보조 */
export const GUIDE_CARD_PHOTO_FOOT_SCRIM =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[8] h-[38%] bg-gradient-to-t from-black/22 via-black/5 to-transparent";

export function guideCardPastelSurface(index: number) {
  return cn("border", pastelCardClass(index));
}

/** 공원특징 2×2 — 무지개 파스텔 4색 (연한 톤, 좌상·우상·좌하·우하) */
export const FEATURE_RAINBOW_PASTELS = [
  "border-[#d4ebf2] bg-[#eef9fc]",
  "border-[#ddd9f0] bg-[#f0eff9]",
  "border-[#e6ecc8] bg-[#f4f7e8]",
  "border-[#d0e8f4] bg-[#eaf6fc]",
] as const;

export function featureRainbowPastelClass(index: number) {
  return cn("border", FEATURE_RAINBOW_PASTELS[index % FEATURE_RAINBOW_PASTELS.length]!);
}

export function guideCardTitleClass({
  onPhoto,
  dense,
}: {
  onPhoto: boolean;
  dense?: boolean;
}) {
  return cn(
    "font-semibold leading-snug tracking-tight text-[color:var(--pastel-chrome-fg)]",
    dense ? "text-base sm:text-lg" : "text-lg sm:text-xl md:text-[1.35rem]",
  );
}

export function guideCardEyebrowClass(onPhoto: boolean) {
  return cn(
    "font-serif tracking-wide text-[color:var(--pastel-chrome-fg)]/90",
    "text-sm sm:text-base",
  );
}

export function guideCardBodyTextClass({ onPhoto, dense }: { onPhoto: boolean; dense?: boolean }) {
  return cn(
    "text-[color:var(--pastel-chrome-fg)]/95",
    dense
      ? "space-y-1 text-[12px] leading-5 sm:text-[13px] sm:leading-6"
      : "space-y-1.5 text-[13px] leading-6 sm:text-sm sm:leading-7",
  );
}