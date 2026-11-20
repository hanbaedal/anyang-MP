"use client";

import { useCallback } from "react";
import { CmsInlineBreaks } from "@/components/paragraphs";
import { useLocale, useT } from "@/components/locale-provider";
import { pageSlotItemTitle, pageSlotTitle } from "@/lib/page-cms-slots";
import { pageCmsTextStyleColorized, pageCmsTextStyleProps, type PageCmsTextStyles } from "@/lib/page-cms-text-style";
import { cn } from "@/lib/utils";

export type FeesOrbitItem = {
  id: string;
  title: string;
  /** 앵커 대상 — `#fee-{anchorId}` */
  anchorId: string;
};

/** 십자 배치: 위·왼·오·아래 = CMS 카드 1~4 */
const SLOT_CLASS = ["fees-orbit-slot--n", "fees-orbit-slot--w", "fees-orbit-slot--e", "fees-orbit-slot--s"] as const;

function scrollToFeeSection(anchorId: string) {
  const el = document.getElementById(`fee-${anchorId}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("fees-detail-flash");
  window.setTimeout(() => el.classList.remove("fees-detail-flash"), 1200);
}

/**
 * 관리비 — 중앙 원 + 주변 타원 4개 + 점선 연결.
 * 타원 클릭 시 하단 해당 상세 카드로 스크롤. CMS 슬롯은 하단 카드에만(중복 키 방지).
 */
export function FeesOrbitDiagram({
  hubTitle,
  items,
  cmsEditMarkers = false,
  cmsTextStyles,
  className,
}: {
  hubTitle: string;
  items: FeesOrbitItem[];
  cmsEditMarkers?: boolean;
  cmsTextStyles?: PageCmsTextStyles;
  className?: string;
}) {
  const locale = useLocale();
  const t = useT();
  const list = items.slice(0, 4);
  const hubStyleProps = pageCmsTextStyleProps(cmsTextStyles, pageSlotTitle("fees"), locale);
  const hubColored = pageCmsTextStyleColorized(cmsTextStyles, pageSlotTitle("fees"), locale);

  const onActivate = useCallback(
    (anchorId: string) => {
      if (cmsEditMarkers) return;
      scrollToFeeSection(anchorId);
    },
    [cmsEditMarkers],
  );

  return (
    <div className={cn("fees-orbit", className)} role="navigation" aria-label={hubTitle || t("fees.title")}>
      <svg className="fees-orbit-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <line className="fees-orbit-line" x1="50" y1="50" x2="50" y2="18" />
        <line className="fees-orbit-line" x1="50" y1="50" x2="18" y2="50" />
        <line className="fees-orbit-line" x1="50" y1="50" x2="82" y2="50" />
        <line className="fees-orbit-line" x1="50" y1="50" x2="50" y2="82" />
      </svg>

      <div
        className="fees-orbit-hub"
        style={hubStyleProps.style}
        {...(hubColored ? { "data-hero-custom-color": "1" as const } : {})}
      >
        <span className={cn("fees-orbit-hub-label", hubStyleProps.className)}>
          <CmsInlineBreaks text={hubTitle || t("fees.title")} />
        </span>
      </div>

      {list.map((item, index) => {
        const slot = SLOT_CLASS[index] ?? SLOT_CLASS[0];
        const titleKey = pageSlotItemTitle("fees", item.id);
        const titleStyleProps = pageCmsTextStyleProps(cmsTextStyles, titleKey, locale);
        const titleColored = pageCmsTextStyleColorized(cmsTextStyles, titleKey, locale);
        const tone = (index % 4) + 1;

        return (
          <button
            key={item.id}
            type="button"
            className={cn("fees-orbit-oval", `fees-orbit-oval--${tone}`, slot)}
            style={titleStyleProps.style}
            {...(titleColored ? { "data-hero-custom-color": "1" as const } : {})}
            onClick={() => onActivate(item.anchorId)}
            aria-label={`${item.title} — ${t("more.detail")}`}
          >
            <span className={cn("fees-orbit-oval-label", titleStyleProps.className)}>
              <CmsInlineBreaks text={item.title} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
