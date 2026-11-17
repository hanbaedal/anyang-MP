"use client";

import type { ReactNode } from "react";
import { CmsHomeSlidesSlot } from "@/components/cms-edit/cms-home-slides-slot";
import { HomeHeroMedia } from "@/components/home-hero-media";
import { HomeViewSlides, type ViewSlide } from "@/components/home-view-slides";
import { useLocale, useT } from "@/components/locale-provider";
import { t as tStatic } from "@/lib/i18n";
import {
  buildHomeHeroSlotStyle,
  normalizeHeroTextColorValue,
  type HomeHeroTextColor,
  type HomeHeroTextFont,
} from "@/lib/home-hero-text-style";
import type { HomeHeroTextScale, HomeIntroHeroCopy } from "@/lib/home-intro-slides-types";
import type { HomeCmsSlotKey } from "@/lib/home-cms-slots";
import { cn } from "@/lib/utils";

type Props = {
  videoSrc: string;
  audioSrc: string;
  posterSrc: string;
  viewPhotos: ViewSlide[];
  heroCopy: HomeIntroHeroCopy;
  heroTextScale?: HomeHeroTextScale;
  heroTextFont?: HomeHeroTextFont;
  heroTextColor?: HomeHeroTextColor;
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
  slotStyle,
}: {
  slotKey: HomeCmsSlotKey;
  cmsSlot?: Props["cmsSlot"];
  cmsEditMarkers?: boolean;
  className?: string;
  children: ReactNode;
  slotStyle?: ReturnType<typeof buildHomeHeroSlotStyle>;
}) {
  const colorized = Boolean(slotStyle?.color);
  if (cmsEditMarkers && !cmsSlot) {
    return (
      <span
        data-cms-key={slotKey}
        data-hero-custom-color={colorized ? "1" : undefined}
        className={cn(
          "cms-editable-slot box-decoration-clone block w-fit max-w-full rounded-sm",
          colorized && "hero-cms-slot-color",
          className,
        )}
        style={slotStyle}
      >
        {children}
      </span>
    );
  }
  if (!cmsSlot && !cmsEditMarkers) {
    if (!slotStyle) return <>{children}</>;
    const colorizedPublic = Boolean(slotStyle.color);
    return (
      <span
        className={cn(colorizedPublic && "hero-cms-slot-color", className)}
        style={slotStyle}
        data-hero-custom-color={colorizedPublic ? "1" : undefined}
      >
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
      data-hero-custom-color={colorized ? "1" : undefined}
      className={cn("cms-editable-slot", colorized && "hero-cms-slot-color", active && "cms-slot-active", className)}
      style={slotStyle}
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
  heroTextScale,
  heroTextFont,
  heroTextColor,
  cmsSlot,
  cmsEditMarkers = false,
}: Props) {
  const locale = useLocale();
  const scale = heroTextScale;
  const fonts = heroTextFont;
  const colors = heroTextColor;

  function koSlotStyle(field: keyof HomeHeroTextScale) {
    if (locale !== "ko") return undefined;
    return buildHomeHeroSlotStyle({
      scalePct: scale?.[field],
      font: fonts?.[field],
      color: colors?.[field],
    });
  }

  function koCustomColor(field: keyof HomeHeroTextColor) {
    return locale === "ko" && Boolean(normalizeHeroTextColorValue(colors?.[field]));
  }
  const t = useT();
  const useSlides = viewPhotos.length > 0;
  const kicker = locale === "ko" ? heroCopy.kicker : t("home.kicker");
  const hero1 = locale === "ko" ? heroCopy.heroLine1 : t("home.hero1");
  const hero2 = locale === "ko" ? heroCopy.heroLine2 : t("home.hero2");

  return (
    <section className="relative flex min-h-full w-full flex-1 flex-col bg-background">
      <div className="site-content-width relative mx-auto flex min-h-full w-full flex-1 flex-col">
        <div className="relative min-h-0 flex-1 overflow-hidden bg-primary text-primary-foreground">
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
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end px-[var(--site-content-pad-x)] pb-5 pt-0 sm:pb-7 md:pb-8">
            <div className="pointer-events-auto w-full min-w-0 text-center md:max-w-[min(100%,40rem)] md:text-left">
              <CmsPick
                slotKey="home.kicker"
                cmsSlot={cmsSlot}
                cmsEditMarkers={cmsEditMarkers}
                slotStyle={koSlotStyle("kicker")}
              >
                <p
                  className={cn(
                    "pointer-events-none text-sm tracking-wide",
                    cmsEditMarkers && "m-0",
                    !koCustomColor("kicker") && "text-primary-foreground/85",
                  )}
                  style={koSlotStyle("kicker")}
                >
                  {kicker}
                </p>
              </CmsPick>
              <h1
                className={cn(
                  "mt-2 font-serif leading-tight",
                  !koCustomColor("heroLine1") && !koCustomColor("heroLine2") && "text-primary-foreground",
                )}
              >
                <CmsPick
                  slotKey="home.heroLine1"
                  cmsSlot={cmsSlot}
                  cmsEditMarkers={cmsEditMarkers}
                  className="block"
                  slotStyle={koSlotStyle("heroLine1")}
                >
                  <span
                    className={cn(
                      "block break-keep text-[1.125rem] tracking-tight sm:text-xl md:text-[2.15rem] lg:text-[2.35rem] md:whitespace-nowrap",
                      cmsEditMarkers && "pointer-events-none",
                    )}
                    style={koSlotStyle("heroLine1")}
                  >
                    {hero1}
                  </span>
                </CmsPick>
                <CmsPick
                  slotKey="home.heroLine2"
                  cmsSlot={cmsSlot}
                  cmsEditMarkers={cmsEditMarkers}
                  className="mt-1 block"
                  slotStyle={koSlotStyle("heroLine2")}
                >
                  <span
                    className={cn(
                      "block break-keep text-2xl md:text-4xl lg:text-[2.75rem]",
                      cmsEditMarkers && "pointer-events-none",
                    )}
                    style={koSlotStyle("heroLine2")}
                  >
                    {hero2}
                  </span>
                </CmsPick>
              </h1>
              <CmsPick
                slotKey="home.lead"
                cmsSlot={cmsSlot}
                cmsEditMarkers={cmsEditMarkers}
                className="mt-3 block"
                slotStyle={koSlotStyle("lead")}
              >
                <p
                  className={cn(
                    "break-keep text-sm tracking-wide md:whitespace-nowrap",
                    cmsEditMarkers && "pointer-events-none m-0",
                    !koCustomColor("lead") && "text-primary-foreground/85",
                  )}
                  style={koSlotStyle("lead")}
                >
                  {locale === "ko" ? renderLeadKo(heroCopy.lead) : tStatic(locale, "home.lead")}
                </p>
              </CmsPick>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
