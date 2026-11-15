"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Paragraphs } from "@/components/paragraphs";
import {
  cardHasGalleryImage,
  guideCardBodyTextClass,
  guideCardEyebrowClass,
  guideCardPastelSurface,
  guideCardTitleClass,
  GUIDE_CARD_SKY_OVERLAY_FULL,
  GUIDE_CARD_SKY_OVERLAY_LEFT,
} from "@/lib/guide-photo-card";
import { uploadOriginalUrl } from "@/lib/media";
import { SALE_STEPS } from "@/lib/site";
import { useT } from "@/components/locale-provider";
import { CmsItemImageSlot } from "@/components/cms-edit/cms-item-image-slot";
import { pageSlotItemText, pageSlotItemTitle } from "@/lib/page-cms-slots";
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
}) {
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
        const src = hasPhoto ? uploadOriginalUrl(step.image!.trim()) : "";
        const stepId = step.id || `step-${step.n}`;
        const cmsTitleKey = cmsSlug && cmsEditMarkers ? pageSlotItemTitle(cmsSlug, stepId) : undefined;
        const cmsTextKey = cmsSlug && cmsEditMarkers ? pageSlotItemText(cmsSlug, stepId) : undefined;
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
              <Image
                src={src}
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width: 767px) 100vw, 50vw"
                priority={index < 2}
                unoptimized={src.includes("/api/uploads/")}
                aria-hidden
              />
            ) : null}
            {showCmsImageChip ? <CmsItemImageSlot cmsSlug={cmsSlug!} itemId={stepId} /> : null}
            {hasPhoto ? (
              <>
                <div className={cn("absolute inset-0", GUIDE_CARD_SKY_OVERLAY_FULL)} aria-hidden />
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 w-[78%] max-w-lg",
                    GUIDE_CARD_SKY_OVERLAY_LEFT,
                  )}
                  aria-hidden
                />
              </>
            ) : null}

            <div
              className={cn(
                "pc-viewport-card-body relative z-[25] flex flex-col justify-center gap-2.5 p-5 sm:p-6 md:max-w-[85%] md:p-7",
                viewportFill
                  ? "min-h-[12rem] sm:min-h-[13rem] md:h-full md:min-h-0"
                  : "min-h-[15.5rem] sm:min-h-[17rem] md:min-h-[18.5rem]",
              )}
            >
              <p className={guideCardEyebrowClass(hasPhoto)}>{t("step.n", { n: step.n })}</p>
              <h3
                {...(cmsTitleKey ? { "data-cms-key": cmsTitleKey } : {})}
                className={guideCardTitleClass({ onPhoto: hasPhoto })}
              >
                {step.title}
              </h3>
              {compact || !step.text ? null : (
                <div
                  {...(cmsTextKey ? { "data-cms-key": cmsTextKey } : {})}
                  className={cn(guideCardBodyTextClass({ onPhoto: hasPhoto }), "overflow-auto")}
                >
                  <Paragraphs text={step.text} className="text-inherit" />
                </div>
              )}
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
