"use client";

import { normalizeHeroTextColorValue } from "@/lib/home-hero-text-style";
import { Button } from "@/components/ui/button";

export function CmsTextColor({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const normalized = normalizeHeroTextColorValue(value);
  const pickerValue = normalized || "#f7f4ee";

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-foreground">글자 컬러</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-9 w-12 shrink-0 cursor-pointer rounded border border-input bg-card p-0.5"
          value={pickerValue}
          disabled={disabled}
          aria-label="글자 색 선택"
          onChange={(e) => onChange(normalizeHeroTextColorValue(e.target.value))}
        />
        <input
          type="text"
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-card px-2 font-mono text-sm"
          placeholder="#ffffff (비우면 기본)"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(normalizeHeroTextColorValue(e.target.value))}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 shrink-0 px-2 text-xs"
          disabled={disabled || !value}
          onClick={() => onChange("")}
        >
          기본
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {normalized ? `적용 색: ${normalized}` : "테마 기본색(흰색 계열)을 사용합니다."}
      </p>
    </div>
  );
}