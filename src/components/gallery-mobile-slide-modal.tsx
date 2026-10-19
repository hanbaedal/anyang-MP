"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { mediaUrl } from "@/lib/media";
import type { GalleryItem } from "@/lib/content";
import { cn } from "@/lib/utils";

/** 모바일 목록 탭용 — 크림 슬라이드 카드와 같은 시각 스케일 + 좌우 스와이프 */
export function GalleryMobileSlideModal({
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const current = items[index];

  useEffect(() => {
    if (!open || !scrollerRef.current) return;
    const el = scrollerRef.current;
    const slideW = el.clientWidth;
    if (slideW <= 0) return;
    syncingRef.current = true;
    el.scrollTo({ left: index * slideW, behavior: "auto" });
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  }, [open, index, items.length]);

  function onScroll() {
    if (syncingRef.current) return;
    const el = scrollerRef.current;
    if (!el || items.length === 0) return;
    const slideW = el.clientWidth;
    if (slideW <= 0) return;
    const next = Math.round(el.scrollLeft / slideW);
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    if (clamped !== index) onIndexChange(clamped);
  }

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "fixed top-[50%] left-[50%] z-50 w-[min(100vw-1.5rem,20rem)] max-w-[min(100vw-1.5rem,20rem)]",
          "translate-x-[-50%] translate-y-[-50%] gap-0 overflow-hidden rounded-2xl border border-[#ead7b4] bg-[#f8eedd] p-3 shadow-lg",
          "duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "[&_[data-slot=dialog-close]]:right-2 [&_[data-slot=dialog-close]]:top-2 [&_[data-slot=dialog-close]]:z-10",
          "[&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-[#fffcf7]/90 [&_[data-slot=dialog-close]]:p-1.5",
          "[&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:shadow-sm",
        )}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <DialogTitle className="sr-only">{current.alt}</DialogTitle>
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex aspect-[4/3] w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((item) => (
            <figure
              key={item.src}
              className="relative aspect-[4/3] min-w-full shrink-0 snap-center snap-always overflow-hidden rounded-xl bg-muted"
            >
              <Image
                src={mediaUrl(item.src)}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="min(100vw, 20rem)"
                priority={item.src === current.src}
              />
            </figure>
          ))}
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
