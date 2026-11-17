"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HOME_CMS_SLOT_KEYS, HOME_CMS_SLOT_META, type HomeCmsSlotKey } from "@/lib/home-cms-slots";
import { cn } from "@/lib/utils";

export function CmsHomeSlotSelect({
  value,
  disabled,
  onChange,
}: {
  value: HomeCmsSlotKey;
  disabled?: boolean;
  onChange: (key: HomeCmsSlotKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel = HOME_CMS_SLOT_META[value].label;

  function pick(key: HomeCmsSlotKey) {
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
        <DialogContent className="gap-3 p-4 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-primary">편집 슬롯</DialogTitle>
            <DialogDescription className="sr-only">수정할 영역 선택</DialogDescription>
          </DialogHeader>
          <ul className="space-y-1">
            {HOME_CMS_SLOT_KEYS.map((key) => {
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
                    {HOME_CMS_SLOT_META[key].label}
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