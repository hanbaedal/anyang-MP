"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { GALLERY, type GalleryItem, type GalleryTag } from "@/lib/content";
import { isUploadMediaPath, mediaUrl, thumbUrl, uploadOriginalUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { GallerySlideModal } from "@/components/gallery-slide-modal";
import { ImageLightboxDialog } from "@/components/image-lightbox-dialog";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const TAGS: Array<{ value: "전체" | GalleryTag; key: string }> = [
  { value: "전체", key: "gallery.all" },
  { value: "일반", key: "gallery.tag.general" },
  { value: "전경", key: "gallery.tag.view" },
  { value: "매장묘", key: "gallery.tag.burial" },
  { value: "평장묘", key: "gallery.tag.lawn" },
  { value: "봉안묘", key: "gallery.tag.columbarium" },
  { value: "리모델링", key: "gallery.tag.remodel" },
];

function openPreview(src: string) {
  const img = new window.Image();
  img.src = mediaUrl(src);
}

/** Thumb with original fallback; reports hard failure so parent can drop the slot. */
function FallbackThumb({
  src,
  className,
  loading,
  onOk,
  onFail,
}: {
  src: string;
  className?: string;
  loading?: "eager" | "lazy";
  onOk?: (src: string) => void;
  onFail: (src: string) => void;
}) {
  const [uri, setUri] = useState(() => thumbUrl(src));
  const [phase, setPhase] = useState<"thumb" | "orig">("thumb");

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={uri}
      alt=""
      className={className}
      loading={loading}
      decoding="async"
      draggable={false}
      onLoad={() => onOk?.(src)}
      onError={() => {
        if (phase === "thumb") {
          setPhase("orig");
          setUri(uploadOriginalUrl(src));
          return;
        }
        onFail(src);
      }}
    />
  );
}

export function GalleryGrid({ preview, items = GALLERY }: { preview?: number; items?: GalleryItem[] }) {
  const t = useT();
  const [tag, setTag] = useState<(typeof TAGS)[number]["value"]>("전체");
  const [open, setOpen] = useState<string | null>(null);
  const [listIndex, setListIndex] = useState<number | null>(null);
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(() => new Set());
  const [marqueeReady, setMarqueeReady] = useState(false);

  const itemsFiltered = useMemo(() => {
    const filtered = tag === "전체" ? items : items.filter((item) => item.tags.includes(tag));
    return typeof preview === "number" ? filtered.slice(0, preview) : filtered;
  }, [tag, preview, items]);

  const visibleItems = useMemo(
    () => itemsFiltered.filter((item) => !failedSrcs.has(item.src)),
    [itemsFiltered, failedSrcs],
  );

  const tickerItems = useMemo(() => {
    if (visibleItems.length === 0) return [];
    let base = [...visibleItems];
    while (base.length < 3) base = base.concat(visibleItems);
    return [...base, ...base];
  }, [visibleItems]);

  useEffect(() => {
    setFailedSrcs(new Set());
    setMarqueeReady(false);
  }, [tag, items]);

  const onMarqueeOk = useCallback(() => {
    setMarqueeReady(true);
  }, []);

  const onFail = useCallback((src: string) => {
    setFailedSrcs((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  }, []);

  useEffect(() => {
    if (marqueeReady || visibleItems.length === 0) return;
    const timer = window.setTimeout(() => setMarqueeReady(true), 2000);
    return () => window.clearTimeout(timer);
  }, [marqueeReady, visibleItems.length, tag]);

  const current = items.find((item) => item.src === open);
  const durationSec = Math.max(60, Math.max(visibleItems.length, 1) * 10);

  if (preview) {
    return (
      <div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {itemsFiltered.map((item) => (
            <li key={item.src}>
              <button
                type="button"
                className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted"
                onClick={() => setOpen(item.src)}
                onMouseEnter={() => openPreview(item.src)}
              >
                <Image
                  src={thumbUrl(item.src)}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="33vw"
                  unoptimized={isUploadMediaPath(thumbUrl(item.src))}
                />
              </button>
              <p className="mt-2 text-sm text-muted-foreground">{item.alt}</p>
            </li>
          ))}
        </ul>
        {current ? (
          <ImageLightboxDialog open={Boolean(open)} onOpenChange={(next) => !next && setOpen(null)} src={current.src} alt={current.alt} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-full min-w-0 space-y-8">
      {visibleItems.length > 0 ? (
        <section
          aria-label={t("gallery.title")}
          className="max-w-full overflow-hidden rounded-2xl border border-[#ead7b4] bg-[#f8eedd] p-3"
        >
          <div className="gallery-marquee">
            <div
              className={cn("gallery-marquee-track gap-3", marqueeReady ? "is-ready" : "is-waiting")}
              style={{ animationDuration: `${durationSec}s` }}
            >
              {tickerItems.map((item, index) => (
                <button
                  key={`${item.src}-${index}`}
                  type="button"
                  className="gallery-marquee-card"
                  onClick={() => {
                    const idx = visibleItems.findIndex((entry) => entry.src === item.src);
                    if (idx >= 0) setListIndex(idx);
                  }}
                  onMouseEnter={() => openPreview(item.src)}
                  aria-label={item.alt}
                >
                  <FallbackThumb
                    src={item.src}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="eager"
                    onOk={onMarqueeOk}
                    onFail={onFail}
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="max-w-full min-w-0">
        <div
          role="tablist"
          aria-label={t("gallery.title")}
          className="flex w-full max-w-full min-w-0 flex-nowrap gap-1 overflow-x-auto overscroll-x-contain touch-pan-x pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:gap-2 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {TAGS.map((item) => (
            <Button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tag === item.value}
              size="xs"
              variant={tag === item.value ? "default" : "outline"}
              className="h-6 shrink-0 px-1.5 text-[11px] leading-none md:h-8 md:px-3 md:text-sm"
              onClick={() => setTag(item.value)}
            >
              {t(item.key)}
            </Button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleItems.map((item, index) => (
          <li key={item.src}>
            <button
              type="button"
              className={cn(
                "flex h-full w-full items-stretch gap-3 rounded-xl border border-[#ead7b4] bg-[#fffcf7] p-3 text-left transition-colors sm:gap-4",
                "hover:border-[#d4c08a] hover:bg-[#f8eedd]/60",
              )}
              onClick={() => setListIndex(index)}
              onMouseEnter={() => openPreview(item.src)}
            >
              <span className="relative h-[4.75rem] w-[6.5rem] shrink-0 overflow-hidden rounded-lg bg-muted sm:h-[5.5rem] sm:w-[7.5rem]">
                <FallbackThumb
                  src={item.src}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  onFail={onFail}
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
                <span className="font-medium text-foreground">{item.alt}</span>
                <span className="text-sm text-muted-foreground">{item.tags.join(" · ")}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {visibleItems.length === 0 ? <p className="text-sm text-muted-foreground">{t("gallery.empty")}</p> : null}
      {listIndex !== null && visibleItems.length > 0 ? (
        <GallerySlideModal
          open
          onOpenChange={(next) => {
            if (!next) setListIndex(null);
          }}
          items={visibleItems}
          index={Math.min(listIndex, visibleItems.length - 1)}
          onIndexChange={setListIndex}
        />
      ) : null}
    </div>
  );
}
