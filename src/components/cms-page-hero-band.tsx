import Image from "next/image";
import { PAGE_HERO_IMAGE } from "@/components/page-hero";
import { mediaUrl, uploadOriginalUrl } from "@/lib/media";
import { pageSlotHeroImage, pageSlotLead, pageSlotTitle } from "@/lib/page-cms-slots";
import { cn } from "@/lib/utils";

/** 소메뉴 상단 — 배경·제목·요약 (인사말 등) */
export function CmsPageHeroBand({
  kicker,
  title,
  lead,
  heroImage,
  cmsSlug,
  cmsEditMarkers = false,
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

  return (
    <section
      {...(heroKey ? { "data-cms-key": heroKey } : {})}
      className="relative shrink-0 overflow-hidden border-b bg-[#0a2744] text-primary-foreground"
    >
      <Image
        src={bgSrc}
        alt={imageAlt}
        fill
        priority
        className="object-cover object-[center_40%] opacity-70"
        quality={90}
        sizes="100vw"
        unoptimized={Boolean(custom)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a2744]/85 via-[#0a2744]/55 to-[#0a2744]/35" />
      <div
        className={cn(
          "relative mx-auto max-w-6xl px-4",
          large ? "py-12 md:py-16 lg:py-[4.5rem]" : "py-4 md:py-6",
        )}
      >
        <p className="text-[11px] font-medium tracking-[0.2em] text-amber-300/95 uppercase md:text-xs md:tracking-[0.22em]">
          {kicker}
        </p>
        {headline ? (
          <h1
            {...(titleKey ? { "data-cms-key": titleKey } : {})}
            className={cn(
              "mt-2 font-serif font-semibold tracking-tight text-primary-foreground",
              large ? "text-2xl md:text-3xl lg:text-[2.125rem] lg:leading-tight" : "text-xl md:text-2xl",
            )}
          >
            {headline}
          </h1>
        ) : null}
        {leadText ? (
          <p
            {...(leadKey ? { "data-cms-key": leadKey } : {})}
            className={cn(
              "max-w-2xl text-primary-foreground/95",
              large
                ? "mt-3 text-sm leading-relaxed md:mt-4 md:text-base md:leading-7"
                : "mt-1.5 text-sm leading-snug md:mt-2 md:leading-6",
            )}
          >
            {leadText}
          </p>
        ) : null}
      </div>
    </section>
  );
}