"use client";

import { Button } from "@/components/ui/button";

const MIN = 50;
const MAX = 300;
const STEP = 10;

export function CmsFontScale({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  function bump(delta: number) {
    const next = Math.min(MAX, Math.max(MIN, Math.round((value + delta) / STEP) * STEP));
    onChange(next);
  }

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-foreground">글자 크기</span>
      <div className="flex items-center gap-2 rounded-md border border-input bg-card px-2 py-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 w-8 shrink-0 px-0"
          disabled={disabled || value <= MIN}
          onClick={() => bump(-STEP)}
          aria-label="글자 작게"
        >
          −
        </Button>
        <span className="min-w-[3.5rem] text-center text-sm font-semibold tabular-nums text-primary">{value}%</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 w-8 shrink-0 px-0"
          disabled={disabled || value >= MAX}
          onClick={() => bump(STEP)}
          aria-label="글자 크게"
        >
          +
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">100% = 기본 크기 · {MIN}~{MAX}% ({STEP}% 단위)</p>
    </div>
  );
}