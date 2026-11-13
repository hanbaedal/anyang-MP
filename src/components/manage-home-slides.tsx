"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  HOME_INTRO_SLIDE_FALLBACK_SRC,
  HOME_INTRO_SLIDES_MAX,
  type HomeIntroSlide,
  type HomeIntroSlidesSettings,
} from "@/lib/home-intro-slides-types";
import { GALLERY_TAGS, type GalleryPhoto } from "@/lib/gallery-types";
import type { GalleryTag } from "@/lib/content";
import { thumbUrl, uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Filter = "전체" | GalleryTag;

function slideIdForPhoto(photo: GalleryPhoto) {
  return `gallery:${photo.id}`;
}

export function ManageHomeSlides({ initial }: { initial: HomeIntroSlidesSettings }) {
  const [slides, setSlides] = useState<HomeIntroSlide[]>(initial.slides);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [filter, setFilter] = useState<Filter>("전경");
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [galleryError, setGalleryError] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const busy = status === "busy";

  const orderBySrc = useMemo(() => {
    const map = new Map<string, number>();
    slides.forEach((s, i) => map.set(s.src, i + 1));
    return map;
  }, [slides]);

  const orderById = useMemo(() => {
    const map = new Map<string, number>();
    slides.forEach((s, i) => map.set(s.id, i + 1));
    return map;
  }, [slides]);

  const loadGallery = useCallback(async () => {
    setLoadingGallery(true);
    setGalleryError("");
    try {
      const res = await fetch("/api/manage/gallery");
      const json = (await res.json()) as { ok?: boolean; items?: GalleryPhoto[]; error?: string };
      if (!res.ok || !json.items) {
        setGalleryError(json.error || "갤러리 사진을 불러오지 못했습니다.");
        return;
      }
      setGallery(json.items);
    } catch {
      setGalleryError("네트워크 오류입니다.");
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  useEffect(() => {
    void loadGallery();
  }, [loadGallery]);

  const visible =
    filter === "전체" ? gallery : gallery.filter((item) => item.tags.includes(filter));

  function togglePhoto(photo: GalleryPhoto) {
    const id = slideIdForPhoto(photo);
    const existing = slides.findIndex((s) => s.id === id || s.src === photo.src);
    if (existing >= 0) {
      const next = slides.filter((_, i) => i !== existing).map((s, i) => ({ ...s, sort: i }));
      setSlides(next);
      setDirty(true);
      setMessage("선택을 해제했습니다. 「저장」을 눌러 홈에 반영하세요.");
      setStatus("idle");
      return;
    }
    if (slides.length >= HOME_INTRO_SLIDES_MAX) {
      setMessage(`최대 ${HOME_INTRO_SLIDES_MAX}장까지 고를 수 있습니다.`);
      setStatus("error");
      return;
    }
    const next: HomeIntroSlide[] = [
      ...slides,
      {
        id,
        src: photo.src,
        alt: photo.alt?.trim().slice(0, 80) || `메인 전경 ${slides.length + 1}`,
        sort: slides.length,
        createdAt: new Date().toISOString(),
      },
    ].map((s, i) => ({ ...s, sort: i }));
    setSlides(next);
    setDirty(true);
    setMessage(`순서 ${next.length}번으로 넣었습니다. 「저장」을 눌러 홈에 반영하세요.`);
    setStatus("idle");
  }

  async function save() {
    setStatus("busy");
    setMessage("");
    try {
      const res = await fetch("/api/manage/home-slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        settings?: HomeIntroSlidesSettings;
      };
      if (!res.ok || !json.ok || !json.settings) {
        setMessage(json.error || "저장에 실패했습니다.");
        setStatus("error");
        return;
      }
      setSlides(json.settings.slides);
      setDirty(false);
      setMessage(
        json.settings.slides.length
          ? "저장했습니다. 홈 슬라이드에 반영됩니다."
          : "선택을 비웠습니다. 홈에는 폴백 이미지(05)가 보입니다.",
      );
      setStatus("ok");
    } catch {
      setMessage("네트워크 오류입니다.");
      setStatus("error");
    }
  }

  function clearAll() {
    if (!slides.length) return;
    setSlides([]);
    setDirty(true);
    setMessage("모두 해제했습니다. 「저장」을 눌러 홈에 반영하세요.");
    setStatus("idle");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-3 py-6 sm:px-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        갤러리에 올린 사진을 카드로 고릅니다. <strong className="font-medium">클릭한 순서</strong>가
        홈(/) 전경 슬라이드 순서입니다(최대 {HOME_INTRO_SLIDES_MAX}장). 새 사진은{" "}
        <a href="/manage/gallery" className="underline-offset-2 hover:underline">
          갤러리 관리
        </a>
        에서 올리세요. 선택이 없으면 홈에{" "}
        <code className="rounded bg-muted px-1">{HOME_INTRO_SLIDE_FALLBACK_SRC}</code> 한 장이
        보입니다.
      </p>

      <section className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" disabled={busy || !dirty} onClick={() => void save()}>
            저장
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || slides.length === 0}
            onClick={clearAll}
          >
            선택 모두 해제
          </Button>
          <span className="text-xs text-muted-foreground">
            선택 {slides.length}/{HOME_INTRO_SLIDES_MAX}
            {dirty ? " · 미저장" : ""}
          </span>
        </div>
        {message ? (
          <p
            className={cn(
              "text-xs",
              status === "error" ? "text-destructive" : "text-muted-foreground",
            )}
            role="status"
          >
            {message}
          </p>
        ) : null}
        {slides.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t pt-3">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="relative h-14 w-20 overflow-hidden rounded-md border bg-muted"
                title={`${index + 1}. ${slide.alt}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbUrl(uploadOriginalUrl(slide.src))}
                  alt=""
                  className="size-full object-cover"
                />
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 text-[10px] font-semibold text-white">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">갤러리에서 고르기</h2>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            disabled={loadingGallery}
            onClick={() => void loadGallery()}
          >
            새로고침
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["전체", ...GALLERY_TAGS] as Filter[]).map((tag) => (
            <Button
              key={tag}
              type="button"
              size="sm"
              variant={filter === tag ? "default" : "outline"}
              className="h-7 px-2 text-xs"
              onClick={() => setFilter(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
        {loadingGallery ? <p className="text-xs text-muted-foreground">불러오는 중…</p> : null}
        {galleryError ? <p className="text-xs text-destructive">{galleryError}</p> : null}
        {!loadingGallery && !galleryError && visible.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            이 태그에 사진이 없습니다. 갤러리 관리에서 사진을 올린 뒤 다시 열어 주세요.
          </p>
        ) : null}
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {visible.map((item) => {
            const id = slideIdForPhoto(item);
            const order = orderById.get(id) ?? orderBySrc.get(item.src);
            const selected = Boolean(order);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={busy}
                  aria-pressed={selected}
                  className={cn(
                    "relative w-full space-y-1 rounded-lg border bg-card p-2 text-left transition",
                    selected
                      ? "border-primary ring-2 ring-primary/30"
                      : "hover:border-primary hover:bg-accent",
                  )}
                  onClick={() => togglePhoto(item)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl(item.src)}
                    alt={item.alt}
                    className="aspect-[4/3] w-full rounded-md object-cover"
                  />
                  {selected ? (
                    <span className="absolute left-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
                      {order}
                    </span>
                  ) : null}
                  <p className="truncate text-xs font-medium">{item.alt}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {item.tags.join(" · ")}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
