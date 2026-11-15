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
  /** hero: 흰 테두리(전경 위). footer: 사이트 크롬에 맞춤 */
  placement?: "hero" | "footer";
};

/** 문의전화 · 오시는 길 · 공원영상 (푸터 기본, 홈 히어로에서는 placement=hero) */
export function HeroCallActions({
  videoSrc,
  audioSrc,
  posterSrc,
  onParkViewOpenChange,
  placement = "footer",
}: Props) {
  const t = useT();
  const [viewOpen, setViewOpen] = useState(false);

  function setOpen(open: boolean) {
    setViewOpen(open);
    onParkViewOpenChange?.(open);
  }

  const chromeBtn =
    placement === "hero"
      ? "border border-white/50 bg-white hover:bg-white/95"
      : "border border-[#d4c4a8]/90 bg-white shadow-sm hover:bg-[#fffcf7]";

  const navClass =
    placement === "hero"
      ? "flex max-w-full flex-nowrap items-end justify-center gap-1.5 overflow-x-auto sm:gap-2 md:justify-end md:gap-2.5"
      : "flex max-w-full flex-nowrap items-center justify-center gap-1.5 overflow-x-auto py-0.5 sm:gap-2 md:justify-end md:gap-2.5";

  return (
    <>
      <nav aria-label={t("home.call")} className={navClass}>
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
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[color:var(--pastel-chrome-fg)] sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm md:px-4 md:py-2.5 ${chromeBtn}`}
        >
          <MapPin className="size-3.5 sm:size-4" aria-hidden />
          {t("directions")}
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[color:var(--pastel-chrome-fg)] sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm md:px-4 md:py-2.5 ${chromeBtn}`}
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
