"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  HOME_HERO_COLOR_PALETTE,
  heroTextColorIsActive,
  normalizeHeroTextColorValue,
} from "@/lib/home-hero-text-style";
import { cn } from "@/lib/utils";

const THEME_PREVIEW = "#e8e4dc";

export function CmsTextColor({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = normalizeHeroTextColorValue(value);
  const swatch = active || THEME_PREVIEW;

  function pick(hex: string) {
    onChange(hex);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        className="flex w-full items-center justify-between gap-3 border-b border-border/60 py-2.5 text-left disabled:opacity-50"
        onClick={() => setOpen(true)}
        aria-label="글자 컬러 선택"
      >
        <span className="text-sm font-semibold text-primary">글자 컬러</span>
        <span
          className="h-11 w-11 shrink-0 rounded-xl border border-black/15 shadow-inner"
          style={{ backgroundColor: swatch }}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-3 p-4 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-primary">글자 컬러</DialogTitle>
            <DialogDescription className="sr-only">글자 색 선택</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {HOME_HERO_COLOR_PALETTE.map((opt) => {
              const selected = heroTextColorIsActive(value, opt.hex);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={cn(
                    "flex flex-col items-stretch gap-1 rounded-md border-2 bg-card p-1.5 text-center transition",
                    selected ? "border-primary shadow-sm" : "border-transparent hover:border-primary/30",
                  )}
                  onClick={() => pick(opt.hex)}
                  aria-label={`${opt.label} (${opt.hex})`}
                >
                  <span
                    className="mx-auto aspect-square w-full max-h-10 rounded-sm border border-black/10 shadow-inner"
                    style={{ backgroundColor: opt.hex }}
                  />
                  <span className="text-[10px] leading-tight text-muted-foreground">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="w-full rounded-md border border-input py-2 text-xs text-primary hover:bg-accent"
            onClick={() => pick("")}
          >
            테마 기본색
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}