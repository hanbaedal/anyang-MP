"use client";

import { HomeHeroMedia } from "@/components/home-hero-media";
import { HomeViewSlides, type ViewSlide } from "@/components/home-view-slides";
import { useLocale, useT } from "@/components/locale-provider";
import { t as tStatic } from "@/lib/i18n";
import type { HomeIntroHeroCopy } from "@/lib/home-intro-slides-types";

type Props = {
  videoSrc: string;
  audioSrc: string;
  posterSrc: string;
  viewPhotos: ViewSlide[];
  heroCopy: HomeIntroHeroCopy;
};

function renderLeadKo(lead: string) {
  const lines = lead
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length > 1) {
    return lines.map((line, i) => (
      <span key={i}>
        {i > 0 ? (
          <>
            <span className="hidden md:inline"> </span>
            <br className="md:hidden" />
          </>
        ) : null}
        {line}
      </span>
    ));
  }
  const single = lines[0] ?? lead;
  const commaIdx = single.indexOf(",");
  if (commaIdx === -1) return single;
  const first = single.slice(0, commaIdx + 1);
  const rest = single.slice(commaIdx + 1).trim();
  return (
    <>
      {first}
      <span className="hidden md:inline"> </span>
      <br className="md:hidden" />
      {rest}
    </>
  );
}

/** 홈 인트로: 전경 슬라이드 + 하단 카피 (문의 CTA는 푸터) */
export function HomeIntro({ videoSrc, audioSrc, posterSrc, viewPhotos, heroCopy }: Props) {
  const locale = useLocale();
  const t = useT();
  const useSlides = viewPhotos.length > 0;
  const kicker = locale === "ko" ? heroCopy.kicker : t("home.kicker");
  const hero1 = locale === "ko" ? heroCopy.heroLine1 : t("home.hero1");
  const hero2 = locale === "ko" ? heroCopy.heroLine2 : t("home.hero2");

  return (
    <section className="relative min-h-full w-full flex-1 overflow-hidden bg-primary text-primary-foreground">
      <div className="absolute inset-0">
        <HomeHeroMedia
          videoSrc={videoSrc}
          audioSrc={audioSrc}
          posterSrc={posterSrc}
          hideVideo={useSlides}
        />
        <HomeViewSlides photos={viewPhotos} paused={false} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end px-4 pb-5 pt-0 sm:px-6 sm:pb-7 md:px-10 md:pb-8">
        <div className="pointer-events-auto w-full min-w-0 text-center md:max-w-[min(100%,40rem)] md:text-left">
          <div>
            <p className="text-sm tracking-wide text-primary-foreground/85">{kicker}</p>
            <h1 className="mt-2 font-serif leading-tight text-primary-foreground">
              <span className="block break-keep text-[1.125rem] tracking-tight sm:text-xl md:text-[2.15rem] lg:text-[2.35rem] md:whitespace-nowrap">
                {hero1}
              </span>
              <span className="mt-1 block break-keep text-2xl md:text-4xl lg:text-[2.75rem]">
                {hero2}
              </span>
            </h1>
            <p className="mt-3 break-keep text-sm tracking-wide text-primary-foreground/85 md:whitespace-nowrap">
              {locale === "ko" ? renderLeadKo(heroCopy.lead) : tStatic(locale, "home.lead")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
