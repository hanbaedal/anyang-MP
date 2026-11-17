"use client";

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
  const visibleOptions = HOME_HERO_FONT_OPTIONS.filter((o) => o.id !== "default");

  return (
    <div className="space-y-2">
      <div>
        <span className="text-sm font-semibold text-primary">글자 폰트</span>
        <p className="text-[10px] text-muted-foreground">
          미리보기에 반영됩니다. 저장 버튼으로 확정하세요.
        </p>
      </div>
      <ul className="space-y-1.5 rounded-md border border-border bg-card p-1.5">
        <li>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-md border-2 px-2.5 py-2 text-left transition",
              value === "default"
                ? "border-primary bg-primary/5"
                : "border-transparent hover:border-primary/25",
            )}
            onClick={() => onChange("default")}
          >
            <span className="text-xs font-medium text-foreground">기본</span>
            <span className="text-sm text-muted-foreground">{HOME_HERO_FONT_PREVIEW}</span>
          </button>
        </li>
        {visibleOptions.map((opt) => {
          const selected = value === opt.id;
          const previewStyle = homeHeroFontPresetCss(opt.id);
          return (
            <li key={opt.id}>
              <button
                type="button"
                disabled={disabled}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md border-2 px-2.5 py-2 text-left transition",
                  selected ? "border-primary bg-primary/5 shadow-sm" : "border-transparent hover:border-primary/25",
                )}
                onClick={() => onChange(opt.id)}
                aria-pressed={selected}
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
    </div>
  );
}