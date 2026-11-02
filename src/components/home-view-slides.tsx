"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export type ViewSlide = { src: string; alt: string };

const INTERVAL_MS = 3000;
const TRANSITION_MS = 700;

const navBtn =
  "pointer-events-auto absolute top-1/2 z-[6] flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md ring-1 ring-white/35 backdrop-blur-sm hover:bg-black/60 sm:size-12";

/**
 * 홈 인트로 정적 전경 슬라이드 — 3초마다 왼쪽 전환.
 * 끝↔처음은 클론 트랙으로 끊김 없이 루프.
 * 호버·reduced-motion·모달 pause 시 정지.
 */
export function HomeViewSlides({ photos, paused = false }: { photos: ViewSlide[]; paused?: boolean }) {
  const t = useT();
  const n = photos.length;
  // track: [clone last, ...photos, clone first] → real slides at positions 1..n
  const [pos, setPos] = useState(1);
  const [animating, setAnimating] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [resumeKey, setResumeKey] = useState(0);
  const jumping = useRef(false);

  const go = useCallback(
    (delta: number) => {
      if (n < 2 || jumping.current) return;
      setAnimating(true);
      setPos((prev) => prev + delta);
      setResumeKey((k) => k + 1);
    },
    [n],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const autoPaused = reduceMotion || paused || hoverPaused;

  useEffect(() => {
    if (autoPaused || n < 2) return;
    const timer = window.setInterval(() => {
      if (jumping.current) return;
      setAnimating(true);
      setPos((prev) => prev + 1);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoPaused, n, resumeKey]);

  useEffect(() => {
    if (paused || n < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, n, go]);

  function onTransitionEnd() {
    if (n < 2) return;
    if (pos === n + 1) {
      // landed on clone of first after last → snap to real first
      jumping.current = true;
      setAnimating(false);
      setPos(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          jumping.current = false;
        });
      });
    } else if (pos === 0) {
      // landed on clone of last before first → snap to real last
      jumping.current = true;
      setAnimating(false);
      setPos(n);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          jumping.current = false;
        });
      });
    }
  }

  if (!n) return null;

  const trackCount = n < 2 ? n : n + 2;
  const track = n < 2 ? photos : [photos[n - 1], ...photos, photos[0]];
  const showPos = n < 2 ? 0 : reduceMotion ? 1 : pos;
  const showNav = n > 1 && !paused;

  return (
    <div
      className="absolute inset-0 z-[5]"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
    >
      <div className="absolute inset-0 overflow-hidden bg-primary" aria-hidden>
        <div
          className={cn(
            "flex h-full ease-out motion-reduce:transition-none",
            animating && !reduceMotion && "transition-transform",
          )}
          style={{
            width: `${trackCount * 100}%`,
            transform: `translateX(-${(showPos * 100) / trackCount}%)`,
            transitionDuration: animating && !reduceMotion ? `${TRANSITION_MS}ms` : "0ms",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {track.map((photo, i) => (
            <div key={`${photo.src}-t${i}`} className="relative h-full shrink-0" style={{ width: `${100 / trackCount}%` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt=""
                className={cn("h-full w-full object-cover object-[center_32%]")}
                loading="eager"
                fetchPriority={i <= 1 ? "high" : "low"}
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      {showNav ? (
        <>
          <button
            type="button"
            className={cn(navBtn, "left-2 sm:left-4")}
            aria-label={t("home.slidePrev")}
            onClick={() => go(-1)}
          >
            <ChevronLeft className="size-6 sm:size-7" aria-hidden />
          </button>
          <button
            type="button"
            className={cn(navBtn, "right-2 sm:right-4")}
            aria-label={t("home.slideNext")}
            onClick={() => go(1)}
          >
            <ChevronRight className="size-6 sm:size-7" aria-hidden />
          </button>
        </>
      ) : null}
    </div>
  );
}
