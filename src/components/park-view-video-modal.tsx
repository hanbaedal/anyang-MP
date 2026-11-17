"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SITE_MEDIA_MODAL_SHELL } from "@/lib/site-media-modal";
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
  audioSrc?: string;
  posterSrc?: string;
};

/** 「공원전경」— 홈페이지관리에서 공개한 메인 영상(있으면 함께 올린 음악). */
export function ParkViewVideoModal({ open, onOpenChange, videoSrc, audioSrc = "", posterSrc }: Props) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playSrc = withHeroCacheBust(videoSrc);
  const musicSrc = audioSrc.trim() ? withHeroCacheBust(audioSrc.trim()) : "";

  function startPlayback() {
    const video = videoRef.current;
    if (!video) return;
    const audio = audioRef.current;
    if (musicSrc && audio) {
      video.muted = true;
      try {
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
      void video.play().catch(() => undefined);
      void audio.play().catch(() => undefined);
      return;
    }
    video.muted = false;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  }

  useEffect(() => {
    if (!open) return;
    startPlayback();
  }, [open, playSrc, musicSrc]);

  useEffect(() => {
    if (open) return;
    const video = videoRef.current;
    const audio = audioRef.current;
    video?.pause();
    audio?.pause();
    try {
      if (video) video.currentTime = 0;
      if (audio) audio.currentTime = 0;
    } catch {
      /* ignore */
    }
  }, [open]);

  function close() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={SITE_MEDIA_MODAL_SHELL}
        aria-describedby={undefined}
        onPointerDownOutside={close}
      >
        <DialogTitle className="sr-only">{t("home.parkView")}</DialogTitle>
        <button
          type="button"
          onClick={close}
          className="absolute right-2 top-2 z-[60] inline-flex size-9 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/35 hover:bg-black/70 sm:right-3 sm:top-3 sm:size-10"
          aria-label={t("close")}
        >
          <X className="size-5" aria-hidden />
        </button>
        {open ? (
          <div className="relative aspect-video w-full max-h-[min(82vh,calc(var(--site-content-max)*0.72))] bg-black">
            <video
              ref={videoRef}
              key={playSrc}
              className="guest-photo-bright absolute inset-0 h-full w-full object-contain"
              src={playSrc}
              poster={posterSrc}
              autoPlay
              playsInline
              controls
              preload="auto"
              onLoadedData={startPlayback}
              onEnded={close}
            />
            {musicSrc ? <audio ref={audioRef} src={musicSrc} preload="auto" /> : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
