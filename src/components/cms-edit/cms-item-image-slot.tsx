import { pageSlotItemImage } from "@/lib/page-cms-slots";
import { cn } from "@/lib/utils";

/** CMS iframe — 카드 우측 상단 「사진」만 클릭 (전체 덮기 없음 → 제목·본문 편집 가능) */
export function CmsItemImageSlot({
  cmsSlug,
  itemId,
  className,
}: {
  cmsSlug: string;
  itemId: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-cms-key={pageSlotItemImage(cmsSlug, itemId)}
      className={cn(
        "pointer-events-auto absolute right-2 top-2 z-[35] cursor-pointer rounded-md border border-[#b99247]/70 bg-[#fffcf7]/95 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#1f2a44] shadow-sm",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      사진
    </button>
  );
}