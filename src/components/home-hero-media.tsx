"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Photo } from "@/components/page-hero";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const SOUND_SESSION_KEY = "anyang-home-hero-bgm";

type Props = {
  videoSrc: string;
  audioSrc: string;
  posterSrc: string;
};

export function HomeHeroMedia({ videoSrc, audioSrc, posterSrc }: Props) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  /** 별도 음악 파일이 있으면 BGM 트랙, 없으면 영상에 들어 있는 소리 사용 */
  const hasSeparateBgm = Boolean(audioSrc);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(true);

  const startVideoMuted = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    try {
      await video.play();
      setVideoReady(true);
      setVideoError(false);
    } catch {
      setVideoError(true);
    }
  }, []);

  const enableSound = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.paused) {
        video.muted = true;
        await video.play();
      }
      if (hasSeparateBgm) {
        const audio = audioRef.current;
        if (!audio) return;
        video.muted = true;
        await audio.play();
      } else {
        video.muted = false;
        await video.play();
      }
      setSoundOn(true);
      setShowSoundPrompt(false);
      sessionStorage.setItem(SOUND_SESSION_KEY, "1");
    } catch {
      setShowSoundPrompt(true);
      setSoundOn(false);
    }
  }, [hasSeparateBgm]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    setVideoReady(false);
    setVideoError(false);
    setSoundOn(false);
    setShowSoundPrompt(true);
    void startVideoMuted();
  }, [reduceMotion, videoSrc, audioSrc, startVideoMuted]);

  useEffect(() => {
    if (reduceMotion || sessionStorage.getItem(SOUND_SESSION_KEY) !== "1") return;
    setShowSoundPrompt(false);
    void enableSound();
  }, [reduceMotion, videoSrc, audioSrc, enableSound]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hasSeparateBgm) {
      video.muted = true;
      const audio = audioRef.current;
      if (!audio) return;
      if (soundOn) void audio.play().catch(() => setSoundOn(false));
      else audio.pause();
      return;
    }

    // 별도 음악 없음 → 영상 트랙 소리 on/off
    video.muted = !soundOn;
    if (soundOn && video.paused) void video.play().catch(() => setSoundOn(false));
  }, [hasSeparateBgm, soundOn, audioSrc, videoSrc]);

  useEffect(() => {
    return () => {
      videoRef.current?.pause();
      audioRef.current?.pause();
    };
  }, []);

  if (reduceMotion) {
    return (
      <Photo
        src={posterSrc}
        alt={t("site.legalName")}
        className="absolute inset-0 h-full w-full rounded-none"
        sizes="100vw"
        priority
      />
    );
  }

  return (
    <>
      {videoError ? (
        <Photo
          src={posterSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full rounded-none"
          sizes="100vw"
          priority
        />
      ) : null}
      <video
        key={videoSrc}
        ref={videoRef}
        className={cn(
          "absolute inset-0 h-full w-full object-cover object-[center_32%]",
          videoReady || videoError ? "opacity-100" : "opacity-0",
        )}
        src={videoSrc}
        poster={posterSrc}
        muted={hasSeparateBgm || !soundOn}
        autoPlay
        playsInline
        loop
        preload="auto"
        onLoadedData={() => setVideoReady(true)}
        onError={() => setVideoError(true)}
      />
      {hasSeparateBgm ? <audio key={audioSrc} ref={audioRef} src={audioSrc} loop preload="metadata" /> : null}
      {showSoundPrompt && videoReady && !videoError ? (
        <div className="pointer-events-none absolute inset-x-0 top-[42%] z-[20] flex -translate-y-1/2 justify-center px-4">
          <button
            type="button"
            onClick={() => void enableSound()}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm text-white ring-1 ring-white/30 backdrop-blur-sm hover:bg-black/60"
            aria-label={t("home.bgmPlay")}
          >
            <Volume2 className="size-4" aria-hidden />
            {t("home.bgmPlay")}
          </button>
        </div>
      ) : null}
      {soundOn ? (
        <button
          type="button"
          onClick={() => setSoundOn(false)}
          className="absolute right-3 top-3 z-[20] inline-flex size-10 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-black/55 sm:right-4 sm:top-4"
          aria-label={t("home.bgmOff")}
          title={t("home.bgmOff")}
        >
          <Volume2 className="size-5" aria-hidden />
        </button>
      ) : null}
      {!soundOn && !showSoundPrompt && videoReady ? (
        <button
          type="button"
          onClick={() => void enableSound()}
          className="absolute right-3 top-3 z-[20] inline-flex size-10 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-black/55 sm:right-4 sm:top-4"
          aria-label={t("home.bgmOn")}
          title={t("home.bgmOn")}
        >
          <VolumeX className="size-5" aria-hidden />
        </button>
      ) : null}
    </>
  );
}
