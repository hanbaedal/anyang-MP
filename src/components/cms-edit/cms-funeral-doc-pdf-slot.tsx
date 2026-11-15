"use client";

import { pageSlotFuneralDocPdf } from "@/lib/funeral-docs-cms";
import type { FuneralDocId } from "@/lib/funeral-docs-types";
import { cn } from "@/lib/utils";

/** CMS iframe — 서류 목록 항목 PDF 등록 */
export function CmsFuneralDocPdfSlot({ docId, className }: { docId: FuneralDocId; className?: string }) {
  return (
    <button
      type="button"
      data-cms-key={pageSlotFuneralDocPdf(docId)}
      className={cn(
        "pointer-events-auto ml-1.5 inline-flex shrink-0 cursor-pointer rounded-md border border-[#b99247]/70 bg-[#fffcf7]/95 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#1f2a44] shadow-sm",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      PDF
    </button>
  );
}