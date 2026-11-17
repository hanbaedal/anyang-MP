import { CmsInlineBreaks } from "@/components/paragraphs";
import { pageSlotLead, pageSlotTitle } from "@/lib/page-cms-slots";

/** CMS 소메뉴 — 파스텔 본문 상단 제목·요약 */
export function CmsPageIntro({
  title,
  lead,
  cmsSlug,
  cmsEditMarkers = false,
}: {
  title: string;
  lead?: string;
  cmsSlug?: string;
  cmsEditMarkers?: boolean;
}) {
  const headline = title.trim();
  const leadText = lead?.trim();
  if (!headline && !leadText) return null;
  const titleKey = cmsSlug && cmsEditMarkers ? pageSlotTitle(cmsSlug) : undefined;
  const leadKey = cmsSlug && cmsEditMarkers ? pageSlotLead(cmsSlug) : undefined;
  return (
    <header className="mb-5 border-b border-[color:var(--pastel-chrome-border)] pb-4 md:mb-6 md:pb-5">
      {headline ? (
        <h1
          {...(titleKey ? { "data-cms-key": titleKey } : {})}
          className="font-serif text-2xl font-semibold tracking-tight text-[color:var(--pastel-chrome-fg)] md:text-[1.65rem]"
        >
          <CmsInlineBreaks text={headline} />
        </h1>
      ) : null}
      {leadText ? (
        <p
          {...(leadKey ? { "data-cms-key": leadKey } : {})}
          className="mt-2 max-w-3xl text-[15px] leading-relaxed text-[color:var(--pastel-chrome-fg)]/88 md:mt-2.5 md:text-base md:leading-7"
        >
          <CmsInlineBreaks text={leadText} />
        </p>
      ) : null}
    </header>
  );
}