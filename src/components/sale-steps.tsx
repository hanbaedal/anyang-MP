"use client";

import type { ReactNode } from "react";
import { Paragraphs } from "@/components/paragraphs";
import { GuideCardCoverImage } from "@/components/guide-card-cover-image";
import {
  cardHasGalleryImage,
  guideCardBodyTextClass,
  guideCardEyebrowClass,
  guideCardPastelSurface,
  guideCardTitleClass,
  GUIDE_CARD_PHOTO_FOOT_SCRIM,
  guideCardPhotoCopyWrap,
  guideCardPhotoTextHighlight,
} from "@/lib/guide-photo-card";
import { SALE_STEPS } from "@/lib/site";
import { useT } from "@/components/locale-provider";
import { CmsItemImageSlot } from "@/components/cms-edit/cms-item-image-slot";
import { useLocale } from "@/components/locale-provider";
import { pageSlotItemText, pageSlotItemTitle } from "@/lib/page-cms-slots";
import { pageCmsTextStyleColorized, pageCmsTextStyleProps, type PageCmsTextStyles } from "@/lib/page-cms-text-style";
import { cn } from "@/lib/utils";

export type SaleStepView = { n: string; title: string; text: string; image?: string; id?: string };

/**
 * 분양 절차 — 2열·소프트 오버레이.
 * AMP-77 폭/aspect · AMP-79 `viewportFill` · AMP-81 `aside` = 5번 옆(6번째 셀).
 */
export function SaleSteps({
  compact = false,
  steps,
  className,
  viewportFill = false,
  /** PC: 5번째 카드 우측 칸 · 모바일: 카드 아래 스택 */
  aside = null,
  cmsSlug,
  cmsEditMarkers = false,
  cmsTextStyles,
}: {
  compact?: boolean;
  /** CMS에서 넘긴 단계. 없으면 i18n 기본 5단계 */
  steps?: SaleStepView[];
  className?: string;
  /** PC 한 화면 fill (이용안내 하위) */
  viewportFill?: boolean;
  aside?: ReactNode;
  cmsSlug?: string;
  cmsEditMarkers?: boolean;
  cmsTextStyles?: PageCmsTextStyles;
}) {
  const locale = useLocale();
  const t = useT();
  const rows: SaleStepView[] =
    steps && steps.length
      ? steps
      : SALE_STEPS.map((step) => ({
          n: step.n,
          title: t(step.titleKey),
          text: t(step.textKey),
        }));

  return (
    <ol
      className={cn(
        "grid gap-4 sm:gap-5 md:grid-cols-2",
        viewportFill && "pc-onepage-grow pc-onepage-grid-2 md:gap-3",
        className,
      )}
    >
      {rows.map((step, index) => {
        const hasPhoto = cardHasGalleryImage(step.image);
        const stepId = step.id || `step-${step.n}`;
        const titleSlotKey = cmsSlug ? pageSlotItemTitle(cmsSlug, stepId) : "";
        const textSlotKey = cmsSlug ? pageSlotItemText(cmsSlug, stepId) : "";
        const cmsTitleKey = cmsEditMarkers && titleSlotKey ? titleSlotKey : undefined;
        const cmsTextKey = cmsEditMarkers && textSlotKey ? textSlotKey : undefined;
        const titleStyleProps = titleSlotKey ? pageCmsTextStyleProps(cmsTextStyles, titleSlotKey, locale) : {};
        const textStyleProps = textSlotKey ? pageCmsTextStyleProps(cmsTextStyles, textSlotKey, locale) : {};
        const titleColored = titleSlotKey && pageCmsTextStyleColorized(cmsTextStyles, titleSlotKey, locale);
        const textColored = textSlotKey && pageCmsTextStyleColorized(cmsTextStyles, textSlotKey, locale);
        const showCmsImageChip = Boolean(cmsSlug && cmsEditMarkers);

        return (
          <li
            key={`${step.n}-${step.title}`}
            className={cn(
              "pc-viewport-card pc-viewport-card--scale relative isolate overflow-hidden rounded-2xl shadow-sm",
              !hasPhoto && guideCardPastelSurface(index),
              viewportFill
                ? "min-h-[12rem] sm:min-h-[13rem] md:h-full md:min-h-0"
                : "min-h-[15.5rem] sm:min-h-[17rem] md:min-h-[18.5rem]",
            )}
          >
            {hasPhoto ? (
              <div className="absolute inset-0" aria-hidden>
                <GuideCardCoverImage imagePath={step.image!.trim()} alt="" index={index} />
              </div>
            ) : null}
            {showCmsImageChip ? <CmsItemImageSlot cmsSlug={cmsSlug!} itemId={stepId} /> : null}
            {hasPhoto ? <div className={GUIDE_CARD_PHOTO_FOOT_SCRIM} aria-hidden /> : null}

            <div
              className={cn(
                "pc-viewport-card-body relative z-[25] flex flex-col justify-end gap-2 p-5 sm:p-6 md:max-w-[92%] md:p-7",
                viewportFill
                  ? "min-h-[12rem] sm:min-h-[13rem] md:h-full md:min-h-0"
                  : "min-h-[15.5rem] sm:min-h-[17rem] md:min-h-[18.5rem]",
              )}
            >
              <div className={cn(hasPhoto && guideCardPhotoCopyWrap())}>
                <p
                  className={cn(
                    guideCardEyebrowClass(false),
                    hasPhoto && cn(guideCardPhotoTextHighlight(), "w-fit"),
                  )}
                >
                  {t("step.n", { n: step.n })}
                </p>
                <h3
                  {...(cmsTitleKey ? { "data-cms-key": cmsTitleKey } : {})}
                  className={cn(
                    guideCardTitleClass({ onPhoto: false }),
                    hasPhoto && cn(guideCardPhotoTextHighlight(), "w-fit max-w-full"),
                    titleStyleProps.className,
                  )}
                  style={titleStyleProps.style}
                  {...(titleColored ? { "data-hero-custom-color": "1" as const } : {})}
                >
                  {step.title}
                </h3>
                {compact || !step.text ? null : (
                  <div
                    {...(cmsTextKey ? { "data-cms-key": cmsTextKey } : {})}
                    className={cn(
                      guideCardBodyTextClass({ onPhoto: false }),
                      hasPhoto && guideCardPhotoTextHighlight(),
                      "overflow-auto",
                      textStyleProps.className,
                    )}
                    style={textStyleProps.style}
                    {...(textColored ? { "data-hero-custom-color": "1" as const } : {})}
                  >
                    <Paragraphs text={step.text} className="text-inherit" />
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
      {aside ? (
        <li
          className={cn(
            "list-none",
            viewportFill
              ? "pc-onepage-cell min-h-[12rem] sm:min-h-[13rem] md:h-full md:min-h-0"
              : "min-h-[15.5rem] sm:min-h-[17rem] md:min-h-[18.5rem]",
          )}
        >
          {aside}
        </li>
      ) : null}
    </ol>
  );
}
