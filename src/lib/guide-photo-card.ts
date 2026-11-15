import { pastelCardClass } from "@/lib/site";
import { cn } from "@/lib/utils";

/** 홈페이지관리에서 갤러리 사진을 연결했는지 */
export function cardHasGalleryImage(image?: string | null) {
  return Boolean(image?.trim());
}

/** 사진 위 밝은 하늘색 그라데이션 (좌→우 맑게) */
export const GUIDE_CARD_SKY_OVERLAY_FULL =
  "bg-gradient-to-r from-sky-400/40 via-sky-300/18 to-transparent";
export const GUIDE_CARD_SKY_OVERLAY_LEFT =
  "bg-gradient-to-r from-sky-500/26 to-transparent";

export function guideCardPastelSurface(index: number) {
  return cn("border", pastelCardClass(index));
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
    onPhoto && "drop-shadow-[0_1px_2px_rgba(255,255,255,0.88)]",
    dense ? "text-base sm:text-lg" : "text-lg sm:text-xl md:text-[1.35rem]",
  );
}

export function guideCardEyebrowClass(onPhoto: boolean) {
  return cn(
    "font-serif tracking-wide text-[color:var(--pastel-chrome-fg)]/90",
    onPhoto && "drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]",
    "text-sm sm:text-base",
  );
}

export function guideCardBodyTextClass({ onPhoto, dense }: { onPhoto: boolean; dense?: boolean }) {
  return cn(
    "text-[color:var(--pastel-chrome-fg)]/95",
    onPhoto && "drop-shadow-[0_1px_1px_rgba(255,255,255,0.75)]",
    dense
      ? "space-y-1 text-[12px] leading-5 sm:text-[13px] sm:leading-6"
      : "space-y-1.5 text-[13px] leading-6 sm:text-sm sm:leading-7",
  );
}