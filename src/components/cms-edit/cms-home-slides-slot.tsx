"use client";

/** CMS iframe — 메인 전경 슬라이드 선택 */
export function CmsHomeSlidesSlot() {
  return (
    <button
      type="button"
      data-cms-key="home.slides"
      className="pointer-events-auto absolute left-3 top-20 z-[35] cursor-pointer rounded-md border border-[#b99247]/70 bg-[#fffcf7]/95 px-2 py-1 text-[11px] font-semibold tracking-wide text-[#1f2a44] shadow-sm md:left-4 md:top-24"
      onClick={(e) => e.stopPropagation()}
    >
      전경 슬라이드
    </button>
  );
}