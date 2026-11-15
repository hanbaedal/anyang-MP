import Image from "next/image";
import { Paragraphs } from "@/components/paragraphs";
import {
  cardHasGalleryImage,
  guideCardBodyTextClass,
  guideCardPastelSurface,
  guideCardTitleClass,
  GUIDE_CARD_PHOTO_FOOT_SCRIM,
  guideCardPhotoCopyPanel,
} from "@/lib/guide-photo-card";
import { CmsItemImageSlot } from "@/components/cms-edit/cms-item-image-slot";
import { pageSlotItemText, pageSlotItemTitle } from "@/lib/page-cms-slots";
import { uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type FeaturePhotoItem = {
  id?: string;
  title: string;
  text?: string;
  image?: string;
};

/** CMS·복사본에 남을 수 있는 「모억」오기를 「묘역」으로 통일 */
export function normalizeFeatureCopy(text: string) {
  return text.replaceAll("모억", "묘역");
}

/**
 * 본문 **첫 줄 전체** (빈 줄 건너뜀). 중간 글자 자르기 없음.
 * 비어 있으면 "" → 공개에서 문구 생략.
 */
export function firstBodyLine(text: string) {
  return (
    text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? ""
  );
}

/**
 * 공원 특징 2×2 — 풀블리드 사진 + 좌측 흰 글씨 오버레이.
 * 비-dense(AMP-77): PC에서 열 폭 비례 aspect. dense(오시는길)는 rem 높이만.
 */
export function FeaturesPhotoGrid({
  items,
  className,
  dense = false,
  /** 오시는길 등: 카드 제목 숨김 */
  hideTitle = false,
  /** 오시는길: 상단 라벨로 자가용·버스·택시 구분 */
  titleBar = false,
  /** @deprecated AMP-75 — 본문 전체 표시. 제목만 숨기려면 hideTitle */
  captionFirstLine = false,
  /** PC 잔여 높이 2×2 fill (AMP-79) — dense와 병행하지 않음 */
  viewportFill = false,
  cmsSlug,
  cmsEditMarkers = false,
}: {
  items: FeaturePhotoItem[];
  className?: string;
  /** 오시는길 등 — 한 화면용 낮은 카드 */
  dense?: boolean;
  hideTitle?: boolean;
  titleBar?: boolean;
  captionFirstLine?: boolean;
  viewportFill?: boolean;
  cmsSlug?: string;
  cmsEditMarkers?: boolean;
}) {
  if (!items.length) return null;
  const fill = viewportFill && !dense;
  const transit = dense && titleBar;

  return (
    <div
      className={cn(
        "grid gap-4 sm:gap-5 md:grid-cols-2",
        dense && !transit && "gap-3 sm:gap-3",
        transit && "grid-cols-1 gap-4 sm:gap-4 md:gap-3 lg:gap-4",
        fill && "pc-onepage-grow pc-onepage-grid-2 md:gap-3",
        className,
      )}
    >
      {items.map((item, index) => {
        const title = normalizeFeatureCopy(item.title ?? "");
        const raw = item.text ? normalizeFeatureCopy(item.text) : "";
        const text = captionFirstLine ? firstBodyLine(raw) : raw;
        const showTitle = !(hideTitle || captionFirstLine) && Boolean(title);
        const showText = Boolean(text);
        const showCopy = showTitle || showText;
        const hasPhoto = cardHasGalleryImage(item.image);
        const src = hasPhoto ? uploadOriginalUrl(item.image!.trim()) : "";
        const alt = title || text || "photo";
        const itemId = item.id || item.title || String(index);
        const cmsTitleKey =
          cmsSlug && cmsEditMarkers && !hideTitle && !captionFirstLine
            ? pageSlotItemTitle(cmsSlug, itemId)
            : undefined;
        const cmsTextKey = cmsSlug && cmsEditMarkers ? pageSlotItemText(cmsSlug, itemId) : undefined;
        const showCmsImageChip = Boolean(cmsSlug && cmsEditMarkers);

        return (
          <article
            key={itemId}
            className={cn(
              "pc-viewport-card relative isolate overflow-hidden rounded-2xl shadow-sm",
              !hasPhoto && guideCardPastelSurface(index),
              transit && "flex flex-col shadow-md ring-1 ring-[color:var(--pastel-chrome-border)]",
              !dense && "pc-viewport-card--scale",
              transit
                ? "h-auto min-h-[10.5rem] sm:min-h-[11.5rem] md:min-h-[12.5rem] lg:min-h-[13rem]"
                : dense
                ? "min-h-[9.5rem] sm:min-h-[10.5rem] md:min-h-[11.5rem]"
                : fill
                  ? "min-h-[12rem] sm:min-h-[13rem] md:h-full md:min-h-0"
                  : "min-h-[15.5rem] sm:min-h-[17rem] md:min-h-[18.5rem]",
            )}
          >
            {hasPhoto ? (
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover object-center"
                sizes={dense ? "(max-width: 767px) 100vw, 33vw" : "(max-width: 767px) 100vw, 50vw"}
                priority={index < 2}
                unoptimized={src.includes("/api/uploads/")}
              />
            ) : null}
            {showCmsImageChip ? <CmsItemImageSlot cmsSlug={cmsSlug!} itemId={itemId} /> : null}
            {hasPhoto && showCopy && !transit ? (
              <div className={GUIDE_CARD_PHOTO_FOOT_SCRIM} aria-hidden />
            ) : null}

            {showCopy ? (
              <div
                className={cn(
                  "pc-viewport-card-body relative z-[25] flex w-full flex-col md:max-w-full",
                  transit
                    ? "min-h-0 flex-1 justify-start gap-0 p-0"
                    : "justify-end md:max-w-[92%]",
                  dense && !transit
                    ? "min-h-[9.5rem] gap-1 p-4 sm:min-h-[10.5rem] sm:p-4 md:min-h-[11.5rem] md:p-5"
                    : transit
                      ? undefined
                      : fill
                      ? "min-h-[12rem] gap-2.5 p-5 sm:min-h-[13rem] sm:p-6 md:h-full md:min-h-0 md:justify-center md:p-7"
                      : "min-h-[15.5rem] gap-2.5 p-5 sm:min-h-[17rem] sm:p-6 md:min-h-[18.5rem] md:p-7 md:justify-end",
                )}
              >
                {showTitle && transit ? (
                  <div
                    className={cn(
                      "border-b px-4 py-2.5 sm:px-4 sm:py-3",
                      hasPhoto
                        ? "border-[color:var(--pastel-chrome-border)] bg-[#fffcf7]/97 backdrop-blur-md"
                        : "border-[color:var(--pastel-chrome-border)] bg-[#fffcf7]/95",
                    )}
                  >
                    <h3
                      {...(cmsTitleKey ? { "data-cms-key": cmsTitleKey } : {})}
                      className="text-base font-semibold tracking-tight text-[color:var(--pastel-chrome-fg)] sm:text-[1.05rem]"
                    >
                      {title}
                    </h3>
                  </div>
                ) : null}
                <div
                  className={cn(
                    hasPhoto && !transit && guideCardPhotoCopyPanel({ dense }),
                    transit && hasPhoto && showText && "mx-3 mb-3 mt-0 sm:mx-4",
                    transit && hasPhoto && showText && guideCardPhotoCopyPanel({ dense: true }),
                  )}
                >
                  {showTitle && !transit ? (
                    <h3
                      {...(cmsTitleKey ? { "data-cms-key": cmsTitleKey } : {})}
                      className={guideCardTitleClass({ onPhoto: false, dense })}
                    >
                      {title}
                    </h3>
                  ) : null}
                  {showText ? (
                    <div
                      {...(cmsTextKey ? { "data-cms-key": cmsTextKey } : {})}
                      className={cn(
                        guideCardBodyTextClass({ onPhoto: false, dense }),
                        transit && !hasPhoto && "flex-1 p-4 pt-3 sm:p-4 sm:pt-3.5 md:p-4 md:pt-3",
                        transit && hasPhoto && "flex-1",
                      )}
                    >
                    {captionFirstLine ? (
                      /* 첫 줄 전체 표시 — line-clamp/truncate/ellipsis 금지(중간 절단 없음). 길면 줄바꿈만. */
                      <p className="whitespace-normal break-words text-inherit">{text}</p>
                    ) : (
                      <Paragraphs text={text} className="text-inherit" />
                    )}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
