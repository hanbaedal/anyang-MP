"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type ViewSlide = { src: string; alt: string };

const INTERVAL_MS = 7000;

const navBtn =
  "pointer-events-auto absolute top-1/2 z-[6] flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md ring-1 ring-white/35 backdrop-blur-sm hover:bg-black/60 sm:size-12";

/**
 * 갤러리 「전경」 사진을 홈 배경으로 좌우 슬라이드.
 * 자동(약 7초)과 이전·다음 버튼을 함께 쓴다.
 */
export function HomeViewSlides({ photos, paused = false }: { photos: ViewSlide[]; paused?: boolean }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [resumeKey, setResumeKey] = useState(0);

  const go = useCallback(
    (delta: number) => {
      if (photos.length < 2) return;
      setIndex((prev) => (prev + delta + photos.length) % photos.length);
      setResumeKey((n) => n + 1);
    },
    [photos.length],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused || photos.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion, paused, photos.length, resumeKey]);

  useEffect(() => {
    if (!photos.length) return;
    for (const i of [index + 1, index - 1]) {
      const photo = photos[(i + photos.length) % photos.length];
      if (!photo) continue;
      const img = new window.Image();
      img.src = uploadOriginalUrl(photo.src);
    }
  }, [index, photos]);

  useEffect(() => {
    if (paused || photos.length < 2) return;
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
  }, [paused, photos.length, go]);

  if (!photos.length) return null;

  const showIndex = reduceMotion ? 0 : index;
  const showNav = photos.length > 1 && !paused;

  return (
    <div className="absolute inset-0 z-[5]">
      <div className="absolute inset-0 overflow-hidden bg-primary" aria-hidden>
        <div
          className="flex h-full transition-transform duration-700 ease-out motion-reduce:transition-none"
          style={{
            width: `${photos.length * 100}%`,
            transform: `translateX(-${(showIndex * 100) / photos.length}%)`,
          }}
        >
          {photos.map((photo, i) => {
            const near =
              i === showIndex ||
              i === (showIndex + 1) % photos.length ||
              i === (showIndex - 1 + photos.length) % photos.length;
            return (
              <div key={`${photo.src}-${i}`} className="relative h-full shrink-0" style={{ width: `${100 / photos.length}%` }}>
                {near ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={uploadOriginalUrl(photo.src)}
                    alt=""
                    className={cn("h-full w-full object-cover object-[center_32%]")}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ) : null}
              </div>
            );
          })}
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
