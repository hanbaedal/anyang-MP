"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ManageEditToolbar({
  busy,
  message,
  status,
  onSave,
  hint,
}: {
  busy: boolean;
  message: string;
  status: "idle" | "saving" | "ok" | "error" | "busy";
  onSave: () => void;
  hint?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-30 border-b bg-[#fffcf7]/95 px-4 py-2.5 shadow-sm backdrop-blur-sm",
        "flex flex-wrap items-center justify-between gap-2",
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">공개 화면과 같은 배치 · 클릭해 고친 뒤 저장</p>
        {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={onSave}>
          {status === "saving" ? "저장 중…" : "페이지 저장"}
        </Button>
        {message ? (
          <span
            className={cn("max-w-[16rem] text-xs", status === "error" ? "text-destructive" : "text-muted-foreground")}
          >
            {message}
          </span>
        ) : null}
      </div>
    </div>
  );
}