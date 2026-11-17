"use client";

import type { ReactNode } from "react";
import { CmsInlineBreaks, Paragraphs } from "@/components/paragraphs";
import { useLocale, useT } from "@/components/locale-provider";
import { PROCEDURE_ORB_PASTELS } from "@/lib/procedure-orbs";
import { pageSlotItemText, pageSlotItemTitle } from "@/lib/page-cms-slots";
import { pageCmsTextStyleColorized, pageCmsTextStyleProps, type PageCmsTextStyles } from "@/lib/page-cms-text-style";
import { cn } from "@/lib/utils";
import type { SaleStepView } from "@/components/sale-steps";

function ProcedureOrb({
  step,
  index,
  lead,
  cmsSlug,
  cmsEditMarkers,
  cmsTextStyles,
  compact,
  stepLabel,
}: {
  step: SaleStepView;
  index: number;
  lead?: boolean;
  cmsSlug?: string;
  cmsEditMarkers?: boolean;
  cmsTextStyles?: PageCmsTextStyles;
  compact?: boolean;
  stepLabel: string;
}) {
  const locale = useLocale();
  const stepId = step.id || `step-${step.n}`;
  const titleSlotKey = cmsSlug ? pageSlotItemTitle(cmsSlug, stepId) : "";
  const textSlotKey = cmsSlug ? pageSlotItemText(cmsSlug, stepId) : "";
  const cmsTitleKey = cmsEditMarkers && titleSlotKey ? titleSlotKey : undefined;
  const cmsTextKey = cmsEditMarkers && textSlotKey ? textSlotKey : undefined;
  const titleStyleProps = titleSlotKey ? pageCmsTextStyleProps(cmsTextStyles, titleSlotKey, locale) : {};
  const textStyleProps = textSlotKey ? pageCmsTextStyleProps(cmsTextStyles, textSlotKey, locale) : {};
  const titleColored = titleSlotKey && pageCmsTextStyleColorized(cmsTextStyles, titleSlotKey, locale);
  const textColored = textSlotKey && pageCmsTextStyleColorized(cmsTextStyles, textSlotKey, locale);
  const pastel = PROCEDURE_ORB_PASTELS[index % PROCEDURE_ORB_PASTELS.length]!;

  return (
    <div
      role="listitem"
      className={cn(
        "procedure-orb",
        lead && "procedure-orb--lead",
        "flex flex-col items-center justify-center border text-center",
        "shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_6px_18px_rgba(15,23,42,0.08)]",
        pastel,
      )}
    >
      <p className="text-[10px] font-medium tracking-wide text-[color:var(--pastel-chrome-fg)]/75 sm:text-[11px]">
        {stepLabel}
      </p>
      <h3
        {...(cmsTitleKey ? { "data-cms-key": cmsTitleKey } : {})}
        className={cn(
          "mt-1 px-2 text-sm font-semibold leading-snug text-[color:var(--pastel-chrome-fg)] sm:text-[0.9375rem]",
          titleStyleProps.className,
        )}
        style={titleStyleProps.style}
        {...(titleColored ? { "data-hero-custom-color": "1" as const } : {})}
      >
        <CmsInlineBreaks text={step.title} />
      </h3>
      {compact || !step.text ? null : (
        <div
          {...(cmsTextKey
            ? { "data-cms-key": cmsTextKey, "data-cms-body-root": "1" as const }
            : { "data-cms-body-root": "1" as const })}
          className={cn(
            "mt-1.5 max-h-[5.5rem] overflow-auto px-2.5 text-[11px] leading-5 text-[color:var(--pastel-chrome-fg)]/90 sm:max-h-none sm:text-xs sm:leading-[1.45]",
            textStyleProps.className,
          )}
          style={textStyleProps.style}
          {...(textColored ? { "data-hero-custom-color": "1" as const } : {})}
        >
          <Paragraphs text={step.text} className="text-inherit" />
        </div>
      )}
    </div>
  );
}

function ProcedureOrbsArrow() {
  return (
    <svg className="procedure-orbs-arrow" viewBox="0 0 88 72" width="88" height="72" aria-hidden>
      <defs>
        <linearGradient id="procedure-orbs-arrow-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d4edd6" />
          <stop offset="55%" stopColor="#9ed0a0" />
          <stop offset="100%" stopColor="#f5e8b0" />
        </linearGradient>
        <marker id="procedure-orbs-arrow-head" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#8cb88e" />
        </marker>
      </defs>
      <path
        d="M 6 58 C 38 8, 52 8, 82 28"
        fill="none"
        stroke="url(#procedure-orbs-arrow-grad)"
        strokeWidth="4"
        strokeLinecap="round"
        markerEnd="url(#procedure-orbs-arrow-head)"
      />
    </svg>
  );
}

/** 분양 절차 전용 — 5개 파스텔 원형 + 흐름 화살표 (첨부 목업 배치) */
export function ProcedureOrbsSteps({
  steps,
  className,
  aside = null,
  compact = false,
  cmsSlug,
  cmsEditMarkers = false,
  cmsTextStyles,
}: {
  steps: SaleStepView[];
  className?: string;
  aside?: ReactNode;
  compact?: boolean;
  cmsSlug?: string;
  cmsEditMarkers?: boolean;
  cmsTextStyles?: PageCmsTextStyles;
}) {
  const t = useT();
  const list = steps.slice(0, 5);

  return (
    <div className={cn("space-y-8", className)}>
      <div className="procedure-orbs" role="list" aria-label={t("proc.title")}>
        {list.map((step, index) => (
          <div
            key={step.id || step.n}
            className={cn(
              index === 0 && "procedure-orb-slot--1",
              index === 1 && "procedure-orb-slot--2",
              index === 2 && "procedure-orb-slot--3",
              index === 3 && "procedure-orb-slot--4",
              index === 4 && "procedure-orb-slot--5",
            )}
          >
            <ProcedureOrb
              step={step}
              index={index}
              lead={index === 0}
              cmsSlug={cmsSlug}
              cmsEditMarkers={cmsEditMarkers}
              cmsTextStyles={cmsTextStyles}
              compact={compact}
              stepLabel={t("step.n", { n: step.n })}
            />
          </div>
        ))}
        <div className="procedure-orbs-arrow-wrap" aria-hidden>
          <ProcedureOrbsArrow />
        </div>
      </div>
      {aside ? <div className="procedure-orbs-aside w-full max-w-none">{aside}</div> : null}
    </div>
  );
}