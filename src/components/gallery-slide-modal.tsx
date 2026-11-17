"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SITE_MEDIA_MODAL_SHELL, SITE_MEDIA_MODAL_VIEWPORT } from "@/lib/site-media-modal";
import { uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

const SWIPE_PX = 40;

export type SlideModalItem = { src: string; alt: string };

function preloadOriginal(src: string) {
  const img = new window.Image();
  img.src = uploadOriginalUrl(src);
}

/** 슬라이드 카드 확대 — 1136px 공통, 스와이프·화살표 */
export function GallerySlideModal({
  open,
  onOpenChange,
  items,
  index,
  onIndexChange,
  imageFit = "cover",
  fullPage: _fullPage = false,
  contentArea: _contentArea = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SlideModalItem[];
  index: number;
  onIndexChange: (index: number) => void;
  imageFit?: "cover" | "contain";
  /** @deprecated — 공개 모달 폭은 항상 site-content-max */
  fullPage?: boolean;
  /** @deprecated — 공개 모달 폭은 항상 site-content-max */
  contentArea?: boolean;
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [uri, setUri] = useState("");
  const current = items[index];
  const fit = imageFit;

  function go(delta: number) {
    const next = index + delta;
    if (next < 0 || next >= items.length) return;
    onIndexChange(next);
  }

  useEffect(() => {
    if (!current) return;
    setUri(uploadOriginalUrl(current.src));
  }, [current?.src]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          SITE_MEDIA_MODAL_SHELL,
          "duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        )}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <DialogTitle className="sr-only">{current.alt}</DialogTitle>
        <div
          className={cn(
            SITE_MEDIA_MODAL_VIEWPORT,
            fit === "contain" ? "bg-black/40" : "bg-black/20",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={current.src}
            src={uri || uploadOriginalUrl(current.src)}
            alt={current.alt}
            draggable={false}
            className={cn(
              "guest-photo-bright pointer-events-none absolute inset-0 h-full w-full object-center object-contain p-1 sm:p-2",
            )}
          />
          {items.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="이전 사진"
                disabled={index <= 0}
                className="absolute left-2 top-1/2 z-[1] flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md ring-1 ring-white/35 hover:bg-black/60 disabled:opacity-30 sm:left-3 sm:size-12"
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
                className="absolute right-2 top-1/2 z-[1] flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md ring-1 ring-white/35 hover:bg-black/60 disabled:opacity-30 sm:right-3 sm:size-12"
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
          <p className="truncate px-10 pt-2 text-center text-sm text-white/90">{current.alt}</p>
        ) : null}
        {items.length > 1 ? (
          <p className="pb-1 text-center text-xs text-white/70" aria-live="polite">
            {index + 1} / {items.length}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}