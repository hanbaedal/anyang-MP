import { HeroCallActions } from "@/components/hero-actions";
import { HomeHeroMedia } from "@/components/home-hero-media";
import { SiteAnnouncements } from "@/components/site-announcements";
import { getHomeHeroSettings } from "@/lib/home-hero";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export default async function HomePage() {
  const locale = await readLocale();
  const heroMedia = await getHomeHeroSettings();
  return (
    <>
      <SiteAnnouncements />
      {/* 헤더(h-12) 아래 첫 화면을 채우고, 카피는 하단 가장자리에만 둔다 */}
      <section className="relative min-h-[calc(100dvh-3rem)] w-full flex-1 overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0">
          <HomeHeroMedia
            videoSrc={heroMedia.videoSrc}
            audioSrc={heroMedia.audioSrc}
            posterSrc={heroMedia.posterSrc}
          />
          <div className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        </div>
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end px-4 pb-5 pt-0 sm:px-6 sm:pb-7 md:px-10 md:pb-8">
          <div className="pointer-events-auto flex flex-col items-center justify-end gap-4 text-center md:flex-row md:items-end md:justify-between md:gap-8 md:text-left">
            <div className="w-full min-w-0 md:w-auto">
              <p className="text-sm tracking-wide text-primary-foreground/85">{t(locale, "home.kicker")}</p>
              <h1 className="mt-2 font-serif leading-tight text-primary-foreground">
                <span className="block break-keep text-3xl md:whitespace-nowrap md:text-[2.15rem] lg:text-[2.35rem]">
                  {locale === "ko" ? (
                    <>
                      접근성이 뛰어난
                      <span className="hidden md:inline"> </span>
                      <br className="md:hidden" />
                      명당자리
                    </>
                  ) : (
                    t(locale, "home.hero1")
                  )}
                </span>
                <span className="mt-1 block break-keep text-3xl md:text-4xl lg:text-[2.75rem]">
                  {t(locale, "home.hero2")}
                </span>
              </h1>
              <p className="mt-3 break-keep text-sm tracking-wide text-primary-foreground/85 md:whitespace-nowrap">
                {locale === "ko" ? (
                  <>
                    매장·평장·봉안과 이미 모신 자리의 관리까지,
                    <span className="hidden md:inline"> </span>
                    <br className="md:hidden" />
                    전화 한 통과 방문으로 안내합니다.
                  </>
                ) : (
                  t(locale, "home.lead")
                )}
              </p>
            </div>
            <div className="flex shrink-0 justify-center md:justify-end">
              <HeroCallActions />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
