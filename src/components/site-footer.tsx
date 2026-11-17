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

  return (
    <>
      <footer className="relative z-10 mt-auto shrink-0 pb-[env(safe-area-inset-bottom)]">
        <div className="site-chrome-shell border-t border-[#e8dcc8]/80 bg-[#fffcf7]/92 text-xs leading-snug text-[color:var(--pastel-chrome-fg)] backdrop-blur-[2px] md:text-base md:leading-snug">
          <div className="flex flex-col gap-3 py-2 md:flex-row md:items-end md:justify-between md:gap-4 md:py-3">
          <div className="min-w-0 text-left leading-snug">
            <p className="font-serif text-sm leading-tight md:text-lg">{t(uiLocale, "site.legalName")}</p>
            <p className="mt-0.5 text-[0.6875rem] opacity-75 md:text-sm">{t(uiLocale, "site.address")}</p>
          </div>
          <HeroCallActions
            videoSrc={heroMedia.videoSrc}
            audioSrc={heroMedia.audioSrc}
            posterSrc={heroMedia.posterSrc}
            placement="footer"
          />
          </div>
        </div>
      </footer>
      <SocialActions links={socialLinks} compact verticalFixed cmsEditMarkers={homeCmsEdit} />
    </>
  );
}
