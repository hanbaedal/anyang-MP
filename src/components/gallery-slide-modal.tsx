"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

const SWIPE_PX = 40;

export type SlideModalItem = { src: string; alt: string };

function preloadOriginal(src: string) {
  const img = new window.Image();
  img.src = uploadOriginalUrl(src);
}

/** 크림 슬라이드 카드 스케일 모달 + 좌우(또는 상하) 스와이프·화살표 넘김 */
export function GallerySlideModal({
  open,
  onOpenChange,
  items,
  index,
  onIndexChange,
  imageFit = "cover",
  fullPage = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SlideModalItem[];
  index: number;
  onIndexChange: (index: number) => void;
  /** 분양 그리드는 contain(잘림 없음), 갤러리는 기본 cover */
  imageFit?: "cover" | "contain";
  /** 갤러리: 모니터에 비례한 거의 풀페이지 */
  fullPage?: boolean;
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [uri, setUri] = useState("");
  const current = items[index];

  function go(delta: number) {
    const next = index + delta;
    if (next < 0 || next >= items.length) return;
    onIndexChange(next);
  }

  useEffect(() => {
    if (!current) return;
    setUri(uploadOriginalUrl(current.src));
  }, [current?.src]);

  // Prefetch neighbors so swipe isn't a gray flash
  useEffect(() => {
    if (!open || !items.length) return;
    for (const i of [index - 1, index + 1, index + 2]) {
      if (i >= 0 && i < items.length) preloadOriginal(items[i].src);
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

  const fit = fullPage ? "contain" : imageFit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "[&_[data-slot=dialog-close]]:z-10 [&_[data-slot=dialog-close]]:opacity-100",
          fullPage
            ? cn(
                "fixed inset-0 z-50 !top-0 !left-0 flex h-[100dvh] w-screen max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden border-0 bg-black/92 p-0 shadow-none sm:max-w-none",
                "[&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:top-3",
                "[&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-white/15 [&_[data-slot=dialog-close]]:p-1.5",
                "[&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-white/25",
              )
            : cn(
                "fixed top-[50%] left-[50%] z-50 w-[min(100vw-1.5rem,20rem)] max-w-[min(100vw-1.5rem,20rem)]",
                "md:w-[min(100vw-4rem,36rem)] md:max-w-[min(100vw-4rem,36rem)]",
                "translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden rounded-2xl border border-[#ead7b4] bg-[#f8eedd] p-3 shadow-lg",
                "[&_[data-slot=dialog-close]]:right-2 [&_[data-slot=dialog-close]]:top-2",
                "[&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-[#fffcf7]/90 [&_[data-slot=dialog-close]]:p-1.5",
                "[&_[data-slot=dialog-close]]:shadow-sm",
              ),
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <DialogTitle className="sr-only">{current.alt}</DialogTitle>
        <div
          className={cn(
            "relative w-full touch-none overflow-hidden select-none",
            fullPage
              ? "min-h-0 flex-1"
              : cn("aspect-[4/3] rounded-xl", imageFit === "contain" ? "bg-[#f3e6cf]" : "bg-[#ead7b4]/50"),
          )}
        >
          {/* Native img: avoid Next/Image opacity-0 + missed onLoad on cache hits */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.src}
            src={uri || uploadOriginalUrl(current.src)}
            alt={current.alt}
            draggable={false}
            className={cn(
              "pointer-events-none absolute inset-0 h-full w-full object-center",
              fullPage ? "object-contain p-2 sm:p-4" : fit === "contain" ? "object-contain" : "object-cover",
            )}
          />
          {items.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="이전 사진"
                disabled={index <= 0}
                className={cn(
                  "absolute left-2 top-1/2 z-[1] flex size-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md disabled:opacity-30 sm:left-3 sm:size-12",
                  fullPage
                    ? "bg-black/45 text-white ring-1 ring-white/35 hover:bg-black/60"
                    : "hidden bg-[#fffcf7]/90 text-foreground md:flex",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
              >
                <ChevronLeft className="size-6 sm:size-7" />
              </button>
              <button
                type="button"
                aria-label="다음 사진"
                disabled={index >= items.length - 1}
                className={cn(
                  "absolute right-2 top-1/2 z-[1] flex size-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md disabled:opacity-30 sm:right-3 sm:size-12",
                  fullPage
                    ? "bg-black/45 text-white ring-1 ring-white/35 hover:bg-black/60"
                    : "hidden bg-[#fffcf7]/90 text-foreground md:flex",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
              >
                <ChevronRight className="size-6 sm:size-7" />
              </button>
            </>
          ) : null}
        </div>
        {current.alt ? (
          <p
            className={cn(
              "truncate px-12 text-center text-sm",
              fullPage ? "pointer-events-none absolute inset-x-0 bottom-10 z-[1] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]" : "mt-2 px-1 text-foreground/80",
            )}
          >
            {current.alt}
          </p>
        ) : null}
        {items.length > 1 ? (
          <p
            className={cn(
              "text-center text-xs",
              fullPage ? "pointer-events-none absolute inset-x-0 bottom-4 z-[1] text-white/70" : "mt-0.5 text-muted-foreground",
            )}
            aria-live="polite"
          >
            {index + 1} / {items.length}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
