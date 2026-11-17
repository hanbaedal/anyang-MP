import { CmsInlineBreaks, Paragraphs } from "@/components/paragraphs";
import { GuideCardCoverImage } from "@/components/guide-card-cover-image";
import {
  cardHasGalleryImage,
  featureRainbowPastelClass,
  featureRainbowShapeClass,
  guideCardBodyTextClass,
  guideCardPastelSurface,
  guideCardTitleClass,
  GUIDE_CARD_PHOTO_FOOT_SCRIM,
  guideCardPhotoCopyWrap,
  guideCardPhotoTextHighlight,
} from "@/lib/guide-photo-card";
import { CmsItemImageSlot } from "@/components/cms-edit/cms-item-image-slot";
import type { Locale } from "@/lib/i18n";
import { pageSlotItemText, pageSlotItemTitle } from "@/lib/page-cms-slots";
import { pageCmsTextStyleColorized, pageCmsTextStyleProps, type PageCmsTextStyles } from "@/lib/page-cms-text-style";
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
  /** 공원특징 4카드 — 연한 무지개 파스텔·상단 가운데 정렬 */
  featureRainbow = false,
  cmsSlug,
  cmsEditMarkers = false,
  locale = "ko" as Locale,
  cmsTextStyles,
}: {
  items: FeaturePhotoItem[];
  className?: string;
  /** 오시는길 등 — 한 화면용 낮은 카드 */
  dense?: boolean;
  hideTitle?: boolean;
  titleBar?: boolean;
  captionFirstLine?: boolean;
  viewportFill?: boolean;
  featureRainbow?: boolean;
  cmsSlug?: string;
  cmsEditMarkers?: boolean;
  locale?: Locale;
  cmsTextStyles?: PageCmsTextStyles;
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
        featureRainbow && !dense && !transit && "features-rainbow-grid",
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
        const alt = title || text || "photo";
        const itemId = item.id || item.title || String(index);
        const titleSlotKey = cmsSlug && !hideTitle && !captionFirstLine ? pageSlotItemTitle(cmsSlug, itemId) : "";
        const textSlotKey = cmsSlug ? pageSlotItemText(cmsSlug, itemId) : "";
        const cmsTitleKey = cmsEditMarkers && titleSlotKey ? titleSlotKey : undefined;
        const cmsTextKey = cmsEditMarkers && textSlotKey ? textSlotKey : undefined;
        const titleStyleProps = titleSlotKey ? pageCmsTextStyleProps(cmsTextStyles, titleSlotKey, locale) : {};
        const textStyleProps = textSlotKey ? pageCmsTextStyleProps(cmsTextStyles, textSlotKey, locale) : {};
        const titleColored = titleSlotKey && pageCmsTextStyleColorized(cmsTextStyles, titleSlotKey, locale);
        const textColored = textSlotKey && pageCmsTextStyleColorized(cmsTextStyles, textSlotKey, locale);
        const showCmsImageChip = Boolean(cmsSlug && cmsEditMarkers);
        const rainbow = featureRainbow && !dense && !transit;
        const copyOnPhoto = hasPhoto && !rainbow;

        return (
          <article
            key={itemId}
            className={cn(
              "pc-viewport-card relative isolate",
              !rainbow && "overflow-hidden rounded-2xl shadow-sm",
              rainbow &&
                cn(
                  featureRainbowPastelClass(index),
                  featureRainbowShapeClass(index),
                  "feature-rainbow-card pc-viewport-card--features-rainbow",
                ),
              !rainbow && !hasPhoto && guideCardPastelSurface(index),
              transit && "flex flex-col shadow-md ring-1 ring-[color:var(--pastel-chrome-border)]",
              !dense && "pc-viewport-card--scale",
              transit
                ? "h-auto min-h-[10.5rem] sm:min-h-[11.5rem] md:min-h-[12.5rem] lg:min-h-[13rem]"
                : dense
                ? "min-h-[9.5rem] sm:min-h-[10.5rem] md:min-h-[11.5rem]"
                : fill
                  ? "min-h-[12rem] sm:min-h-[13rem] md:h-full md:min-h-0"
                  : rainbow
                    ? "min-h-[15.5rem] w-full sm:min-h-[17rem] md:min-h-[18.5rem]"
                    : "min-h-[15.5rem] sm:min-h-[17rem] md:min-h-[18.5rem]",
            )}
          >
            {hasPhoto ? (
              <GuideCardCoverImage
                imagePath={item.image!.trim()}
                alt={alt}
                index={index}
                dense={dense}
                className={rainbow ? "opacity-[0.14]" : undefined}
              />
            ) : null}
            {showCmsImageChip ? <CmsItemImageSlot cmsSlug={cmsSlug!} itemId={itemId} /> : null}
            {hasPhoto && showCopy && !transit && !rainbow ? (
              <div className={GUIDE_CARD_PHOTO_FOOT_SCRIM} aria-hidden />
            ) : null}

            {showCopy ? (
              <div
                className={cn(
                  "pc-viewport-card-body relative z-[25] flex w-full flex-col md:max-w-full",
                  transit
                    ? "min-h-0 flex-1 justify-start gap-0 p-0"
                    : rainbow
                      ? "h-full min-h-0 items-center justify-center text-center md:max-w-full"
                      : "justify-end md:max-w-[92%]",
                  rainbow && "gap-0 px-6 py-4 sm:px-7 sm:py-5 md:px-8 md:py-6",
                  !rainbow &&
                    (dense && !transit
                      ? "min-h-[9.5rem] gap-1 p-4 sm:min-h-[10.5rem] sm:p-4 md:min-h-[11.5rem] md:p-5"
                      : transit
                        ? undefined
                        : fill
                          ? "min-h-[12rem] gap-2.5 p-5 sm:min-h-[13rem] sm:p-6 md:h-full md:min-h-0 md:justify-center md:p-7"
                          : "min-h-[15.5rem] gap-2.5 p-5 sm:min-h-[17rem] sm:p-6 md:min-h-[18.5rem] md:p-7 md:justify-end"),
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
                      className={cn(
                        "text-base font-semibold tracking-tight sm:text-[1.05rem]",
                        !titleColored && "text-[color:var(--pastel-chrome-fg)]",
                        titleStyleProps.className,
                      )}
                      style={titleStyleProps.style}
                      {...(titleColored ? { "data-hero-custom-color": "1" as const } : {})}
                    >
                      <CmsInlineBreaks text={title} />
                    </h3>
                    </div>
                ) : null}
                <div
                  className={cn(
                    copyOnPhoto && guideCardPhotoCopyWrap({ dense }),
                    (!hasPhoto || rainbow) && "flex w-full flex-col",
                    rainbow && "items-center",
                    transit && hasPhoto && showText && "mx-3 mb-3 mt-0 sm:mx-4",
                  )}
                >
                  {showTitle && !transit ? (
                    <h3
                      {...(cmsTitleKey ? { "data-cms-key": cmsTitleKey } : {})}
                      className={cn(
                        guideCardTitleClass({ onPhoto: copyOnPhoto, dense }),
                        copyOnPhoto && cn(guideCardPhotoTextHighlight(), "w-fit max-w-full"),
                        rainbow && "w-full text-center",
                        titleStyleProps.className,
                      )}
                      style={titleStyleProps.style}
                      {...(titleColored ? { "data-hero-custom-color": "1" as const } : {})}
                    >
                      <CmsInlineBreaks text={title} />
                    </h3>
                  ) : null}
                  {showText ? (
                    <div
                      {...(cmsTextKey
                        ? { "data-cms-key": cmsTextKey, "data-cms-body-root": "1" as const }
                        : { "data-cms-body-root": "1" as const })}
                      className={cn(
                        guideCardBodyTextClass({ onPhoto: copyOnPhoto, dense }),
                        rainbow && "mt-3 w-full max-w-[min(100%,32rem)] text-center",
                        transit && !hasPhoto && "flex-1 p-4 pt-3 sm:p-4 sm:pt-3.5 md:p-4 md:pt-3",
                        transit && hasPhoto && "w-fit max-w-full",
                        textStyleProps.className,
                      )}
                      style={textStyleProps.style}
                      {...(textColored ? { "data-hero-custom-color": "1" as const } : {})}
                    >
                    {captionFirstLine ? (
                      /* 첫 줄 전체 표시 — line-clamp/truncate/ellipsis 금지(중간 절단 없음). 길면 줄바꿈만. */
                      <p
                        className={cn(
                          "whitespace-normal break-words text-inherit",
                          copyOnPhoto && guideCardPhotoTextHighlight(),
                        )}
                      >
                        {text}
                      </p>
                    ) : (
                      <Paragraphs
                        text={text}
                        className={cn("text-inherit", copyOnPhoto && guideCardPhotoTextHighlight())}
                      />
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
