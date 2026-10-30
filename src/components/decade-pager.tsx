"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/locale-provider";

export const DECADE = 10;

export function DecadePager({
  total,
  index,
  onGo,
  onSelect,
  itemLabel,
  label,
}: {
  total: number;
  index: number;
  onGo: (index: number) => void;
  onSelect?: (index: number) => void;
  itemLabel: (n: number) => string;
  label?: string;
}) {
  const t = useT();
  if (total < 1) return null;

  const pick = onSelect ?? onGo;
  const safeIndex = Math.max(0, Math.min(index, total - 1));
  const windowStart = Math.floor(safeIndex / DECADE) * DECADE;
  const windowCount = Math.min(DECADE, total - windowStart);
  const prevTarget = windowStart - DECADE;
  const nextTarget = windowStart + DECADE;
  const prevN = prevTarget + 1;
  const nextN = nextTarget + 1;

  return (
    <nav aria-label={label ?? t("gallery.title")} className="flex flex-wrap items-center justify-center gap-1">
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        disabled={safeIndex === 0}
        aria-label={t("gallery.first")}
        onClick={() => onGo(0)}
      >
        <ChevronsLeft aria-hidden />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 min-w-8 px-2"
        disabled={windowStart === 0}
        aria-label={windowStart === 0 ? t("gallery.prev10", { n: 1 }) : t("gallery.prev10", { n: prevN })}
        onClick={() => onGo(prevTarget)}
      >
        <ChevronLeft aria-hidden />
        {windowStart > 0 ? <span>{prevN}</span> : null}
      </Button>
      {Array.from({ length: windowCount }, (_, i) => {
        const itemIndex = windowStart + i;
        return (
          <Button
            key={itemIndex}
            type="button"
            size="xs"
            variant={itemIndex === safeIndex ? "default" : "outline"}
            className="h-8 min-w-8 px-2.5 text-sm"
            aria-label={itemLabel(itemIndex + 1)}
            aria-current={itemIndex === safeIndex ? "true" : undefined}
            onClick={() => pick(itemIndex)}
          >
            {itemIndex + 1}
          </Button>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 min-w-8 px-2"
        disabled={nextTarget >= total}
        aria-label={nextTarget >= total ? t("gallery.last") : t("gallery.next10", { n: nextN })}
        onClick={() => onGo(nextTarget)}
      >
        {nextTarget < total ? <span>{nextN}</span> : null}
        <ChevronRight aria-hidden />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        disabled={safeIndex === total - 1}
        aria-label={t("gallery.last")}
        onClick={() => onGo(total - 1)}
      >
        <ChevronsRight aria-hidden />
      </Button>
    </nav>
  );
}
