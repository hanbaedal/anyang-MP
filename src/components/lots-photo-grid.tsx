"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { GallerySlideModal } from "@/components/gallery-slide-modal";
import { Paragraphs } from "@/components/paragraphs";
import { mediaUrl, thumbUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type LotsPhotoItem = {
  id?: string;
  title: string;
  text?: string;
  image?: string;
};

type Layout = "grid" | "detail";

/**
 * 분양안내 허브는 작은 격자, 매장·평장·봉안 상세는 한 줄에 큰 사진 좌·우 교차.
 */
export function LotsPhotoGrid({ items, layout = "grid" }: { items: LotsPhotoItem[]; layout?: Layout }) {
  const [index, setIndex] = useState<number | null>(null);
  const detail = layout === "detail";

  const slides = useMemo(
    () =>
      items
        .filter((item): item is LotsPhotoItem & { image: string } => Boolean(item.image))
        .map((item) => ({ src: item.image, alt: item.title })),
    [items],
  );

  function openAt(src: string) {
    const i = slides.findIndex((s) => s.src === src);
    if (i >= 0) setIndex(i);
  }

  function preload(src: string) {
    if (typeof window === "undefined") return;
    const img = new window.Image();
    img.src = mediaUrl(src);
  }

  function photo(item: LotsPhotoItem, i: number) {
    if (!item.image) {
      return (
        <div
          className={cn(
            "flex items-center justify-center bg-[#f3e6cf] text-sm text-muted-foreground",
            detail ? "aspect-[4/3] w-full md:min-h-[22rem]" : "aspect-[4/3]",
          )}
        >
          사진 없음
        </div>
      );
    }
    return (
      <button
        type="button"
        className={cn(
          "relative w-full cursor-zoom-in overflow-hidden bg-[#f3e6cf] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          detail ? "aspect-[4/3] md:min-h-[22rem]" : "aspect-[4/3]",
        )}
        onClick={() => openAt(item.image!)}
        onMouseEnter={() => preload(item.image!)}
        onFocus={() => preload(item.image!)}
        aria-label={item.title ? `${item.title} 크게 보기` : "사진 크게 보기"}
      >
        <Image
          src={thumbUrl(item.image)}
          alt={item.title}
          fill
          className="object-contain object-center"
          sizes={
            detail
              ? "(max-width: 767px) 100vw, 70vw"
              : "(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
          }
          priority={i < 5}
          loading={i < 5 ? undefined : "lazy"}
        />
      </button>
    );
  }

  function caption(item: LotsPhotoItem) {
    return (
      <div className={cn("flex min-h-0 flex-1 flex-col", detail ? "justify-center p-4 md:p-6 lg:p-8" : "p-3", item.text ? "gap-1" : "")}>
        <h2 className={cn("font-medium leading-snug", detail ? "text-xl md:text-2xl" : "text-base sm:text-lg")}>
          {item.title}
        </h2>
        {item.text ? (
          <div className={cn("text-muted-foreground", detail ? "space-y-2 text-base" : "space-y-1 text-sm")}>
            <Paragraphs text={item.text} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <ul
        className={
          detail
            ? "mt-10 flex w-full flex-col gap-8 md:gap-12"
            : "mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        }
      >
        {items.map((item, i) => {
          const photoOnRight = detail && i % 2 === 1;
          if (!detail) {
            return (
              <li
                key={item.id || item.title || String(i)}
                className="flex flex-col overflow-hidden rounded-xl border border-[#ead7b4] bg-[#fffcf7] shadow-sm"
              >
                {photo(item, i)}
                {caption(item)}
              </li>
            );
          }
          return (
            <li
              key={item.id || item.title || String(i)}
              className={cn(
                "overflow-hidden rounded-xl border border-[#ead7b4] bg-[#fffcf7] shadow-sm",
                "grid grid-cols-1 md:items-stretch",
                photoOnRight
                  ? "md:grid-cols-[minmax(14rem,1fr)_minmax(0,1.65fr)]"
                  : "md:grid-cols-[minmax(0,1.65fr)_minmax(14rem,1fr)]",
              )}
            >
              <div className={cn("min-w-0", photoOnRight && "md:order-2")}>{photo(item, i)}</div>
              <div className={cn("min-w-0", photoOnRight && "md:order-1")}>{caption(item)}</div>
            </li>
          );
        })}
      </ul>
      {index !== null && slides.length > 0 ? (
        <GallerySlideModal
          open={index !== null}
          onOpenChange={(next) => {
            if (!next) setIndex(null);
          }}
          items={slides}
          index={Math.min(index, slides.length - 1)}
          onIndexChange={setIndex}
          imageFit="contain"
        />
      ) : null}
    </>
  );
}
