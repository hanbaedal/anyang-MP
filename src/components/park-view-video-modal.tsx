"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useT } from "@/components/locale-provider";

const HOME_HERO_UPLOAD_CACHE_BUST = "t1080br";

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
};

/** 「공원전경」— 히어로와 같은 videoSrc 전체화면 모달. 종료 시 자동 닫기. */
export function ParkViewVideoModal({ open, onOpenChange, videoSrc, posterSrc }: Props) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playSrc = withHeroCacheBust(videoSrc);

  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = false;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  }, [open, playSrc]);

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
        {open ? (
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
