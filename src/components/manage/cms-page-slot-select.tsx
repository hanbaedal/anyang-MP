"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CmsPage } from "@/lib/cms-types";
import { buildPageCmsSlotMeta, type PageCmsSlotKind } from "@/lib/page-cms-slots";
import { cn } from "@/lib/utils";

const KIND_ORDER: Record<PageCmsSlotKind, number> = {
  heroImage: 0,
  title: 1,
  lead: 2,
  body: 3,
  bodyImage: 4,
  itemTitle: 5,
  itemText: 6,
  itemImage: 7,
  funeralDocText: 8,
  funeralDocPdf: 9,
};

export function CmsPageSlotSelect({
  page,
  value,
  disabled,
  onChange,
}: {
  page: CmsPage;
  value: string;
  disabled?: boolean;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = useMemo(() => buildPageCmsSlotMeta(page), [page]);
  const keys = useMemo(
    () =>
      Object.keys(meta).sort((a, b) => {
        const ka = meta[a]?.kind ?? "itemTitle";
        const kb = meta[b]?.kind ?? "itemTitle";
        const oa = KIND_ORDER[ka] ?? 50;
        const ob = KIND_ORDER[kb] ?? 50;
        if (oa !== ob) return oa - ob;
        return a.localeCompare(b, "ko");
      }),
    [meta],
  );
  const currentLabel = meta[value]?.label ?? "슬롯 선택";

  function pick(key: string) {
    onChange(key);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        className="cms-home-slot-select flex h-10 w-full items-center justify-between gap-2 rounded-md border-2 border-primary/40 bg-card px-3 text-left shadow-sm disabled:opacity-50"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="shrink-0 text-sm font-semibold text-primary">편집 슬롯</span>
        <span className="min-w-0 truncate text-sm font-medium text-foreground">{currentLabel}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(90vh,640px)] gap-3 overflow-hidden p-4 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-primary">편집 슬롯</DialogTitle>
            <DialogDescription className="sr-only">수정할 영역 선택</DialogDescription>
          </DialogHeader>
          <ul className="max-h-[min(60vh,480px)] space-y-1 overflow-y-auto pr-1">
            {keys.map((key) => {
              const selected = key === value;
              return (
                <li key={key}>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-md border-2 px-3 py-2.5 text-left text-sm transition",
                      selected
                        ? "border-primary bg-primary/5 font-medium text-foreground"
                        : "border-transparent text-foreground hover:border-primary/30 hover:bg-accent/50",
                    )}
                    onClick={() => pick(key)}
                  >
                    {meta[key]?.label ?? key}
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}