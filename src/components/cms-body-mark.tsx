import { Paragraphs } from "@/components/paragraphs";
import { pageSlotBody } from "@/lib/page-cms-slots";
import type { ReactNode } from "react";

/** CMS 본문 슬롯 — 클릭 편집 마커 */
export function CmsBodyMark({
  cmsSlug,
  cmsEditMarkers = false,
  text,
  className,
  children,
}: {
  cmsSlug: string;
  cmsEditMarkers?: boolean;
  text?: string;
  className?: string;
  children?: ReactNode;
}) {
  const key = cmsEditMarkers ? pageSlotBody(cmsSlug) : undefined;
  return (
    <div {...(key ? { "data-cms-key": key } : {})} className={className}>
      {children ?? (text ? <Paragraphs text={text} /> : null)}
    </div>
  );
}