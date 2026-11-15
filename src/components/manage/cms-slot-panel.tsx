"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 인천 admin homeCms 우측 「슬롯 편집」 패널 레이아웃 */
export function CmsSlotPanel({
  slotLabel,
  slotKey,
  children,
  onSave,
  saveDisabled,
  saving,
  hint,
  footer,
}: {
  slotLabel?: string;
  slotKey?: string;
  children: ReactNode;
  onSave: () => void;
  saveDisabled?: boolean;
  saving?: boolean;
  hint?: string;
  footer?: ReactNode;
}) {
  return (
    <aside className="cms-panel sticky top-3">
      <div className="cms-panel-head">
        <strong>슬롯 편집</strong>
      </div>
      <div className="cms-panel-body space-y-3">
        {!slotKey ? (
          <p className="cms-panel-lead text-sm text-muted-foreground">
            홈페이지와 동일한 화면에서 <strong>문구·전경</strong>을 클릭하세요.
          </p>
        ) : (
          <>
            {slotLabel ? (
              <p className="text-xs text-muted-foreground">
                {slotLabel}{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px] text-foreground/80">{slotKey}</code>
              </p>
            ) : null}
            {children}
            {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
          </>
        )}
        <Button
          type="button"
          className={cn("w-full", saving && "opacity-80")}
          disabled={saveDisabled || saving}
          onClick={onSave}
        >
          {saving ? "저장 중…" : "저장"}
        </Button>
        {footer}
      </div>
    </aside>
  );
}

export function CmsFieldKo({
  multiline,
  value,
  onChange,
  disabled,
  maxLength,
}: {
  multiline?: boolean;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}) {
  const fieldClass =
    "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const areaClass =
    "min-h-28 w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">내용 (ko)</span>
      {multiline ? (
        <textarea
          className={areaClass}
          rows={5}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={fieldClass}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}