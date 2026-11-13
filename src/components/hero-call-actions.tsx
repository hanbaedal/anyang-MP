"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Phone, Trees } from "lucide-react";
import { ParkViewVideoModal } from "@/components/park-view-video-modal";
import { useT } from "@/components/locale-provider";
import { SITE } from "@/lib/site";

type Props = {
  videoSrc: string;
  audioSrc: string;
  posterSrc: string;
  onParkViewOpenChange?: (open: boolean) => void;
};

/** 홈 히어로 우측 하단: 문의전화(~2×) · 오시는 길 · 공원영상 */
export function HeroCallActions({ videoSrc, audioSrc, posterSrc, onParkViewOpenChange }: Props) {
  const t = useT();
  const [viewOpen, setViewOpen] = useState(false);

  function setOpen(open: boolean) {
    setViewOpen(open);
    onParkViewOpenChange?.(open);
  }

  return (
    <>
      <nav
        aria-label={t("home.call")}
        className="flex max-w-full flex-nowrap items-end justify-center gap-1.5 overflow-x-auto sm:gap-2 md:justify-end md:gap-2.5"
      >
        <a
          href={SITE.phoneTel}
          className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-secondary px-5 py-3.5 text-base font-semibold text-secondary-foreground shadow-md hover:bg-[#dce8e0] sm:gap-3 sm:px-6 sm:py-4 sm:text-lg md:gap-3.5 md:px-7 md:py-[1.125rem] md:text-xl"
        >
          <Phone className="size-5 sm:size-6 md:size-7" aria-hidden />
          <span className="whitespace-nowrap">{t("home.call")}</span>
          <span className="whitespace-nowrap tabular-nums">{SITE.phone}</span>
        </a>
        <Link
          href="/intro/directions"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/50 bg-white px-3 py-1.5 text-xs font-medium text-[color:var(--pastel-chrome-fg)] shadow-sm hover:bg-white/95 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm md:px-4 md:py-2.5"
        >
          <MapPin className="size-3.5 sm:size-4" aria-hidden />
          {t("directions")}
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/50 bg-white px-3 py-1.5 text-xs font-medium text-[color:var(--pastel-chrome-fg)] shadow-sm hover:bg-white/95 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm md:px-4 md:py-2.5"
        >
          <Trees className="size-3.5 sm:size-4" aria-hidden />
          {t("home.parkView")}
        </button>
      </nav>
      <ParkViewVideoModal
        open={viewOpen}
        onOpenChange={setOpen}
        videoSrc={videoSrc}
        audioSrc={audioSrc}
        posterSrc={posterSrc}
      />
    </>
  );
}
