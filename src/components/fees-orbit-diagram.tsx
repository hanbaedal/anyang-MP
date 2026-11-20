"use client";

import { CmsInlineBreaks, Paragraphs } from "@/components/paragraphs";
import { CmsItemImageSlot } from "@/components/cms-edit/cms-item-image-slot";
import { useLocale, useT } from "@/components/locale-provider";
import { pageSlotItemText, pageSlotItemTitle, pageSlotTitle } from "@/lib/page-cms-slots";
import { pageCmsTextStyleColorized, pageCmsTextStyleProps, type PageCmsTextStyles } from "@/lib/page-cms-text-style";
import { cn } from "@/lib/utils";

export type FeesOrbitItem = {
  id: string;
  title: string;
  text?: string;
};

/**
 * 십자 배치 (참고 목업):
 * 북=부과 기준 · 서=납부 방법 · 동=연체 안내 · 남=요금 변동
 * = CMS items[0..3]
 */
const SLOT_CLASS = ["fees-orbit-slot--n", "fees-orbit-slot--w", "fees-orbit-slot--e", "fees-orbit-slot--s"] as const;

/**
 * 관리비 — 중앙 원 + 주변 타원 4개(제목+본문) + 점선.
 * AMP-117: 하단 상세 카드 없이 타원이 CMS 본문. 편집 슬롯은 타원에 직접.
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

  return (
    <div className={cn("fees-orbit", className)} role="list" aria-label={hubTitle || t("fees.title")}>
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
        const textKey = pageSlotItemText("fees", item.id);
        const cmsTitleKey = cmsEditMarkers ? titleKey : undefined;
        const cmsTextKey = cmsEditMarkers ? textKey : undefined;
        const titleStyleProps = pageCmsTextStyleProps(cmsTextStyles, titleKey, locale);
        const textStyleProps = pageCmsTextStyleProps(cmsTextStyles, textKey, locale);
        const titleColored = pageCmsTextStyleColorized(cmsTextStyles, titleKey, locale);
        const textColored = pageCmsTextStyleColorized(cmsTextStyles, textKey, locale);
        const tone = (index % 4) + 1;
        const body = item.text?.trim() ?? "";

        return (
          <article
            key={item.id}
            role="listitem"
            className={cn("fees-orbit-oval", `fees-orbit-oval--${tone}`, slot)}
          >
            {cmsEditMarkers ? <CmsItemImageSlot cmsSlug="fees" itemId={item.id} /> : null}
            <h3
              {...(cmsTitleKey ? { "data-cms-key": cmsTitleKey } : {})}
              className={cn("fees-orbit-oval-label", titleStyleProps.className)}
              style={titleStyleProps.style}
              {...(titleColored ? { "data-hero-custom-color": "1" as const } : {})}
            >
              <CmsInlineBreaks text={item.title} />
            </h3>
            {body ? (
              <div
                {...(cmsTextKey
                  ? { "data-cms-key": cmsTextKey, "data-cms-body-root": "1" as const }
                  : { "data-cms-body-root": "1" as const })}
                className={cn("fees-orbit-oval-body", textStyleProps.className)}
                style={textStyleProps.style}
                {...(textColored ? { "data-hero-custom-color": "1" as const } : {})}
              >
                <Paragraphs text={body} className="text-inherit" />
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
