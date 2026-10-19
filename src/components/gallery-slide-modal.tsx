"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { isUploadMediaPath, thumbUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

const SWIPE_PX = 40;

export type SlideModalItem = { src: string; alt: string };

function preloadThumb(src: string) {
  const img = new window.Image();
  img.src = thumbUrl(src);
}

/** 크림 슬라이드 카드 스케일 모달 + 좌우(또는 상하) 스와이프·화살표 넘김 */
export function GallerySlideModal({
  open,
  onOpenChange,
  items,
  index,
  onIndexChange,
  imageFit = "cover",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SlideModalItem[];
  index: number;
  onIndexChange: (index: number) => void;
  /** 분양 그리드는 contain(잘림 없음), 갤러리는 기본 cover */
  imageFit?: "cover" | "contain";
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const current = items[index];
  const thumb = current ? thumbUrl(current.src) : "";

  function go(delta: number) {
    const next = index + delta;
    if (next < 0 || next >= items.length) return;
    onIndexChange(next);
  }

  useEffect(() => {
    setLoaded(false);
  }, [current?.src]);

  // Prefetch neighbors so swipe isn't a gray flash
  useEffect(() => {
    if (!open || !items.length) return;
    for (const i of [index - 1, index + 1, index + 2]) {
      if (i >= 0 && i < items.length) preloadThumb(items[i].src);
    }
  }, [open, index, items]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (index > 0) onIndexChange(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (index < items.length - 1) onIndexChange(index + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, items.length, onIndexChange]);

  function onTouchStart(e: TouchEvent) {
    e.stopPropagation();
    const t = e.changedTouches[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: TouchEvent) {
    e.stopPropagation();
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const dist = horizontal ? dx : dy;
    if (Math.abs(dist) < SWIPE_PX) return;
    go(dist < 0 ? 1 : -1);
  }

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          // 모바일: 마퀴 카드와 동일(≤20rem). PC: 크림 슬라이드 1.5×(~2칸)에 맞춤
          "fixed top-[50%] left-[50%] z-50 w-[min(100vw-1.5rem,20rem)] max-w-[min(100vw-1.5rem,20rem)]",
          "md:w-[min(100vw-4rem,36rem)] md:max-w-[min(100vw-4rem,36rem)]",
          "translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden rounded-2xl border border-[#ead7b4] bg-[#f8eedd] p-3 shadow-lg",
          "duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "[&_[data-slot=dialog-close]]:right-2 [&_[data-slot=dialog-close]]:top-2 [&_[data-slot=dialog-close]]:z-10",
          "[&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-[#fffcf7]/90 [&_[data-slot=dialog-close]]:p-1.5",
          "[&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:shadow-sm",
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <DialogTitle className="sr-only">{current.alt}</DialogTitle>
        <div
          className={cn(
            "relative aspect-[4/3] w-full touch-none overflow-hidden rounded-xl select-none",
            imageFit === "contain" ? "bg-[#f3e6cf]" : "bg-[#ead7b4]/50",
          )}
        >
          {!loaded ? (
            <div
              className="absolute inset-0 animate-pulse bg-[#ead7b4]/40"
              aria-hidden
            />
          ) : null}
          <Image
            key={current.src}
            src={thumb}
            alt={current.alt}
            fill
            draggable={false}
            className={cn(
              "pointer-events-none object-center transition-opacity duration-200",
              imageFit === "contain" ? "object-contain" : "object-cover",
              loaded ? "opacity-100" : "opacity-0",
            )}
            sizes="(max-width: 767px) 320px, 576px"
            priority
            unoptimized={isUploadMediaPath(thumb)}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
          {items.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="이전 사진"
                disabled={index <= 0}
                className="absolute left-1 top-1/2 z-[1] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#fffcf7]/90 text-foreground shadow-sm disabled:opacity-30 md:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="다음 사진"
                disabled={index >= items.length - 1}
                className="absolute right-1 top-1/2 z-[1] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#fffcf7]/90 text-foreground shadow-sm disabled:opacity-30 md:flex"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>
        {current.alt ? (
          <p className="mt-2 truncate px-1 text-center text-sm text-foreground/80">{current.alt}</p>
        ) : null}
        {items.length > 1 ? (
          <p className="mt-0.5 text-center text-xs text-muted-foreground" aria-live="polite">
            {index + 1} / {items.length}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
