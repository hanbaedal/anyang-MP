"use client";

import { HOME_HERO_FONT_OPTIONS, type HomeHeroFontPreset } from "@/lib/home-hero-text-style";

export function CmsFontPick({
  value,
  disabled,
  onChange,
}: {
  value: HomeHeroFontPreset;
  disabled?: boolean;
  onChange: (value: HomeHeroFontPreset) => void;
}) {
  const label =
    HOME_HERO_FONT_OPTIONS.find((o) => o.id === value)?.label ??
    HOME_HERO_FONT_OPTIONS.find((o) => o.id === "default")?.label;

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-foreground">글자 폰트</span>
      <select
        className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as HomeHeroFontPreset)}
      >
        {HOME_HERO_FONT_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      <p className="text-[10px] text-muted-foreground">현재: {label}</p>
    </div>
  );
}