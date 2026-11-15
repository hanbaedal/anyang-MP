"use client";

import type { ReactNode } from "react";
import { CmsHomeSlidesSlot } from "@/components/cms-edit/cms-home-slides-slot";
import { HomeHeroMedia } from "@/components/home-hero-media";
import { HomeViewSlides, type ViewSlide } from "@/components/home-view-slides";
import { useLocale, useT } from "@/components/locale-provider";
import { t as tStatic } from "@/lib/i18n";
import type { HomeIntroHeroCopy } from "@/lib/home-intro-slides-types";
import type { HomeCmsSlotKey } from "@/lib/home-cms-slots";
import { cn } from "@/lib/utils";

type Props = {
  videoSrc: string;
  audioSrc: string;
  posterSrc: string;
  viewPhotos: ViewSlide[];
  heroCopy: HomeIntroHeroCopy;
  /** 홈페이지 CMS: 클릭으로 슬롯 선택 → 우측 패널 편집 */
  cmsSlot?: {
    activeKey: HomeCmsSlotKey | null;
    onSelect: (key: HomeCmsSlotKey) => void;
  };
  /** 공개 홈 iframe 미리보기 — data-cms-key만 표시(클릭은 bridge) */
  cmsEditMarkers?: boolean;
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

function CmsPick({
  slotKey,
  cmsSlot,
  cmsEditMarkers,
  className,
  children,
}: {
  slotKey: HomeCmsSlotKey;
  cmsSlot?: Props["cmsSlot"];
  cmsEditMarkers?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (cmsEditMarkers && !cmsSlot) {
    return (
      <span data-cms-key={slotKey} className={className}>
        {children}
      </span>
    );
  }
  if (!cmsSlot) return <>{children}</>;
  const active = cmsSlot.activeKey === slotKey;
  return (
    <span
      role="button"
      tabIndex={0}
      data-cms-key={slotKey}
      className={cn("cms-editable-slot", active && "cms-slot-active", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        cmsSlot.onSelect(slotKey);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cmsSlot.onSelect(slotKey);
        }
      }}
    >
      {children}
    </span>
  );
}

/** 홈 인트로: 전경 슬라이드 + 하단 카피 (문의 CTA는 푸터) */
export function HomeIntro({
  videoSrc,
  audioSrc,
  posterSrc,
  viewPhotos,
  heroCopy,
  cmsSlot,
  cmsEditMarkers = false,
}: Props) {
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
        <HomeViewSlides photos={viewPhotos} paused={false} cmsEdit={cmsEditMarkers} />
        {cmsSlot ? (
          <button
            type="button"
            data-cms-key="home.slides"
            className={cn(
              "absolute inset-0 z-[8] border-0 bg-transparent p-0",
              "cursor-pointer cms-editable-slot",
              cmsSlot.activeKey === "home.slides" && "cms-slot-active",
            )}
            aria-label="메인 전경 슬라이드 편집"
            onClick={() => cmsSlot.onSelect("home.slides")}
          />
        ) : null}
        {cmsEditMarkers ? (
          <>
            <button
              type="button"
              data-cms-key="home.slides"
              className="absolute inset-0 z-[8] cursor-pointer border-0 bg-transparent p-0"
              aria-label="메인 전경 슬라이드 편집"
            />
            <CmsHomeSlidesSlot />
          </>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end px-4 pb-5 pt-0 sm:px-6 sm:pb-7 md:px-10 md:pb-8">
        <div className="pointer-events-auto w-full min-w-0 text-center md:max-w-[min(100%,40rem)] md:text-left">
          <div>
            <>
              <CmsPick slotKey="home.kicker" cmsSlot={cmsSlot} cmsEditMarkers={cmsEditMarkers}>
                <p className="text-sm tracking-wide text-primary-foreground/85">{kicker}</p>
              </CmsPick>
              <h1 className="mt-2 font-serif leading-tight text-primary-foreground">
                <CmsPick slotKey="home.heroLine1" cmsSlot={cmsSlot} cmsEditMarkers={cmsEditMarkers} className="block">
                  <span className="block break-keep text-[1.125rem] tracking-tight sm:text-xl md:text-[2.15rem] lg:text-[2.35rem] md:whitespace-nowrap">
                    {hero1}
                  </span>
                </CmsPick>
                <CmsPick slotKey="home.heroLine2" cmsSlot={cmsSlot} cmsEditMarkers={cmsEditMarkers} className="mt-1 block">
                  <span className="block break-keep text-2xl md:text-4xl lg:text-[2.75rem]">{hero2}</span>
                </CmsPick>
              </h1>
              <CmsPick slotKey="home.lead" cmsSlot={cmsSlot} cmsEditMarkers={cmsEditMarkers} className="mt-3 block">
                <p className="break-keep text-sm tracking-wide text-primary-foreground/85 md:whitespace-nowrap">
                  {locale === "ko" ? renderLeadKo(heroCopy.lead) : tStatic(locale, "home.lead")}
                </p>
              </CmsPick>
            </>
          </div>
        </div>
      </div>
    </section>
  );
}
