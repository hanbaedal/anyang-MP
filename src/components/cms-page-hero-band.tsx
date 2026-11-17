import Image from "next/image";
import { PAGE_HERO_IMAGE } from "@/components/page-hero";
import { mediaUrl, uploadOriginalUrl } from "@/lib/media";
import type { Locale } from "@/lib/i18n";
import { pageSlotHeroImage, pageSlotLead, pageSlotTitle } from "@/lib/page-cms-slots";
import {
  pageCmsTextStyleColorized,
  pageCmsTextStyleProps,
  type PageCmsTextStyles,
} from "@/lib/page-cms-text-style";
import { CmsInlineBreaks } from "@/components/paragraphs";
import { cn } from "@/lib/utils";

/** 소메뉴 상단 — 배경·제목·요약 (인사말 등) */
export function CmsPageHeroBand({
  kicker,
  title,
  lead,
  heroImage,
  cmsSlug,
  cmsEditMarkers = false,
  locale = "ko" as Locale,
  textStyles,
  imageAlt,
  large = false,
}: {
  kicker: string;
  title: string;
  lead?: string;
  /** 업로드 경로 — 없으면 공통 기본 배경 */
  heroImage?: string;
  cmsSlug?: string;
  cmsEditMarkers?: boolean;
  locale?: Locale;
  textStyles?: PageCmsTextStyles;
  imageAlt: string;
  large?: boolean;
}) {
  const custom = heroImage?.trim() || "";
  const bgSrc = custom ? uploadOriginalUrl(custom) : mediaUrl(PAGE_HERO_IMAGE);
  const heroKey = cmsSlug && cmsEditMarkers ? pageSlotHeroImage(cmsSlug) : undefined;
  const titleKey = cmsSlug && cmsEditMarkers ? pageSlotTitle(cmsSlug) : undefined;
  const leadKey = cmsSlug && cmsEditMarkers ? pageSlotLead(cmsSlug) : undefined;
  const headline = title.trim();
  const leadText = lead?.trim();
  const titleStyleKey = cmsSlug ? pageSlotTitle(cmsSlug) : "";
  const leadStyleKey = cmsSlug ? pageSlotLead(cmsSlug) : "";
  const titleStyleProps = titleStyleKey ? pageCmsTextStyleProps(textStyles, titleStyleKey, locale) : {};
  const leadStyleProps = leadStyleKey ? pageCmsTextStyleProps(textStyles, leadStyleKey, locale) : {};
  const titleColored = titleStyleKey && pageCmsTextStyleColorized(textStyles, titleStyleKey, locale);
  const leadColored = leadStyleKey && pageCmsTextStyleColorized(textStyles, leadStyleKey, locale);

  return (
    <section
      {...(heroKey ? { "data-cms-key": heroKey } : {})}
      className="relative shrink-0 overflow-hidden border-b bg-muted text-primary-foreground"
    >
      <Image
        src={bgSrc}
        alt={imageAlt}
        fill
        priority
        className="object-cover object-[center_40%]"
        sizes="100vw"
        unoptimized
      />
      <div
        className={cn(
          "site-container relative",
          large ? "py-12 md:py-16 lg:py-[4.5rem]" : "py-4 md:py-6",
        )}
      >
        <p className="text-[11px] font-medium tracking-[0.2em] text-amber-300 uppercase [text-shadow:0_1px_3px_rgba(0,0,0,.9),0_2px_12px_rgba(0,0,0,.65)] md:text-xs md:tracking-[0.22em]">
          {kicker}
        </p>
        {headline ? (
          <h1
            {...(titleKey ? { "data-cms-key": titleKey } : {})}
            className={cn(
              "mt-2 font-serif font-semibold tracking-tight [text-shadow:0_2px_8px_rgba(0,0,0,.92),0_0_2px_rgba(0,0,0,1),0_0_32px_rgba(0,0,0,.55)]",
              !titleColored && "text-white",
              titleStyleProps.className,
              large ? "text-2xl md:text-3xl lg:text-[2.125rem] lg:leading-tight" : "text-xl md:text-2xl",
            )}
            style={titleStyleProps.style}
            {...(titleColored ? { "data-hero-custom-color": "1" as const } : {})}
          >
            <CmsInlineBreaks text={headline} />
          </h1>
        ) : null}
        {leadText ? (
          <p
            {...(leadKey ? { "data-cms-key": leadKey } : {})}
            className={cn(
              "max-w-2xl [text-shadow:0_1px_6px_rgba(0,0,0,.9),0_0_2px_rgba(0,0,0,1),0_0_28px_rgba(0,0,0,.5)]",
              !leadColored && "text-white/98",
              leadStyleProps.className,
              large
                ? "mt-3 text-sm leading-relaxed md:mt-4 md:text-base md:leading-7"
                : "mt-1.5 text-sm leading-snug md:mt-2 md:leading-6",
            )}
            style={leadStyleProps.style}
            {...(leadColored ? { "data-hero-custom-color": "1" as const } : {})}
          >
            <CmsInlineBreaks text={leadText} />
          </p>
        ) : null}
      </div>
    </section>
  );
}