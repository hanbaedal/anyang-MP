import { cn } from "@/lib/utils";

/** 공개 화면 — 이미지·영상 확대 모달 공통 폭 (1136px) */
export const SITE_MEDIA_MODAL_SHELL = cn(
  "!top-[50%] !left-[50%] z-50 !flex !flex-col !translate-x-[-50%] !translate-y-[-50%]",
  "w-[min(calc(100%-1.5rem),var(--site-content-max))] !max-w-[var(--site-content-max)]",
  "max-h-[min(92vh,calc(var(--site-content-max)*1.05))] flex-col gap-0 overflow-hidden",
  "rounded-lg border-0 bg-black/92 p-2 shadow-xl sm:p-3",
  "[&_[data-slot=dialog-close]]:right-2 [&_[data-slot=dialog-close]]:top-2 [&_[data-slot=dialog-close]]:z-20",
  "[&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-white/15 [&_[data-slot=dialog-close]]:p-1.5",
  "[&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:hover:bg-white/25",
);

export const SITE_MEDIA_MODAL_VIEWPORT = cn(
  "relative w-full min-h-[min(45vh,24rem)] touch-none overflow-hidden select-none",
  "max-h-[min(82vh,calc(var(--site-content-max)*0.72))]",
);