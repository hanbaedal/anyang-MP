import { Paragraphs } from "@/components/paragraphs";
import type { Locale } from "@/lib/i18n";
import { pageSlotBody } from "@/lib/page-cms-slots";
import { pageCmsTextStyleColorized, pageCmsTextStyleProps, type PageCmsTextStyles } from "@/lib/page-cms-text-style";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** CMS 본문 슬롯 — 클릭 편집 마커 */
export function CmsBodyMark({
  cmsSlug,
  cmsEditMarkers = false,
  text,
  className,
  children,
  locale = "ko" as Locale,
  textStyles,
}: {
  cmsSlug: string;
  cmsEditMarkers?: boolean;
  text?: string;
  className?: string;
  children?: ReactNode;
  locale?: Locale;
  textStyles?: PageCmsTextStyles;
}) {
  const slotKey = pageSlotBody(cmsSlug);
  const key = cmsEditMarkers ? slotKey : undefined;
  const styleProps = pageCmsTextStyleProps(textStyles, slotKey, locale);
  const colorized = pageCmsTextStyleColorized(textStyles, slotKey, locale);
  return (
    <div
      {...(key ? { "data-cms-key": key } : {})}
      className={cn(className, styleProps.className)}
      style={styleProps.style}
      {...(colorized ? { "data-hero-custom-color": "1" as const } : {})}
    >
      {children ?? (text ? <Paragraphs text={text} /> : null)}
    </div>
  );
}