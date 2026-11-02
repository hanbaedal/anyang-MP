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

/** 본문 첫 문장·첫 줄 위주 한 줄 요약 (표용) */
function summarizeBody(body: string, max = 72) {
  const flat = body
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trimEnd()}…`;
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
      <div className="overflow-x-auto rounded-xl border border-[#c4a574]/55 bg-[#fffcf7]">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#c4a574]/45 bg-[#e8f4fb] text-[color:var(--pastel-chrome-fg)]">
              <th scope="col" className="w-14 px-3 py-3 text-center text-xs font-semibold tracking-wide sm:w-16 sm:px-4">
                {t("notices.col.no")}
              </th>
              <th scope="col" className="px-3 py-3 text-xs font-semibold tracking-wide sm:px-4">
                {t("notices.col.subject")}
              </th>
              <th scope="col" className="w-28 px-3 py-3 text-right text-xs font-semibold tracking-wide sm:w-32 sm:px-4">
                {t("notices.col.date")}
              </th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((notice, offset) => {
              const itemIndex = windowStart + offset;
              const n = itemIndex + 1;
              const summary = summarizeBody(notice.body);
              return (
                <tr
                  key={notice.slug}
                  className={cn(
                    "border-b border-[#ead7b4]/80 last:border-b-0",
                    itemIndex === safeIndex && open ? "bg-[#f8eedd]/70" : "bg-transparent",
                  )}
                >
                  <td className="px-3 py-3 text-center align-middle sm:px-4">
                    <button
                      type="button"
                      className="w-full tabular-nums text-muted-foreground hover:text-primary"
                      onClick={() => openAt(itemIndex)}
                      aria-label={t("notices.item", { n })}
                    >
                      {n}
                    </button>
                  </td>
                  <td className="px-3 py-3 align-middle sm:px-4">
                    <button
                      type="button"
                      className="block w-full min-w-0 text-left hover:text-primary"
                      onClick={() => openAt(itemIndex)}
                      aria-label={t("notices.item", { n })}
                    >
                      <span className="block font-medium leading-snug">
                        {notice.pinned ? (
                          <span className="mr-2 text-xs font-normal text-ring">{t("pinned")}</span>
                        ) : null}
                        {notice.title}
                      </span>
                      {summary ? (
                        <span className="mt-1 block text-[13px] leading-5 text-muted-foreground">{summary}</span>
                      ) : null}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-right align-middle sm:px-4">
                    <button
                      type="button"
                      className="w-full text-right text-xs text-muted-foreground hover:text-primary"
                      onClick={() => openAt(itemIndex)}
                      aria-label={t("notices.item", { n })}
                    >
                      <time dateTime={notice.publishedAt}>{formatDate(notice.publishedAt, locale)}</time>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
