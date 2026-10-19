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

/** 묘역 4페이지 공통 — 카드 크기·그리드·크림 슬라이드 모달 */
export function LotsPhotoGrid({ items }: { items: LotsPhotoItem[] }) {
  const [index, setIndex] = useState<number | null>(null);

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

  return (
    <>
      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item, i) => (
          <li
            key={item.id || item.title || String(i)}
            className="flex flex-col overflow-hidden rounded-xl border border-[#ead7b4] bg-[#fffcf7] shadow-sm"
          >
            {item.image ? (
              <button
                type="button"
                className="relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => openAt(item.image!)}
                onMouseEnter={() => preload(item.image!)}
                onFocus={() => preload(item.image!)}
                aria-label={item.title ? `${item.title} 크게 보기` : "사진 크게 보기"}
              >
                <Image
                  src={thumbUrl(item.image)}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
                  priority={i < 5}
                  loading={i < 5 ? undefined : "lazy"}
                />
              </button>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-muted text-sm text-muted-foreground">
                사진 없음
              </div>
            )}
            <div className={cn("flex min-h-0 flex-1 flex-col p-3", item.text ? "gap-1" : "")}>
              <h2 className="text-base font-medium leading-snug sm:text-lg">{item.title}</h2>
              {item.text ? (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <Paragraphs text={item.text} />
                </div>
              ) : null}
            </div>
          </li>
        ))}
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
        />
      ) : null}
    </>
  );
}
