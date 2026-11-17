"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CMS_SLUGS } from "@/lib/cms-types";
import { MANAGE_VISUAL_CMS_SLUGS, type ManageVisualCmsSlug } from "@/lib/manage-visual-pages";
import { cn } from "@/lib/utils";

export type CmsWorkspace =
  | { kind: "home" }
  | { kind: "page"; slug: ManageVisualCmsSlug };

const PAGE_SLUGS = MANAGE_VISUAL_CMS_SLUGS as readonly ManageVisualCmsSlug[];

function workspaceLabel(ws: CmsWorkspace) {
  if (ws.kind === "home") return "메인 홈";
  const row = CMS_SLUGS.find((item) => item.slug === ws.slug);
  return row?.label ?? ws.slug;
}

export function CmsWorkspaceSelect({
  value,
  disabled,
  onChange,
}: {
  value: CmsWorkspace;
  disabled?: boolean;
  onChange: (next: CmsWorkspace) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = workspaceLabel(value);

  function pick(next: CmsWorkspace) {
    onChange(next);
    setOpen(false);
  }

  return (
  <>
      <button
        type="button"
        disabled={disabled}
        className="flex h-10 w-full max-w-md items-center justify-between gap-2 rounded-md border-2 border-primary/50 bg-card px-3 text-left shadow-sm disabled:opacity-50"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="shrink-0 text-sm font-semibold text-primary">편집 페이지</span>
        <span className="min-w-0 truncate text-sm font-medium text-foreground">{current}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(92vh,720px)] gap-3 overflow-hidden p-4 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-primary">홈페이지 CMS</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              메인·소메뉴 공개 화면을 미리 보며 클릭해 편집합니다.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-[min(65vh,520px)] space-y-1 overflow-y-auto pr-1">
            <li>
              <button
                type="button"
                className={cn(
                  "w-full rounded-md border-2 px-3 py-2.5 text-left text-sm transition",
                  value.kind === "home"
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-transparent hover:border-primary/30 hover:bg-accent/50",
                )}
                onClick={() => pick({ kind: "home" })}
              >
                메인 홈
              </button>
            </li>
            {PAGE_SLUGS.map((slug) => {
              const label = CMS_SLUGS.find((row) => row.slug === slug)?.label ?? slug;
              const selected = value.kind === "page" && value.slug === slug;
              return (
                <li key={slug}>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-md border-2 px-3 py-2.5 text-left text-sm transition",
                      selected
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-transparent hover:border-primary/30 hover:bg-accent/50",
                    )}
                    onClick={() => pick({ kind: "page", slug })}
                  >
                    {label}
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