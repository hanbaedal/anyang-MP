"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  HOME_INTRO_SLIDE_SRC_REJECT_MSG,
  HOME_INTRO_SLIDES_MAX,
  isPersistableHomeIntroSlideSrc,
  type HomeIntroSlide,
} from "@/lib/home-intro-slides-types";
import { GALLERY_MANAGE_UI_TAGS, type GalleryPhoto } from "@/lib/gallery-types";
import type { GalleryTag } from "@/lib/content";
import { thumbUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Filter = "전체" | GalleryTag;

export function CmsHomeSlidesPanel({
  slides,
  busy,
  dirty,
  filter,
  loadingGallery,
  galleryError,
  visible,
  onFilterChange,
  onTogglePhoto,
  onRemoveAt,
  orderById,
  orderBySrc,
  slideIdForPhoto,
}: {
  slides: HomeIntroSlide[];
  busy: boolean;
  dirty: boolean;
  filter: Filter;
  loadingGallery: boolean;
  galleryError: string;
  visible: GalleryPhoto[];
  onFilterChange: (f: Filter) => void;
  onTogglePhoto: (photo: GalleryPhoto) => void;
  onRemoveAt: (index: number) => void;
  orderById: Map<string, number>;
  orderBySrc: Map<string, number>;
  slideIdForPhoto: (photo: GalleryPhoto) => string;
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const atMax = slides.length >= HOME_INTRO_SLIDES_MAX;

  return (
    <>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          선택 {slides.length}/{HOME_INTRO_SLIDES_MAX}
          {dirty ? " · 미저장" : ""}
        </p>

        {slides.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2">
            {slides.map((slide, index) => (
              <li
                key={slide.id}
                className="relative overflow-hidden rounded-lg border border-primary/40 bg-card p-1 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbUrl(slide.src)}
                  alt={slide.alt || `전경 ${index + 1}`}
                  className="aspect-[4/3] w-full rounded object-cover"
                />
                <span className="absolute left-2 top-2 rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-2 right-2 h-7 bg-card/95 px-2 text-[11px] text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                  disabled={busy}
                  onClick={() => onRemoveAt(index)}
                >
                  삭제
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-8"
            aria-hidden
          />
        )}

        <Button
          type="button"
          className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={busy || atMax}
          onClick={() => setGalleryOpen(true)}
        >
          {slides.length === 0 ? "배경 이미지 선택" : "배경 이미지 추가"}
        </Button>
      </div>

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="flex max-h-[min(92vh,720px)] flex-col gap-3 overflow-hidden p-4 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base text-primary">갤러리에서 선택</DialogTitle>
            <DialogDescription className="sr-only">갤러리 이미지 선택</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-1.5">
            {(["전체", ...GALLERY_MANAGE_UI_TAGS] as Filter[]).map((tag) => (
              <Button
                key={tag}
                type="button"
                size="sm"
                variant={filter === tag ? "default" : "outline"}
                className="h-7 px-2 text-xs"
                onClick={() => onFilterChange(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
          {loadingGallery ? <p className="text-xs text-muted-foreground">불러오는 중…</p> : null}
          {galleryError ? <p className="text-xs text-destructive">{galleryError}</p> : null}
          <ul className="min-h-0 flex-1 grid grid-cols-2 gap-2 overflow-y-auto pr-1">
            {visible.map((item) => {
              const id = slideIdForPhoto(item);
              const order = orderById.get(id) ?? orderBySrc.get(item.src);
              const selected = Boolean(order);
              const persistable = isPersistableHomeIntroSlideSrc(item.src);
              const blocked = !selected && !persistable;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={busy || (!selected && atMax) || blocked}
                    title={blocked ? HOME_INTRO_SLIDE_SRC_REJECT_MSG : undefined}
                    className={cn(
                      "relative w-full rounded-lg border p-1.5 text-left transition",
                      selected ? "border-primary ring-2 ring-primary/30" : "hover:border-primary",
                      (!selected && atMax) || blocked ? "opacity-50" : null,
                    )}
                    onClick={() => onTogglePhoto(item)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl(item.src)} alt="" className="aspect-[4/3] w-full rounded object-cover" />
                    {selected ? (
                      <span className="absolute left-2 top-2 rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                        {order}
                      </span>
                    ) : null}
                    {blocked ? (
                      <span className="absolute inset-x-1 bottom-1 rounded bg-black/65 px-1 py-0.5 text-center text-[9px] leading-tight text-white">
                        홈 배경 불가
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <Button type="button" className="w-full" variant="outline" onClick={() => setGalleryOpen(false)}>
            닫기
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}