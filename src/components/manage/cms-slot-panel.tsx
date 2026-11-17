"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 인천 admin homeCms 우측 「슬롯 편집」 패널 레이아웃 */
export function CmsSlotPanel({
  slotKey,
  slotSelector,
  children,
  onSave,
  saveDisabled,
  saving,
  footer,
}: {
  slotKey?: string;
  /** 홈 CMS 편집 슬롯 선택(패널 최상단 고정) */
  slotSelector?: ReactNode;
  children: ReactNode;
  onSave: () => void;
  saveDisabled?: boolean;
  saving?: boolean;
  footer?: ReactNode;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [slotKey]);

  return (
    <aside className="cms-panel">
      <div className="cms-panel-head">
        <strong>슬롯 편집</strong>
      </div>
      <div ref={bodyRef} className="cms-panel-body">
        {!slotKey ? null : (
          <div className="cms-panel-fields space-y-3">
            {slotSelector ? <div className="pb-1">{slotSelector}</div> : null}
            {children}
          </div>
        )}
      </div>
      <div className="cms-panel-foot space-y-2">
        <Button
          type="button"
          className={cn(
            "w-full bg-emerald-800 text-white hover:bg-emerald-900",
            saving && "opacity-80",
          )}
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
  label = "내용 (한국어)",
  hint,
}: {
  multiline?: boolean;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
  label?: string;
  hint?: string;
}) {
  const fieldClass =
    "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const areaClass =
    "cms-field-area min-h-28 w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
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
      {hint ? <p className="text-xs leading-snug text-muted-foreground">{hint}</p> : null}
    </label>
  );
}