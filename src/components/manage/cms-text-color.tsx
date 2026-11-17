"use client";

import {
  HOME_HERO_COLOR_PALETTE,
  heroTextColorIsActive,
  normalizeHeroTextColorValue,
} from "@/lib/home-hero-text-style";
import { cn } from "@/lib/utils";

export function CmsTextColor({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const active = normalizeHeroTextColorValue(value);

  return (
    <div className="space-y-2">
      <div>
        <span className="text-sm font-semibold text-primary">글자 컬러</span>
        <p className="text-[10px] text-muted-foreground">
          미리보기에 반영됩니다. 저장 버튼으로 확정하세요.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {HOME_HERO_COLOR_PALETTE.map((opt) => {
          const selected = heroTextColorIsActive(value, opt.hex);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              className={cn(
                "flex flex-col items-stretch gap-1 rounded-md border-2 bg-card p-1.5 text-center transition",
                selected ? "border-primary shadow-sm" : "border-transparent hover:border-primary/30",
              )}
              onClick={() => onChange(opt.hex)}
              aria-pressed={selected}
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">{active ? `선택: ${active}` : "테마 기본색"}</p>
        <button
          type="button"
          className="text-[10px] text-primary underline-offset-2 hover:underline disabled:opacity-50"
          disabled={disabled || !active}
          onClick={() => onChange("")}
        >
          테마 기본으로
        </button>
      </div>
    </div>
  );
}