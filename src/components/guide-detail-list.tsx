"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { CmsInlineBreaks, Paragraphs } from "@/components/paragraphs";
import { GallerySlideModal } from "@/components/gallery-slide-modal";
import { CmsItemImageSlot } from "@/components/cms-edit/cms-item-image-slot";
import { useLocale } from "@/components/locale-provider";
import { pageSlotItemText, pageSlotItemTitle } from "@/lib/page-cms-slots";
import { pageCmsTextStyleColorized, pageCmsTextStyleProps, type PageCmsTextStyles } from "@/lib/page-cms-text-style";
import { uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type GuideDetailItem = {
  id?: string;
  title: string;
  text?: string;
  image?: string;
  /** 분양절차 등 — 「1단계」 */
  eyebrow?: string;
};

/**
 * AMP-108: 분양안내 「상세보기」와 같은 큰 사진·교차 배치 행.
 * 매장/평장/봉안 `LotsPhotoGrid layout="detail"` 톤 유지 + CMS 슬롯.
 */
export function GuideDetailList({
  items,
  className,
  cmsSlug,
  cmsEditMarkers = false,
  cmsTextStyles,
  emptyLabel,
  footer,
}: {
  items: GuideDetailItem[];
  className?: string;
  cmsSlug?: string;
  cmsEditMarkers?: boolean;
  cmsTextStyles?: PageCmsTextStyles;
  emptyLabel?: string;
  footer?: ReactNode;
}) {
  const locale = useLocale();
  const [index, setIndex] = useState<number | null>(null);
  const slides = useMemo(
    () =>
      items
        .filter((item): item is GuideDetailItem & { image: string } => Boolean(item.image?.trim()))
        .map((item) => ({ src: item.image.trim(), alt: item.title })),
    [items],
  );

  if (!items.length) {
    return emptyLabel ? <p className="mt-10 text-sm text-muted-foreground">{emptyLabel}</p> : null;
  }

  function openAt(src: string) {
    const i = slides.findIndex((s) => s.src === src);
    if (i >= 0) setIndex(i);
  }

  function preload(src: string) {
    if (typeof window === "undefined") return;
    const img = new window.Image();
    img.src = uploadOriginalUrl(src);
  }

  return (
    <>
      <ul className={cn("mt-2 flex w-full flex-col gap-8 md:mt-4 md:gap-12", className)}>
        {items.map((item, i) => {
          const photoOnRight = i % 2 === 1;
          const itemId = item.id || item.title || String(i);
          const titleSlotKey = cmsSlug ? pageSlotItemTitle(cmsSlug, itemId) : "";
          const textSlotKey = cmsSlug ? pageSlotItemText(cmsSlug, itemId) : "";
          const cmsTitleKey = cmsEditMarkers && titleSlotKey ? titleSlotKey : undefined;
          const cmsTextKey = cmsEditMarkers && textSlotKey ? textSlotKey : undefined;
          const titleStyleProps = titleSlotKey ? pageCmsTextStyleProps(cmsTextStyles, titleSlotKey, locale) : {};
          const textStyleProps = textSlotKey ? pageCmsTextStyleProps(cmsTextStyles, textSlotKey, locale) : {};
          const titleColored = titleSlotKey && pageCmsTextStyleColorized(cmsTextStyles, titleSlotKey, locale);
          const textColored = textSlotKey && pageCmsTextStyleColorized(cmsTextStyles, textSlotKey, locale);
          const rawImage = item.image?.trim();

          return (
            <li
              key={itemId}
              className={cn(
                "rounded-xl border border-[#ead7b4] bg-[#fffcf7] shadow-sm",
                "grid grid-cols-1 md:items-start",
                photoOnRight
                  ? "md:grid-cols-[minmax(14rem,1fr)_minmax(0,1.65fr)]"
                  : "md:grid-cols-[minmax(0,1.65fr)_minmax(14rem,1fr)]",
              )}
            >
              <div className={cn("relative min-w-0", photoOnRight && "md:order-2")}>
                {rawImage ? (
                  <button
                    type="button"
                    className="relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:min-h-[22rem]"
                    onClick={() => openAt(rawImage)}
                    onMouseEnter={() => preload(rawImage)}
                    onFocus={() => preload(rawImage)}
                    aria-label={item.title ? `${item.title} 크게 보기` : "사진 크게 보기"}
                  >
                    <Image
                      src={uploadOriginalUrl(rawImage)}
                      alt={item.title}
                      fill
                      className="guest-photo-bright object-contain object-center"
                      sizes="(max-width: 767px) 100vw, 70vw"
                      quality={90}
                      unoptimized
                      priority={i < 2}
                    />
                  </button>
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-transparent text-sm text-muted-foreground md:min-h-[22rem]">
                    사진 없음
                  </div>
                )}
                {cmsSlug && cmsEditMarkers ? <CmsItemImageSlot cmsSlug={cmsSlug} itemId={itemId} /> : null}
              </div>

              <div
                className={cn(
                  "flex min-w-0 flex-col justify-start p-4 md:min-h-[22rem] md:p-6 lg:p-8",
                  photoOnRight ? "items-start md:items-end md:order-1" : "items-start",
                )}
              >
                {item.eyebrow ? (
                  <p
                    className={cn(
                      "mb-2 w-full text-sm font-medium tracking-wide text-muted-foreground md:text-base",
                      photoOnRight && "md:text-right",
                    )}
                  >
                    {item.eyebrow}
                  </p>
                ) : null}
                <h2
                  {...(cmsTitleKey ? { "data-cms-key": cmsTitleKey } : {})}
                  className={cn(
                    "w-full font-medium leading-snug text-xl md:text-2xl",
                    photoOnRight && "md:text-right",
                    titleStyleProps.className,
                  )}
                  style={titleStyleProps.style}
                  {...(titleColored ? { "data-hero-custom-color": "1" as const } : {})}
                >
                  <CmsInlineBreaks text={item.title} />
                </h2>
                {item.text ? (
                  <div
                    {...(cmsTextKey
                      ? { "data-cms-key": cmsTextKey, "data-cms-body-root": "1" as const }
                      : { "data-cms-body-root": "1" as const })}
                    className={cn(
                      "mt-[2lh] w-full space-y-2 text-base text-muted-foreground",
                      photoOnRight && "md:text-right",
                      textStyleProps.className,
                    )}
                    style={textStyleProps.style}
                    {...(textColored ? { "data-hero-custom-color": "1" as const } : {})}
                  >
                    <Paragraphs text={item.text} className={photoOnRight ? "md:text-right" : undefined} />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {footer}
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
          contentArea
        />
      ) : null}
    </>
  );
}
