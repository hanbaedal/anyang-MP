"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GALLERY, type GalleryItem } from "@/lib/content";
import { uploadOriginalUrl } from "@/lib/media";
import { DecadePager } from "@/components/decade-pager";
import { GallerySlideModal } from "@/components/gallery-slide-modal";
import { ImageLightboxDialog } from "@/components/image-lightbox-dialog";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 3;
const SLIDE_MS = 7000;

function preloadOriginal(src: string) {
  const img = new window.Image();
  img.src = uploadOriginalUrl(src);
}

/** 원본 표시. 실패하면 부모에서 슬롯을 뺀다. */
function OriginalPhoto({
  src,
  className,
  loading,
  onFail,
}: {
  src: string;
  className?: string;
  loading?: "eager" | "lazy";
  onFail: (src: string) => void;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={uploadOriginalUrl(src)}
      alt=""
      className={className}
      loading={loading}
      decoding="async"
      draggable={false}
      onError={() => onFail(src)}
    />
  );
}

export function GalleryGrid({ preview, items = GALLERY }: { preview?: number; items?: GalleryItem[] }) {
  const t = useT();
  const [open, setOpen] = useState<string | null>(null);
  const [listIndex, setListIndex] = useState<number | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [resumeKey, setResumeKey] = useState(0);
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(() => new Set());

  const itemsFiltered = useMemo(() => {
    return typeof preview === "number" ? items.slice(0, preview) : items;
  }, [preview, items]);

  const visibleItems = useMemo(
    () => itemsFiltered.filter((item) => !failedSrcs.has(item.src)),
    [itemsFiltered, failedSrcs],
  );

  const total = visibleItems.length;
  const safeIndex = total ? Math.min(slideIndex, total - 1) : 0;
  const page = Math.floor(safeIndex / PAGE_SIZE);
  const pageItems = visibleItems.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setFailedSrcs(new Set());
    setSlideIndex(0);
  }, [items]);

  const onFail = useCallback((src: string) => {
    setFailedSrcs((prev) => {
      if (prev.has(src)) return prev;
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  }, []);

  const goSlide = useCallback(
    (delta: number) => {
      if (visibleItems.length < 2) return;
      setSlideIndex((prev) => (prev + delta + visibleItems.length) % visibleItems.length);
      setResumeKey((n) => n + 1);
    },
    [visibleItems.length],
  );

  const goTo = useCallback(
    (index: number) => {
      if (!visibleItems.length) return;
      const next = Math.max(0, Math.min(index, visibleItems.length - 1));
      setSlideIndex(next);
      setResumeKey((n) => n + 1);
    },
    [visibleItems.length],
  );

  useEffect(() => {
    if (listIndex !== null || visibleItems.length < 2) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % visibleItems.length);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [listIndex, visibleItems.length, resumeKey]);

  useEffect(() => {
    if (!visibleItems.length) return;
    for (const i of [safeIndex + 1, safeIndex - 1]) {
      const photo = visibleItems[(i + visibleItems.length) % visibleItems.length];
      if (photo) preloadOriginal(photo.src);
    }
  }, [safeIndex, visibleItems]);

  const current = items.find((item) => item.src === open);

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
              >
                <Image
                  src={uploadOriginalUrl(item.src)}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="33vw"
                  quality={90}
                  unoptimized
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
    <div className="max-w-full min-w-0 space-y-6">
      {visibleItems.length > 0 ? (
        <section
          aria-label={t("gallery.title")}
          className="relative max-w-full overflow-hidden rounded-2xl border border-[#ead7b4] bg-[#f8eedd] p-2 sm:p-3"
        >
          <div className="relative aspect-[16/10] min-h-[18rem] w-full overflow-hidden rounded-xl bg-[#ead7b4]/50 sm:aspect-[16/9] sm:min-h-[28rem] lg:min-h-[36rem]">
            <div
              className="flex h-full transition-transform duration-700 ease-out motion-reduce:transition-none"
              style={{
                width: `${visibleItems.length * 100}%`,
                transform: `translateX(-${(safeIndex * 100) / visibleItems.length}%)`,
              }}
            >
              {visibleItems.map((item, i) => {
                const near =
                  i === safeIndex ||
                  i === (safeIndex + 1) % visibleItems.length ||
                  i === (safeIndex - 1 + visibleItems.length) % visibleItems.length;
                return (
                  <div
                    key={`${item.src}-${i}`}
                    className="relative h-full shrink-0"
                    style={{ width: `${100 / visibleItems.length}%` }}
                  >
                    {near ? (
                      <OriginalPhoto
                        src={item.src}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading={i === safeIndex ? "eager" : "lazy"}
                        onFail={onFail}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
            {visibleItems.length > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 z-[1] flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md ring-1 ring-white/35 hover:bg-black/60 sm:left-3 sm:size-12"
                  aria-label={t("home.slidePrev")}
                  onClick={() => goSlide(-1)}
                >
                  <ChevronLeft className="size-6 sm:size-7" aria-hidden />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 z-[1] flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md ring-1 ring-white/35 hover:bg-black/60 sm:right-3 sm:size-12"
                  aria-label={t("home.slideNext")}
                  onClick={() => goSlide(1)}
                >
                  <ChevronRight className="size-6 sm:size-7" aria-hidden />
                </button>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {pageItems.map((item, offset) => {
          const index = page * PAGE_SIZE + offset;
          return (
            <li key={item.src}>
              <button
                type="button"
                className={cn(
                  "flex h-full w-full items-stretch gap-3 rounded-xl border border-[#ead7b4] bg-[#fffcf7] p-3 text-left transition-colors sm:gap-4",
                  "hover:border-[#d4c08a] hover:bg-[#f8eedd]/60",
                  index === safeIndex && "border-[#c4a574] bg-[#f8eedd]/80",
                )}
                onClick={() => {
                  setSlideIndex(index);
                  setListIndex(index);
                }}
              >
                <span className="relative h-[4.75rem] w-[6.5rem] shrink-0 overflow-hidden rounded-lg bg-muted sm:h-[5.5rem] sm:w-[7.5rem]">
                  <OriginalPhoto
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
          );
        })}
      </ul>

      {total > 0 ? (
        <DecadePager
          total={total}
          index={safeIndex}
          onGo={goTo}
          itemLabel={(n) => t("gallery.photo", { n })}
          label={t("gallery.title")}
        />
      ) : null}

      {visibleItems.length === 0 ? <p className="text-sm text-muted-foreground">{t("gallery.empty")}</p> : null}
      {listIndex !== null && visibleItems.length > 0 ? (
        <GallerySlideModal
          open
          fullPage
          onOpenChange={(next) => {
            if (!next) setListIndex(null);
          }}
          items={visibleItems}
          index={Math.min(listIndex, visibleItems.length - 1)}
          onIndexChange={(next) => {
            setListIndex(next);
            setSlideIndex(next);
          }}
        />
      ) : null}
    </div>
  );
}
