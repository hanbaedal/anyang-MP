import { FooterCallActions } from "@/components/footer-call-actions";
import { SocialActions } from "@/components/hero-actions";
import { getHomeHeroSettings } from "@/lib/home-hero";
import { isGuestLocalePath, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { headers } from "next/headers";

export async function SiteFooter() {
  const locale = await readLocale();
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const uiLocale = isGuestLocalePath(pathname) ? locale : "ko";
  const hero = await getHomeHeroSettings();

  return (
    <>
      <footer className="relative z-30 shrink-0 border-t border-transparent bg-transparent pb-[env(safe-area-inset-bottom)] text-xs leading-snug text-[color:var(--pastel-chrome-fg)] md:text-base md:leading-snug">
        <div className="grid grid-cols-1 items-center gap-2 px-3 py-2 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-end md:gap-4 md:px-5 md:py-3">
          <div className="min-w-0 text-left leading-snug md:justify-self-start">
            <p className="font-serif text-sm leading-tight md:text-lg">{t(uiLocale, "site.legalName")}</p>
            <p className="mt-0.5 text-[0.6875rem] opacity-75 md:text-sm">{t(uiLocale, "site.address")}</p>
          </div>
          <div className="flex min-w-0 justify-center md:justify-self-center">
            <FooterCallActions
              videoSrc={hero.videoSrc}
              audioSrc={hero.audioSrc}
              posterSrc={hero.posterSrc}
            />
          </div>
          {/* SNS는 우측 세로 고정 레일 — 푸터 칸은 균형용 */}
          <div className="hidden md:block" aria-hidden />
        </div>
      </footer>
      <SocialActions compact verticalFixed />
    </>
  );
}
