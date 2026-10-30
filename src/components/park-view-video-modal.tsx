"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/components/locale-provider";
import { uploadOriginalUrl } from "@/lib/media";
import type { ViewSlide } from "@/components/home-view-slides";

const HOME_HERO_UPLOAD_CACHE_BUST = "t1080br";
const SLIDE_MS = 7000;

function withHeroCacheBust(src: string) {
  const needsBust =
    src.includes("/uploads/home-hero/") ||
    src.includes("/api/uploads/home-hero/") ||
    src.includes("/static/home-hero-intro");
  if (!needsBust) return src;
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}v=${HOME_HERO_UPLOAD_CACHE_BUST}`;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoSrc: string;
  posterSrc?: string;
  photos?: ViewSlide[];
};

/** 「공원전경」— 갤러리 전경 슬라이드. 사진이 없으면 히어로 영상으로 폴백. */
export function ParkViewVideoModal({ open, onOpenChange, videoSrc, posterSrc, photos = [] }: Props) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playSrc = withHeroCacheBust(videoSrc);
  const useSlides = photos.length > 0;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setIndex(0);
      return;
    }
    if (!useSlides || photos.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [open, useSlides, photos.length]);

  useEffect(() => {
    if (!open || useSlides) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = false;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  }, [open, playSrc, useSlides]);

  useEffect(() => {
    if (open) return;
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      /* ignore */
    }
  }, [open]);

  function go(delta: number) {
    if (photos.length < 2) return;
    setIndex((prev) => (prev + delta + photos.length) % photos.length);
  }

  const current = photos[index];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 z-50 flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-black p-0 shadow-none sm:max-w-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
        aria-describedby={undefined}
        onPointerDownOutside={() => onOpenChange(false)}
      >
        <DialogTitle className="sr-only">{t("home.parkView")}</DialogTitle>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-[60] inline-flex size-10 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/35 hover:bg-black/70"
          aria-label={t("close")}
        >
          <X className="size-5" aria-hidden />
        </button>
        {open && useSlides && current ? (
          <div className="relative h-full w-full bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.src}
              src={uploadOriginalUrl(current.src)}
              alt={current.alt}
              className="h-full w-full object-contain bg-black"
            />
            {photos.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="이전 사진"
                  className="absolute left-3 top-1/2 z-[1] hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/35 hover:bg-black/70 md:flex"
                  onClick={() => go(-1)}
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="다음 사진"
                  className="absolute right-3 top-1/2 z-[1] hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/35 hover:bg-black/70 md:flex"
                  onClick={() => go(1)}
                >
                  <ChevronRight className="size-5" />
                </button>
                <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/85">
                  {current.alt ? `${current.alt} · ` : ""}
                  {index + 1} / {photos.length}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
        {open && !useSlides ? (
          <video
            ref={videoRef}
            key={playSrc}
            className="h-full w-full object-contain bg-black"
            src={playSrc}
            poster={posterSrc}
            playsInline
            controls
            preload="metadata"
            onEnded={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
