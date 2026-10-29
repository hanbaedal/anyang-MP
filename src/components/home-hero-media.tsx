"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Photo } from "@/components/page-hero";
import { useLocale, useT } from "@/components/locale-provider";
import { homeHeroNarrationSrc } from "@/lib/home-hero-narration";
import { cn } from "@/lib/utils";

const SOUND_SESSION_KEY = "anyang-home-hero-bgm";
/** 업로드 히어로 교체 후 모바일 immutable 캐시 무효화용 (값만 올리면 됨) */
const HOME_HERO_UPLOAD_CACHE_BUST = "t1080br";
const NARRATION_CACHE_BUST = "n1";

function withHeroCacheBust(src: string) {
  const needsBust =
    src.includes("/uploads/home-hero/") ||
    src.includes("/api/uploads/home-hero/") ||
    src.includes("/static/home-hero-intro");
  if (!needsBust) return src;
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}v=${HOME_HERO_UPLOAD_CACHE_BUST}`;
}

function withNarrationBust(src: string) {
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}v=${NARRATION_CACHE_BUST}`;
}

type Props = {
  videoSrc: string;
  audioSrc: string;
  posterSrc: string;
  /** 공원전경 모달 등 — 배경 재생 일시정지(음소거는 유지) */
  paused?: boolean;
};

export function HomeHeroMedia({ videoSrc, audioSrc, posterSrc, paused = false }: Props) {
  const playSrc = withHeroCacheBust(videoSrc);
  const locale = useLocale();
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(true);
  /** 외부 트랙 로드 실패 시 KO는 영상 내장 오디오로 폴백 */
  const [externalFailed, setExternalFailed] = useState(false);

  const isStaticIntro = playSrc.includes("/static/home-hero-intro");
  const adminTrack = audioSrc.trim();
  const localeTrack = isStaticIntro && !adminTrack ? homeHeroNarrationSrc(locale) : "";
  const externalSrc = adminTrack
    ? withHeroCacheBust(adminTrack)
    : localeTrack && !externalFailed
      ? withNarrationBust(localeTrack)
      : "";
  const useExternal = Boolean(externalSrc);

  const syncAudioToVideo = useCallback(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !useExternal) return;
    if (Math.abs(audio.currentTime - video.currentTime) > 0.35) {
      try {
        audio.currentTime = video.currentTime;
      } catch {
        /* ignore seek until metadata ready */
      }
    }
  }, [useExternal]);

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
      if (useExternal) {
        const audio = audioRef.current;
        if (!audio) return;
        video.muted = true;
        syncAudioToVideo();
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
  }, [useExternal, syncAudioToVideo]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setExternalFailed(false);
  }, [locale, localeTrack, adminTrack]);

  useEffect(() => {
    if (reduceMotion) return;
    setVideoReady(false);
    setVideoError(false);
    setSoundOn(false);
    setShowSoundPrompt(true);
    void startVideoMuted();
  }, [reduceMotion, playSrc, externalSrc, startVideoMuted]);

  useEffect(() => {
    if (reduceMotion || sessionStorage.getItem(SOUND_SESSION_KEY) !== "1") return;
    setShowSoundPrompt(false);
    void enableSound();
  }, [reduceMotion, playSrc, externalSrc, enableSound]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (useExternal) {
      video.muted = true;
      const audio = audioRef.current;
      if (!audio) return;
      if (soundOn) {
        syncAudioToVideo();
        void audio.play().catch(() => setSoundOn(false));
      } else {
        audio.pause();
      }
      return;
    }

    video.muted = !soundOn;
    if (soundOn && video.paused) void video.play().catch(() => setSoundOn(false));
  }, [useExternal, soundOn, externalSrc, playSrc, syncAudioToVideo]);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !useExternal || !audio) return;

    const onPlay = () => {
      if (!soundOn) return;
      syncAudioToVideo();
      void audio.play().catch(() => setSoundOn(false));
    };
    const onPause = () => audio.pause();
    const onSeeking = () => syncAudioToVideo();
    const onTimeUpdate = () => {
      if (soundOn) syncAudioToVideo();
    };
    const onEnded = () => {
      /* video loops via attribute; keep audio aligned on next play */
      syncAudioToVideo();
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [useExternal, soundOn, externalSrc, syncAudioToVideo]);

  useEffect(() => {
    return () => {
      videoRef.current?.pause();
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
      audio?.pause();
      return;
    }
    if (reduceMotion) return;
    video.muted = true;
    void video.play().catch(() => undefined);
    if (soundOn && useExternal && audio) {
      syncAudioToVideo();
      void audio.play().catch(() => setSoundOn(false));
    } else if (soundOn && !useExternal) {
      video.muted = false;
    }
  }, [paused, reduceMotion, soundOn, useExternal, syncAudioToVideo]);

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
      {/* 포스터 먼저: 영상 준비 전·오류 시에도 즉시 보임 */}
      <Photo
        src={posterSrc}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full rounded-none"
        sizes="100vw"
        priority
      />
      {!videoError ? (
        <video
          key={playSrc}
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-[center_32%] transition-opacity duration-500",
            videoReady ? "opacity-100" : "opacity-0",
          )}
          src={playSrc}
          poster={posterSrc}
          muted={useExternal || !soundOn}
          autoPlay
          playsInline
          loop
          preload="metadata"
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoError(true)}
        />
      ) : null}
      {useExternal ? (
        <audio
          key={externalSrc}
          ref={audioRef}
          src={externalSrc}
          loop
          preload="metadata"
          onError={() => {
            // KO 추출본 실패 시에만 영상 트랙으로 폴백
            if (!adminTrack && locale === "ko") setExternalFailed(true);
          }}
        />
      ) : null}
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
