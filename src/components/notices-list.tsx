"use client";

import { useMemo, useState } from "react";
import { DecadePager, DECADE } from "@/components/decade-pager";
import { Paragraphs } from "@/components/paragraphs";
import { Prose } from "@/components/page-hero";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocale, useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";
import type { Notice } from "@/lib/notices";

export type NoticeListItem = Pick<Notice, "slug" | "title" | "body" | "publishedAt" | "pinned">;

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tag = locale === "zh" ? "zh-CN" : locale;
  return new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(date);
}

export function NoticesList({ items, empty }: { items: NoticeListItem[]; empty: string }) {
  const t = useT();
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const total = items.length;
  const safeIndex = total ? Math.min(index, total - 1) : 0;
  const windowStart = Math.floor(safeIndex / DECADE) * DECADE;
  const pageItems = useMemo(
    () => items.slice(windowStart, windowStart + DECADE),
    [items, windowStart],
  );
  const current = items[safeIndex] ?? null;

  function openAt(next: number) {
    if (next < 0 || next >= total) return;
    setIndex(next);
    setOpen(true);
  }

  function goTo(next: number) {
    if (!total) return;
    setIndex(Math.max(0, Math.min(next, total - 1)));
  }

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        {pageItems.map((notice, offset) => {
          const itemIndex = windowStart + offset;
          const n = itemIndex + 1;
          return (
            <li key={notice.slug}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors",
                  "hover:border-[#d4c08a] hover:bg-[#f8eedd]/60",
                  itemIndex === safeIndex && "border-[#c4a574] bg-[#f8eedd]/80",
                )}
                onClick={() => openAt(itemIndex)}
                aria-label={t("notices.item", { n })}
              >
                <span className="w-7 shrink-0 pt-0.5 text-center text-sm font-medium tabular-nums text-muted-foreground">
                  {n}
                </span>
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="flex flex-wrap items-start justify-between gap-2">
                    <span className="min-w-0 text-sm font-medium">
                      {notice.pinned ? (
                        <span className="mr-2 text-xs font-normal text-ring">{t("pinned")}</span>
                      ) : null}
                      {notice.title}
                    </span>
                    <time className="shrink-0 text-xs text-muted-foreground" dateTime={notice.publishedAt}>
                      {formatDate(notice.publishedAt, locale)}
                    </time>
                  </span>
                  <span className="line-clamp-2 text-sm whitespace-pre-wrap text-muted-foreground">{notice.body}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {total > DECADE ? (
        <DecadePager
          total={total}
          index={safeIndex}
          onGo={goTo}
          onSelect={openAt}
          itemLabel={(n) => t("notices.item", { n })}
          label={t("notices.title")}
        />
      ) : null}

      <Dialog open={open && Boolean(current)} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          {current ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-left font-serif text-xl leading-snug">
                  {current.pinned ? (
                    <span className="mr-2 text-sm font-normal text-ring">{t("pinned")}</span>
                  ) : null}
                  {current.title}
                </DialogTitle>
                <DialogDescription asChild>
                  <time dateTime={current.publishedAt}>{formatDate(current.publishedAt, locale)}</time>
                </DialogDescription>
              </DialogHeader>
              <Prose className="max-w-none">
                <Paragraphs text={current.body} />
              </Prose>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
