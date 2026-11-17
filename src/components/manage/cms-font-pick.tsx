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
  HOME_HERO_FONT_OPTIONS,
  HOME_HERO_FONT_PREVIEW,
  homeHeroFontPresetCss,
  type HomeHeroFontPreset,
} from "@/lib/home-hero-text-style";
import { cn } from "@/lib/utils";

export function CmsFontPick({
  value,
  disabled,
  onChange,
}: {
  value: HomeHeroFontPreset;
  disabled?: boolean;
  onChange: (value: HomeHeroFontPreset) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentLabel = HOME_HERO_FONT_OPTIONS.find((o) => o.id === value)?.label ?? "기본";
  const visibleOptions = HOME_HERO_FONT_OPTIONS;

  function pick(next: HomeHeroFontPreset) {
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        className="flex w-full items-center justify-between gap-3 border-b border-border/60 py-2.5 text-left disabled:opacity-50"
        onClick={() => setOpen(true)}
      >
        <span className="text-sm font-semibold text-primary">글자 폰트</span>
        <span className="text-sm font-medium text-[#6eb5d9]">({currentLabel})</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(90vh,640px)] gap-3 overflow-hidden p-4 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-primary">글자 폰트</DialogTitle>
            <DialogDescription className="text-xs">
              폰트를 고르면 미리보기에 바로 반영됩니다. 슬롯 패널 하단 「저장」으로 확정하세요.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-[min(60vh,420px)] space-y-1.5 overflow-y-auto rounded-md border border-border bg-card p-1.5">
            {visibleOptions.map((opt) => {
              const selected = value === opt.id;
              const previewStyle = homeHeroFontPresetCss(opt.id);
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md border-2 px-2.5 py-2 text-left transition",
                      selected ? "border-primary bg-primary/5 shadow-sm" : "border-transparent hover:border-primary/25",
                    )}
                    onClick={() => pick(opt.id)}
                  >
                    <span className="text-xs font-medium text-foreground">{opt.label}</span>
                    <span className="text-sm text-[#5b84b1]" style={previewStyle}>
                      {HOME_HERO_FONT_PREVIEW}
                    </span>
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