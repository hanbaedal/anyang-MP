"use client";

import { useEffect, useState } from "react";
import { thumbUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type ViewSlide = { src: string; alt: string };

const INTERVAL_MS = 7000;

/**
 * 인트로 「전경」태그 사진 좌우 슬라이드.
 * 배경 음소거 영상 위에 옅게 올려 공존. 비어 있으면 렌더하지 않음(영상만).
 * 모바일은 썸네일만·인접 1장만 예열해 이중 대용량 로드를 피함.
 */
export function HomeViewSlides({ photos, paused = false }: { photos: ViewSlide[]; paused?: boolean }) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // 첫 페인트 이후·유휴 시점에만 슬라이드 레이어 가동 (모바일 대역폭)
  useEffect(() => {
    if (!photos.length) return;
    let cancelled = false;
    const arm = () => {
      if (!cancelled) setArmed(true);
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(arm, { timeout: 1800 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const timer = window.setTimeout(arm, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [photos.length]);

  useEffect(() => {
    if (!armed || reduceMotion || paused || photos.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [armed, reduceMotion, paused, photos.length]);

  // 인접 썸네일만 예열
  useEffect(() => {
    if (!armed || !photos.length) return;
    for (const i of [index, index + 1]) {
      const photo = photos[i % photos.length];
      if (!photo) continue;
      const img = new window.Image();
      img.src = thumbUrl(photo.src);
    }
  }, [armed, index, photos]);

  if (!photos.length || !armed) return null;

  const showIndex = reduceMotion ? 0 : index;

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out"
        style={{
          width: `${photos.length * 100}%`,
          transform: `translateX(-${(showIndex * 100) / photos.length}%)`,
        }}
      >
        {photos.map((photo, i) => {
          const active = i === showIndex;
          const near = Math.abs(i - showIndex) <= 1 || (showIndex === 0 && i === photos.length - 1);
          return (
            <div key={`${photo.src}-${i}`} className="relative h-full shrink-0" style={{ width: `${100 / photos.length}%` }}>
              {near ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbUrl(photo.src)}
                  alt=""
                  className={cn(
                    "h-full w-full object-cover object-[center_32%] opacity-[0.28] md:opacity-[0.34]",
                    active ? "opacity-[0.28] md:opacity-[0.34]" : "opacity-20",
                  )}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
