"use client";

import { CmsInlineBreaks, Paragraphs } from "@/components/paragraphs";
import { CmsItemImageSlot } from "@/components/cms-edit/cms-item-image-slot";
import { useLocale } from "@/components/locale-provider";
import { SITE } from "@/lib/site";
import { pageSlotItemText, pageSlotItemTitle } from "@/lib/page-cms-slots";
import { pageCmsTextStyleColorized, pageCmsTextStyleProps, type PageCmsTextStyles } from "@/lib/page-cms-text-style";
import { cn } from "@/lib/utils";

export type FuneralOrbitItem = {
  id: string;
  title: string;
  text?: string;
};

/**
 * 십자 배치 (CMS items[0..3]):
 * 북=안치 접수 · 서=공원 도착 · 동=고인 안치 · 남=비석 각자
 */
const SLOT_CLASS = ["fun-orbit-slot--n", "fun-orbit-slot--w", "fun-orbit-slot--e", "fun-orbit-slot--s"] as const;

/**
 * AMP-131: 이용절차 — 중앙「안양공원」원 + 상하좌우 넓은 면(제목+설명) 첨부형.
 */
export function FuneralAttachedOrbit({
  hubTitle = SITE.shortName,
  items,
  cmsEditMarkers = false,
  cmsTextStyles,
  className,
}: {
  hubTitle?: string;
  items: FuneralOrbitItem[];
  cmsEditMarkers?: boolean;
  cmsTextStyles?: PageCmsTextStyles;
  className?: string;
}) {
  const locale = useLocale();
  const list = items.slice(0, 4);

  return (
    <div className={cn("fun-orbit", className)} role="list" aria-label={hubTitle || SITE.shortName}>
      <svg className="fun-orbit-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <line className="fun-orbit-line" x1="50" y1="50" x2="50" y2="18" />
        <line className="fun-orbit-line" x1="50" y1="50" x2="18" y2="50" />
        <line className="fun-orbit-line" x1="50" y1="50" x2="82" y2="50" />
        <line className="fun-orbit-line" x1="50" y1="50" x2="50" y2="82" />
      </svg>

      <div className="fun-orbit-hub">
        <span className="fun-orbit-hub-label">
          <CmsInlineBreaks text={hubTitle || SITE.shortName} />
        </span>
      </div>

      {list.map((item, index) => {
        const slot = SLOT_CLASS[index] ?? SLOT_CLASS[0];
        const titleKey = pageSlotItemTitle("funeral", item.id);
        const textKey = pageSlotItemText("funeral", item.id);
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
            className={cn("fun-orbit-panel", `fun-orbit-panel--${tone}`, slot)}
          >
            {cmsEditMarkers ? <CmsItemImageSlot cmsSlug="funeral" itemId={item.id} /> : null}
            <h3
              {...(cmsTitleKey ? { "data-cms-key": cmsTitleKey } : {})}
              className={cn("fun-orbit-panel-title", titleStyleProps.className)}
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
                className={cn("fun-orbit-panel-body", textStyleProps.className)}
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
