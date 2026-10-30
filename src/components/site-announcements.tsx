"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { isAnnouncementActive, type SiteAnnouncement } from "@/lib/announcement-types";
import { uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/** 카드 폭 고정 — 화면을 가로로 채우지 않고 타일 크기 통일 */
const CARD_WIDTH_CLASS = "w-[168px] sm:w-[176px] md:w-[272px]";

function filterVisible(items: SiteAnnouncement[], dismissedIds: ReadonlySet<string>) {
  const now = new Date();
  return items.filter((item) => isAnnouncementActive(item, now) && !dismissedIds.has(item.id));
}

function AnnouncementCard({ item, onDismiss }: { item: SiteAnnouncement; onDismiss: () => void }) {
  const t = useT();
  const href = item.linkHref.trim();
  const media = (
    <div className="relative h-[148px] w-full shrink-0 bg-muted sm:h-[168px] md:h-[196px]">
      {item.imageSrc ? (
        <Image
          src={uploadOriginalUrl(item.imageSrc)}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width:768px) 168px, 272px"
          quality={90}
          unoptimized
        />
      ) : null}
      <h3 className="absolute inset-x-0 top-0 z-[1] line-clamp-2 bg-gradient-to-b from-black/75 via-black/45 to-transparent px-8 pb-6 pt-2 text-center text-sm font-semibold leading-snug tracking-tight text-white md:text-[15px]">
        {item.title}
      </h3>
    </div>
  );
  const copy = (
    <div className="flex shrink-0 flex-col items-center gap-1.5 px-3 py-2.5 text-center md:gap-2 md:px-4 md:py-3">
      {item.body ? (
        <p className="line-clamp-4 w-full whitespace-pre-line text-xs leading-relaxed text-muted-foreground md:text-[13px] md:leading-snug">
          {item.body}
        </p>
      ) : null}
      {href && item.linkLabel ? (
        <span className="text-xs font-medium text-primary underline-offset-4">{item.linkLabel}</span>
      ) : null}
    </div>
  );

  return (
    <article
      className={cn(
        CARD_WIDTH_CLASS,
        "relative flex shrink-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card/95 text-card-foreground shadow-md ring-1 ring-black/5 backdrop-blur-md",
      )}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-1.5 top-1.5 z-10 inline-flex size-7 items-center justify-center rounded-full bg-black/55 text-white shadow-sm hover:bg-black/75"
        aria-label={`${item.title} ${t("close")}`}
      >
        <X className="size-3.5" aria-hidden />
      </button>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={item.linkLabel || item.title}
        >
          {media}
          {copy}
        </a>
      ) : (
        <>
          {media}
          {copy}
        </>
      )}
    </article>
  );
}

export function SiteAnnouncements() {
  const t = useT();
  const [allActive, setAllActive] = useState<SiteAnnouncement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  const visible = useMemo(() => filterVisible(allActive, dismissedIds), [allActive, dismissedIds]);

  const load = useCallback(async () => {
    const res = await fetch("/api/announcements/active", { cache: "no-store" });
    const json = (await res.json()) as { items?: SiteAnnouncement[] };
    setAllActive(json.items ?? []);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  function dismiss(id: string) {
    setDismissedIds((prev) => new Set(prev).add(id));
  }

  if (!visible.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-12 z-30 max-h-[min(78vh,640px)] overflow-y-auto px-2 py-2.5 sm:px-3 lg:left-36 lg:px-4"
      aria-label={t("home.events")}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-6xl flex-wrap justify-center gap-2.5 sm:gap-3",
          "max-md:grid max-md:grid-cols-2 max-md:justify-items-center max-md:gap-x-2 max-md:gap-y-2.5",
        )}
      >
        {visible.map((item) => (
          <AnnouncementCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </div>
  );
}
