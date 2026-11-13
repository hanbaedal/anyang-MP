"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ViewSlide = { src: string; alt: string };

const INTERVAL_MS = 3000;
const TRANSITION_MS = 700;

/** 클론 포함 허용 구간 [0, n+1] → 실장 1…n */
function clampTrackPos(pos: number, n: number) {
  if (n < 2) return 0;
  if (pos < 0) return 0;
  if (pos > n + 1) return n + 1;
  return pos;
}

function clampRealPos(pos: number, n: number) {
  if (n < 2) return 0;
  if (pos <= 0) return n;
  if (pos >= n + 1) return 1;
  return pos;
}

/**
 * 홈 인트로 정적 전경 슬라이드 — 3초마다 왼쪽 전환.
 * 끝↔처음은 클론 트랙으로 끊김 없이 루프.
 * AMP-91: 탭 복귀 스냅·재도장. AMP-94: 화살표 제거 · pos 가드로 남색 공백 방지.
 */
export function HomeViewSlides({ photos, paused = false }: { photos: ViewSlide[]; paused?: boolean }) {
  const n = photos.length;
  // track: [clone last, ...photos, clone first] → real slides at positions 1..n
  const [pos, setPos] = useState(1);
  const [animating, setAnimating] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [resumeKey, setResumeKey] = useState(0);
  /** 복귀 시 img 리마운트 — GPU/디코드 공백(남색) 복구 */
  const [paintKey, setPaintKey] = useState(0);
  const jumping = useRef(false);
  /** 전환 중 추가 +1 금지 — 클론 밖으로 나가지 않게 */
  const advanceLocked = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const autoPaused = reduceMotion || paused;

  useEffect(() => {
    if (autoPaused || n < 2) return;
    if (typeof document !== "undefined" && document.hidden) return;
    const timer = window.setInterval(() => {
      if (jumping.current || advanceLocked.current || document.hidden) return;
      advanceLocked.current = true;
      setAnimating(true);
      setPos((prev) => clampTrackPos(prev + 1, n));
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [autoPaused, n, resumeKey]);

  /** AMP-94: 트랙 밖 pos면 즉시 실장 스냅 (남색 공백 방지) */
  useEffect(() => {
    if (n < 2) return;
    if (pos >= 0 && pos <= n + 1) return;
    jumping.current = false;
    advanceLocked.current = false;
    setAnimating(false);
    setPos(clampRealPos(pos, n));
  }, [pos, n]);

  /** AMP-91: 숨김 시 즉시 스냅 · 복귀 시 스냅 + 타이머·이미지 재도장 */
  useEffect(() => {
    if (n < 2) return;

    function onHidden() {
      jumping.current = false;
      advanceLocked.current = false;
      setAnimating(false);
      setPos((prev) => clampRealPos(prev, n));
    }

    function onVisible() {
      jumping.current = false;
      advanceLocked.current = false;
      setAnimating(false);
      setPos((prev) => clampRealPos(prev, n));
      setPaintKey((k) => k + 1);
      setResumeKey((k) => k + 1);
    }

    function onVisibility() {
      if (document.visibilityState === "hidden" || document.hidden) onHidden();
      else onVisible();
    }

    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted || document.visibilityState === "visible") onVisible();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [n]);

  function onTransitionEnd() {
    if (n < 2) return;
    if (pos >= n + 1) {
      jumping.current = true;
      setAnimating(false);
      setPos(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          jumping.current = false;
          advanceLocked.current = false;
        });
      });
      return;
    }
    if (pos <= 0) {
      jumping.current = true;
      setAnimating(false);
      setPos(n);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          jumping.current = false;
          advanceLocked.current = false;
        });
      });
      return;
    }
    advanceLocked.current = false;
  }

  if (!n) return null;

  const trackCount = n < 2 ? n : n + 2;
  const track = n < 2 ? photos : [photos[n - 1], ...photos, photos[0]];
  const rawPos = n < 2 ? 0 : reduceMotion ? 1 : pos;
  const showPos = n < 2 ? 0 : clampTrackPos(rawPos, n);

  return (
    <div className="absolute inset-0 z-[5]">
      <div className="absolute inset-0 overflow-hidden bg-primary" aria-hidden>
        <div
          key={`track-${paintKey}`}
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
            <div
              key={`${photo.src}-t${i}-p${paintKey}`}
              className="relative h-full shrink-0"
              style={{ width: `${100 / trackCount}%` }}
            >
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
      {/* AMP-92: +20% — from/75→/55, via/20→/12 (의견서) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/12 to-transparent" />
    </div>
  );
}
