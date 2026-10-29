"use client";

import { useState } from "react";
import { HeroCallActions } from "@/components/hero-actions";
import { HomeHeroMedia } from "@/components/home-hero-media";
import { HomeViewSlides, type ViewSlide } from "@/components/home-view-slides";
import { ParkViewVideoModal } from "@/components/park-view-video-modal";
import { useLocale, useT } from "@/components/locale-provider";
import { t as tStatic } from "@/lib/i18n";

type Props = {
  videoSrc: string;
  audioSrc: string;
  posterSrc: string;
  viewPhotos: ViewSlide[];
};

/** 홈 인트로: 음소거 배경 영상 + 전경 슬라이드 + 공원전경 영상 모달 */
export function HomeIntro({ videoSrc, audioSrc, posterSrc, viewPhotos }: Props) {
  const locale = useLocale();
  const t = useT();
  const [viewOpen, setViewOpen] = useState(false);

  return (
    <section className="relative min-h-full w-full flex-1 overflow-hidden bg-primary text-primary-foreground">
      <div className="absolute inset-0">
        <HomeHeroMedia
          videoSrc={videoSrc}
          audioSrc={audioSrc}
          posterSrc={posterSrc}
          paused={viewOpen}
        />
        <HomeViewSlides photos={viewPhotos} paused={viewOpen} />
        <div className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end px-4 pb-5 pt-0 sm:px-6 sm:pb-7 md:px-10 md:pb-8">
        <div className="pointer-events-auto flex flex-col items-center justify-end gap-4 text-center md:flex-row md:items-end md:justify-between md:gap-8 md:text-left">
          <div className="w-full min-w-0 md:w-auto">
            <p className="text-sm tracking-wide text-primary-foreground/85">{t("home.kicker")}</p>
            <h1 className="mt-2 font-serif leading-tight text-primary-foreground">
              <span className="block whitespace-nowrap text-[1.125rem] tracking-tight sm:text-xl md:text-[2.15rem] lg:text-[2.35rem]">
                {locale === "ko" ? "접근성이 뛰어난 명당자리" : t("home.hero1")}
              </span>
              <span className="mt-1 block break-keep text-2xl md:text-4xl lg:text-[2.75rem]">
                {t("home.hero2")}
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
                tStatic(locale, "home.lead")
              )}
            </p>
          </div>
          <div className="flex shrink-0 justify-center md:justify-end">
            <HeroCallActions onParkView={() => setViewOpen(true)} />
          </div>
        </div>
      </div>
      <ParkViewVideoModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        videoSrc={videoSrc}
        posterSrc={posterSrc}
      />
    </section>
  );
}
