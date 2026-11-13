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
};

/** 푸터 중앙 CTA: 문의전화(~2×) · 오시는 길 · 공원영상 */
export function FooterCallActions({ videoSrc, audioSrc, posterSrc }: Props) {
  const t = useT();
  const [viewOpen, setViewOpen] = useState(false);

  return (
    <>
      <nav
        aria-label={t("home.call")}
        className="flex max-w-full flex-nowrap items-center justify-center gap-1.5 overflow-x-auto sm:gap-2.5 md:gap-3"
      >
        <a
          href={SITE.phoneTel}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-[#dce8e0] sm:gap-2.5 sm:px-5 sm:py-3 sm:text-base md:gap-3 md:px-6 md:py-3.5 md:text-lg"
        >
          <Phone className="size-4 sm:size-5 md:size-6" aria-hidden />
          <span className="whitespace-nowrap">{t("home.call")}</span>
          <span className="whitespace-nowrap tabular-nums">{SITE.phone}</span>
        </a>
        <Link
          href="/intro/directions"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-[color:var(--pastel-chrome-border)] bg-white/85 px-3 py-2 text-xs font-medium text-[color:var(--pastel-chrome-fg)] hover:bg-white sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm md:px-5 md:py-3 md:text-base"
        >
          <MapPin className="size-3.5 sm:size-4 md:size-5" aria-hidden />
          {t("directions")}
        </Link>
        <button
          type="button"
          onClick={() => setViewOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-[color:var(--pastel-chrome-border)] bg-white/85 px-3 py-2 text-xs font-medium text-[color:var(--pastel-chrome-fg)] hover:bg-white sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm md:px-5 md:py-3 md:text-base"
        >
          <Trees className="size-3.5 sm:size-4 md:size-5" aria-hidden />
          {t("home.parkView")}
        </button>
      </nav>
      <ParkViewVideoModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        videoSrc={videoSrc}
        audioSrc={audioSrc}
        posterSrc={posterSrc}
      />
    </>
  );
}
