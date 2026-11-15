"use client";

import { HOME_SOCIAL_ADD_SLOT } from "@/lib/site-social";
import { cn } from "@/lib/utils";

/** CMS — SNS 항목 추가 */
export function CmsSocialAddSlot({ compact }: { compact?: boolean }) {
  return (
    <button
      type="button"
      data-cms-key={HOME_SOCIAL_ADD_SLOT}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-dashed border-[#b99247] bg-[#fffcf7]/95 text-xs font-semibold text-[#1f2a44] shadow-sm ring-1 ring-black/5",
        compact ? "size-8 md:size-11" : "size-12",
      )}
      title="SNS 아이콘 추가"
      onClick={(e) => e.stopPropagation()}
    >
      +
    </button>
  );
}