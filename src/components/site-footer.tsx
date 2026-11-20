import { HeroCallActions } from "@/components/hero-call-actions";
import { SocialActions } from "@/components/hero-actions";
import { readSession } from "@/lib/auth";
import { isCmsStaff } from "@/lib/auth-types";
import { getHomeHeroSettings } from "@/lib/home-hero";
import { getHomeIntroSlidesSettings } from "@/lib/home-intro-slides";
import { isGuestLocalePath, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { defaultSiteSocialLinks } from "@/lib/site-social";
import { headers } from "next/headers";

export async function SiteFooter() {
  const locale = await readLocale();
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const uiLocale = isGuestLocalePath(pathname) ? locale : "ko";
  const heroMedia = await getHomeHeroSettings();
  const session = await readSession();
  const homeCmsEdit =
    pathname === "/" && h.get("x-home-cms-edit") === "1" && Boolean(session && isCmsStaff(session.role));
  const homeSettings = await getHomeIntroSlidesSettings();
  const socialLinks = homeSettings.socialLinks?.length ? homeSettings.socialLinks : defaultSiteSocialLinks();

  const callProps = {
    videoSrc: heroMedia.videoSrc,
    audioSrc: heroMedia.audioSrc,
    posterSrc: heroMedia.posterSrc,
    placement: "footer" as const,
  };

  return (
    <>
      <footer className="relative z-10 mt-auto shrink-0 pb-[env(safe-area-inset-bottom)]">
        <div className="site-chrome-shell border-t border-[#e8dcc8]/80 bg-[#fffcf7]/92 text-xs leading-snug text-[color:var(--pastel-chrome-fg)] backdrop-blur-[2px] md:text-base md:leading-snug">
          {/* AMP-105 모바일: 문의전화 → 회사명 → 주소 → 오시는길·공원영상 (가운데) */}
          <div className="flex flex-col items-center gap-2.5 py-2.5 md:hidden">
            <HeroCallActions {...callProps} showPhone showDirections={false} showParkView={false} />
            <div className="min-w-0 w-full px-2 text-center leading-snug">
              {/* AMP-116: 회사명 한 줄 */}
              <p className="whitespace-nowrap font-serif text-[0.8125rem] leading-tight tracking-tight">
                {t(uiLocale, "site.legalName")}
              </p>
              <p className="mt-0.5 text-[0.6875rem] opacity-75">{t(uiLocale, "site.address")}</p>
            </div>
            <HeroCallActions {...callProps} showPhone={false} showDirections showParkView />
          </div>

          {/* PC: 기존 — 좌측 회사명·주소 / 우측 CTA */}
          <div className="hidden py-3 md:flex md:flex-row md:items-end md:justify-between md:gap-4">
            <div className="min-w-0 text-left leading-snug">
              <p className="font-serif text-lg leading-tight">{t(uiLocale, "site.legalName")}</p>
              <p className="mt-0.5 text-sm opacity-75">{t(uiLocale, "site.address")}</p>
            </div>
            <HeroCallActions {...callProps} />
          </div>
        </div>
      </footer>
      <SocialActions links={socialLinks} compact verticalFixed cmsEditMarkers={homeCmsEdit} />
    </>
  );
}
