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
import { HOME_INTRO_SLIDES_MAX, type HomeIntroSlide } from "@/lib/home-intro-slides-types";
import { GALLERY_TAGS, type GalleryPhoto } from "@/lib/gallery-types";
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
          <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground">
            등록된 전경 이미지가 없습니다.
          </p>
        )}

        <Button
          type="button"
          className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={busy || atMax}
          onClick={() => setGalleryOpen(true)}
        >
          {slides.length === 0 ? "배경 이미지 선택" : "배경 이미지 추가"}
        </Button>
        {atMax ? (
          <p className="text-[10px] text-muted-foreground">최대 {HOME_INTRO_SLIDES_MAX}장입니다.</p>
        ) : (
          <p className="text-[10px] text-muted-foreground">저장 후 미리보기 iframe이 갱신됩니다.</p>
        )}
      </div>

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="flex max-h-[min(92vh,720px)] flex-col gap-3 overflow-hidden p-4 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base text-primary">갤러리에서 선택</DialogTitle>
            <DialogDescription className="text-xs">
              썸네일을 눌러 추가합니다. 다시 누르면 선택 해제됩니다. (최대 {HOME_INTRO_SLIDES_MAX}장)
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-1.5">
            {(["전체", ...GALLERY_TAGS] as Filter[]).map((tag) => (
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
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={busy || (!selected && atMax)}
                    className={cn(
                      "relative w-full rounded-lg border p-1.5 text-left transition",
                      selected ? "border-primary ring-2 ring-primary/30" : "hover:border-primary",
                      !selected && atMax && "opacity-50",
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
                  </button>
                </li>
              );
            })}
          </ul>
          {!visible.length && !loadingGallery ? (
            <p className="text-xs text-muted-foreground">이 분류에 사진이 없습니다.</p>
          ) : null}
          <Button type="button" className="w-full" variant="outline" onClick={() => setGalleryOpen(false)}>
            닫기
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}