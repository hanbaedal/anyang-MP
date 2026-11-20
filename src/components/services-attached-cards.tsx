"use client";

import { CmsInlineBreaks, Paragraphs } from "@/components/paragraphs";
import { CmsItemImageSlot } from "@/components/cms-edit/cms-item-image-slot";
import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";
import { pageSlotItemText, pageSlotItemTitle } from "@/lib/page-cms-slots";
import { pageCmsTextStyleColorized, pageCmsTextStyleProps, type PageCmsTextStyles } from "@/lib/page-cms-text-style";
import { cn } from "@/lib/utils";

export type ServicesAttachedItem = {
  id?: string;
  title: string;
  text?: string;
  image?: string;
};

/**
 * AMP-130: 이용안내 — 왼쪽 원(제목) + 오른쪽 3D 사각 막대(내용), 첨부형.
 * CMS 슬롯·편집 마커 유지.
 */
export function ServicesAttachedCards({
  items,
  cmsSlug = "services",
  cmsEditMarkers = false,
  locale: localeProp,
  cmsTextStyles,
  className,
}: {
  items: ServicesAttachedItem[];
  cmsSlug?: string;
  cmsEditMarkers?: boolean;
  locale?: Locale;
  cmsTextStyles?: PageCmsTextStyles;
  className?: string;
}) {
  const localeHook = useLocale();
  const locale = localeProp ?? localeHook;
  if (!items.length) return null;

  return (
    <ul className={cn("svc-attach", className)} role="list">
      {items.map((item, index) => {
        const itemId = item.id || item.title || String(index);
        const tone = (index % 5) + 1;
        const titleKey = pageSlotItemTitle(cmsSlug, itemId);
        const textKey = pageSlotItemText(cmsSlug, itemId);
        const cmsTitleKey = cmsEditMarkers ? titleKey : undefined;
        const cmsTextKey = cmsEditMarkers ? textKey : undefined;
        const titleStyleProps = pageCmsTextStyleProps(cmsTextStyles, titleKey, locale);
        const textStyleProps = pageCmsTextStyleProps(cmsTextStyles, textKey, locale);
        const titleColored = pageCmsTextStyleColorized(cmsTextStyles, titleKey, locale);
        const textColored = pageCmsTextStyleColorized(cmsTextStyles, textKey, locale);
        const body = item.text?.trim() ?? "";

        return (
          <li
            key={itemId}
            role="listitem"
            className={cn("svc-attach-row", `svc-attach-row--${tone}`)}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            {cmsEditMarkers ? <CmsItemImageSlot cmsSlug={cmsSlug} itemId={itemId} /> : null}
            <div className="svc-attach-circle" aria-hidden={false}>
              <h3
                {...(cmsTitleKey ? { "data-cms-key": cmsTitleKey } : {})}
                className={cn("svc-attach-circle-label", titleStyleProps.className)}
                style={titleStyleProps.style}
                {...(titleColored ? { "data-hero-custom-color": "1" as const } : {})}
              >
                <CmsInlineBreaks text={item.title} />
              </h3>
            </div>
            <div className="svc-attach-bar">
              {body ? (
                <div
                  {...(cmsTextKey
                    ? { "data-cms-key": cmsTextKey, "data-cms-body-root": "1" as const }
                    : { "data-cms-body-root": "1" as const })}
                  className={cn("svc-attach-bar-body", textStyleProps.className)}
                  style={textStyleProps.style}
                  {...(textColored ? { "data-hero-custom-color": "1" as const } : {})}
                >
                  <Paragraphs text={body} className="text-inherit" />
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
