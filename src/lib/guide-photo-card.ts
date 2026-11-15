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

/** 갤러리 사진 위 제목·본문 — 불투명에 가까운 크림 패널 (가독성 우선) */
export function guideCardPhotoCopyPanel({ dense }: { dense?: boolean } = {}) {
  return cn(
    "flex w-full flex-col border border-[color:var(--pastel-chrome-border)]",
    "rounded-xl bg-[#fffcf7]/97 shadow-[0_8px_28px_rgba(0,43,80,0.18)] backdrop-blur-md",
    dense ? "gap-1.5 p-3.5 sm:gap-2 sm:p-4" : "gap-2.5 p-4 sm:gap-3 sm:p-5 md:p-6",
  );
}

/** 사진 하단만 살짝 어둡게 — 패널과 분리용 */
export const GUIDE_CARD_PHOTO_FOOT_SCRIM =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[8] h-[45%] bg-gradient-to-t from-black/30 via-black/8 to-transparent";

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