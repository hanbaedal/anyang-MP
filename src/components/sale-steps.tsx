"use client";

import Image from "next/image";
import { Paragraphs } from "@/components/paragraphs";
import { SALE_STEPS, FEATURES } from "@/lib/site";
import { uploadOriginalUrl } from "@/lib/media";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export type SaleStepView = { n: string; title: string; text: string; image?: string };

function fallbackImage(index: number) {
  return FEATURES[index % FEATURES.length]?.image ?? "/images/park-overview.jpg";
}

/**
 * 분양 절차 — 2열·소프트 오버레이.
 * AMP-77 폭/aspect · AMP-79 `viewportFill` 시 PC 잔여 높이 균등 분할(aspect 완화).
 */
export function SaleSteps({
  compact = false,
  steps,
  className,
  viewportFill = false,
}: {
  compact?: boolean;
  /** CMS에서 넘긴 단계. 없으면 i18n 기본 5단계 */
  steps?: SaleStepView[];
  className?: string;
  /** PC 한 화면 fill (이용안내 하위) */
  viewportFill?: boolean;
}) {
  const t = useT();
  const rows: SaleStepView[] =
    steps && steps.length
      ? steps
      : SALE_STEPS.map((step, index) => ({
          n: step.n,
          title: t(step.titleKey),
          text: t(step.textKey),
          image: fallbackImage(index),
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
        const raw = step.image?.trim() || fallbackImage(index);
        const src = uploadOriginalUrl(raw);

        return (
          <li
            key={`${step.n}-${step.title}`}
            className={cn(
              "pc-viewport-card pc-viewport-card--scale relative isolate overflow-hidden rounded-2xl shadow-sm",
              viewportFill
                ? "min-h-[12rem] sm:min-h-[13rem] md:h-full md:min-h-0"
                : "min-h-[15.5rem] sm:min-h-[17rem] md:min-h-[18.5rem]",
            )}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover object-center opacity-90"
              sizes="(max-width: 767px) 100vw, 50vw"
              priority={index < 2}
              unoptimized={src.includes("/api/uploads/")}
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#001a33]/78 via-[#001a33]/45 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 w-[78%] max-w-lg bg-gradient-to-r from-black/35 to-transparent" aria-hidden />

            <div
              className={cn(
                "pc-viewport-card-body relative z-10 flex flex-col justify-center gap-2.5 p-5 sm:p-6 md:max-w-[85%] md:p-7",
                viewportFill
                  ? "min-h-[12rem] sm:min-h-[13rem] md:min-h-0 md:h-full"
                  : "min-h-[15.5rem] sm:min-h-[17rem] md:min-h-[18.5rem]",
              )}
            >
              <p className="font-serif text-sm tracking-wide text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] sm:text-base">
                {t("step.n", { n: step.n })}
              </p>
              <h3 className="text-lg font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] sm:text-xl md:text-[1.35rem]">
                {step.title}
              </h3>
              {compact || !step.text ? null : (
                <div className="space-y-1.5 overflow-auto text-[13px] leading-6 text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] sm:text-sm sm:leading-7">
                  <Paragraphs text={step.text} className="text-inherit" />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
