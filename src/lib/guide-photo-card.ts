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

/** 제목·문단 한 덩어리용 — 블러·얇은 링·둥근 모서리 */
export function guideCardPhotoTextHighlight() {
  return cn(
    "rounded-lg bg-[#fffcf7]/88 px-2.5 py-1.5",
    "shadow-[0_4px_22px_rgba(0,43,80,0.14),0_0_0_1px_rgba(255,255,255,0.55)]",
    "backdrop-blur-[12px] backdrop-saturate-150",
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