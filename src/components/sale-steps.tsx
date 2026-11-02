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
 * 분양 절차 — 공원 특징과 같은 카드 크기(2열·min-height)·소프트 오버레이.
 * 단계 번호는 유지. 사진은 CMS 갤러리 연결(없으면 기본 공원 사진).
 */
export function SaleSteps({
  compact = false,
  steps,
  className,
}: {
  compact?: boolean;
  /** CMS에서 넘긴 단계. 없으면 i18n 기본 5단계 */
  steps?: SaleStepView[];
  className?: string;
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
    <ol className={cn("grid gap-4 sm:gap-5 md:grid-cols-2", className)}>
      {rows.map((step, index) => {
        const raw = step.image?.trim() || fallbackImage(index);
        const src = uploadOriginalUrl(raw);

        return (
          <li
            key={`${step.n}-${step.title}`}
            className="pc-viewport-card relative isolate min-h-[15.5rem] overflow-hidden rounded-2xl shadow-sm sm:min-h-[17rem] md:min-h-[18.5rem]"
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

            <div className="pc-viewport-card-body relative z-10 flex min-h-[15.5rem] flex-col justify-center gap-2.5 p-5 sm:min-h-[17rem] sm:p-6 md:min-h-[18.5rem] md:max-w-[85%] md:p-7">
              <p className="font-serif text-sm tracking-wide text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] sm:text-base">
                {t("step.n", { n: step.n })}
              </p>
              <h3 className="text-lg font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] sm:text-xl md:text-[1.35rem]">
                {step.title}
              </h3>
              {compact || !step.text ? null : (
                <div className="space-y-1.5 text-[13px] leading-6 text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] sm:text-sm sm:leading-7">
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
