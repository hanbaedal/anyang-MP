"use client";

import { useEffect, useRef, type TouchEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { mediaUrl } from "@/lib/media";
import type { GalleryItem } from "@/lib/content";
import { cn } from "@/lib/utils";

const SWIPE_PX = 40;

/** 목록 탭용 — 크림 슬라이드 카드 스케일 모달 + 좌우(또는 상하) 스와이프·화살표 넘김 */
export function GallerySlideModal({
  open,
  onOpenChange,
  items,
  index,
  onIndexChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: GalleryItem[];
  index: number;
  onIndexChange: (index: number) => void;
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const current = items[index];

  function go(delta: number) {
    const next = index + delta;
    if (next < 0 || next >= items.length) return;
    onIndexChange(next);
  }

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
        <div className="relative aspect-[4/3] w-full touch-none overflow-hidden rounded-xl bg-muted select-none">
          <Image
            key={current.src}
            src={mediaUrl(current.src)}
            alt={current.alt}
            fill
            draggable={false}
            className="pointer-events-none object-cover"
            sizes="(max-width: 767px) min(100vw, 20rem), min(100vw, 36rem)"
            priority
          />
          {items.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="이전 사진"
                disabled={index <= 0}
                className="absolute left-1 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#fffcf7]/90 text-foreground shadow-sm disabled:opacity-30 md:h-10 md:w-10"
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
                className="absolute right-1 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#fffcf7]/90 text-foreground shadow-sm disabled:opacity-30 md:h-10 md:w-10"
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
