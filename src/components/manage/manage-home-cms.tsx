"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HomeIntro } from "@/components/home-intro";
import { ManageEditToolbar } from "@/components/manage/manage-edit-toolbar";
import { Button } from "@/components/ui/button";
import {
  defaultHomeIntroHeroCopy,
  HOME_INTRO_HERO_COPY_LIMITS,
  HOME_INTRO_SLIDE_FALLBACK_ALT,
  HOME_INTRO_SLIDE_FALLBACK_SRC,
  HOME_INTRO_SLIDES_MAX,
  type HomeIntroHeroCopy,
  type HomeIntroSlide,
  type HomeIntroSlidesSettings,
} from "@/lib/home-intro-slides-types";
import { HOME_CMS_SLOT_META, type HomeCmsSlotKey } from "@/lib/home-cms-slots";
import { GALLERY_TAGS, type GalleryPhoto } from "@/lib/gallery-types";
import type { GalleryTag } from "@/lib/content";
import { thumbUrl, uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Filter = "전체" | GalleryTag;

const fieldClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const areaClass =
  "min-h-[4.5rem] w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function slideIdForPhoto(photo: GalleryPhoto) {
  return `gallery:${photo.id}`;
}

export function ManageHomeCms({
  initial,
  heroMedia,
}: {
  initial: HomeIntroSlidesSettings;
  heroMedia: { videoSrc: string; audioSrc: string; posterSrc: string };
}) {
  const [slides, setSlides] = useState<HomeIntroSlide[]>(initial.slides);
  const [heroCopy, setHeroCopy] = useState<HomeIntroHeroCopy>(initial.heroCopy ?? defaultHomeIntroHeroCopy());
  const [activeKey, setActiveKey] = useState<HomeCmsSlotKey | null>(null);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [filter, setFilter] = useState<Filter>("전경");
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [galleryError, setGalleryError] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const busy = status === "busy";

  const viewPhotos = useMemo(
    () =>
      slides.length > 0
        ? slides.map((s) => ({ src: s.src, alt: s.alt }))
        : [{ src: HOME_INTRO_SLIDE_FALLBACK_SRC, alt: HOME_INTRO_SLIDE_FALLBACK_ALT }],
    [slides],
  );

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
      setMessage("선택을 해제했습니다. 저장을 눌러 반영하세요.");
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
    setMessage(`순서 ${next.length}번으로 넣었습니다. 저장을 눌러 반영하세요.`);
    setStatus("idle");
  }

  function patchHeroField(field: keyof HomeIntroHeroCopy, value: string) {
    setHeroCopy((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setStatus("idle");
  }

  async function save() {
    setStatus("busy");
    setMessage("");
    try {
      const res = await fetch("/api/manage/home-slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides, heroCopy }),
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
      setHeroCopy(json.settings.heroCopy);
      setDirty(false);
      setMessage("저장했습니다. 공개 홈에 반영됩니다.");
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
    setMessage("모두 해제했습니다. 저장을 눌러 반영하세요.");
    setStatus("idle");
  }

  function selectSlot(key: HomeCmsSlotKey) {
    setActiveKey(key);
    if (key === "home.slides") {
      galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const panel = (
    <aside className="cms-panel sticky top-2 rounded-xl border bg-card shadow-sm">
      <div className="border-b px-3 py-2.5 text-sm font-medium">슬롯 편집</div>
      <div className="max-h-[min(75vh,520px)] overflow-y-auto p-3">
        {!activeKey ? (
          <p className="text-sm text-muted-foreground">
            왼쪽 <strong>홈 화면</strong>과 동일한 배치에서 문구·전경을 <strong>클릭</strong>하세요.
          </p>
        ) : activeKey === "home.slides" ? (
          <div className="space-y-3 text-sm">
            <p className="font-medium">{HOME_CMS_SLOT_META[activeKey].label}</p>
            <p className="text-xs text-muted-foreground">
              클릭 순서 = 홈 슬라이드 순서(최대 {HOME_INTRO_SLIDES_MAX}장). 아래 갤러리에서 고르세요.
            </p>
            <p className="text-xs text-muted-foreground">
              선택 {slides.length}/{HOME_INTRO_SLIDES_MAX}
              {dirty ? " · 미저장" : ""}
            </p>
            <Button type="button" size="sm" variant="outline" disabled={busy || slides.length === 0} onClick={clearAll}>
              선택 모두 해제
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {HOME_CMS_SLOT_META[activeKey].label}{" "}
              <code className="rounded bg-muted px-1">{activeKey}</code>
            </p>
            {activeKey === "home.lead" ? (
              <textarea
                className={areaClass}
                rows={4}
                disabled={busy}
                maxLength={HOME_INTRO_HERO_COPY_LIMITS.lead}
                value={heroCopy.lead}
                onChange={(e) => patchHeroField("lead", e.target.value)}
              />
            ) : (
              <input
                className={fieldClass}
                disabled={busy}
                maxLength={
                  activeKey === "home.kicker"
                    ? HOME_INTRO_HERO_COPY_LIMITS.kicker
                    : activeKey === "home.heroLine1"
                      ? HOME_INTRO_HERO_COPY_LIMITS.heroLine1
                      : HOME_INTRO_HERO_COPY_LIMITS.heroLine2
                }
                value={
                  activeKey === "home.kicker"
                    ? heroCopy.kicker
                    : activeKey === "home.heroLine1"
                      ? heroCopy.heroLine1
                      : heroCopy.heroLine2
                }
                onChange={(e) =>
                  patchHeroField(
                    activeKey === "home.kicker"
                      ? "kicker"
                      : activeKey === "home.heroLine1"
                        ? "heroLine1"
                        : "heroLine2",
                    e.target.value,
                  )
                }
              />
            )}
            <p className="text-[10px] text-muted-foreground">한국어 문구 · en/zh는 저장 시 번역·기본값을 따릅니다.</p>
          </div>
        )}
        <div className="mt-4 border-t pt-3">
          <Link href="/manage/home-hero" className="text-xs text-primary underline-offset-2 hover:underline">
            메인 영상·음악 설정
          </Link>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-full flex-col bg-background">
      <ManageEditToolbar
        busy={busy}
        message={message}
        status={
          status === "busy" ? "busy" : dirty ? "idle" : status === "ok" ? "ok" : status === "error" ? "error" : "idle"
        }
        onSave={() => void save()}
        hint="미리보기에서 클릭 → 오른쪽 슬롯 편집 → 저장"
      />
      <div className="cms-layout mx-auto w-full max-w-[90rem] gap-4 p-3 md:p-4">
        <div className="cms-preview-wrap min-w-0 overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span>홈(/) 미리보기</span>
            <Link href="/" target="_blank" className="ml-auto text-primary underline-offset-2 hover:underline">
              공개 홈 새 창
            </Link>
          </div>
          <div className="relative min-h-[min(60vh,32rem)] w-full">
            <HomeIntro
              videoSrc={heroMedia.videoSrc}
              audioSrc={heroMedia.audioSrc}
              posterSrc={heroMedia.posterSrc}
              viewPhotos={viewPhotos}
              heroCopy={heroCopy}
              cmsSlot={{ activeKey, onSelect: selectSlot }}
            />
          </div>
          <div ref={galleryRef} className="border-t p-3 sm:p-4">
            <p className="mb-2 text-xs text-muted-foreground">
              전경을 클릭한 뒤 갤러리에서 순서대로 선택 · 새 사진은{" "}
              <Link href="/manage/gallery" className="underline">
                갤러리 관리
              </Link>
            </p>
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
            {loadingGallery ? <p className="mt-2 text-xs text-muted-foreground">불러오는 중…</p> : null}
            {galleryError ? <p className="mt-2 text-xs text-destructive">{galleryError}</p> : null}
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {visible.map((item) => {
                const id = slideIdForPhoto(item);
                const order = orderById.get(id) ?? orderBySrc.get(item.src);
                const selected = Boolean(order);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={busy}
                      className={cn(
                        "relative w-full space-y-1 rounded-lg border p-2 text-left transition",
                        selected ? "border-primary ring-2 ring-primary/30" : "hover:border-primary",
                      )}
                      onClick={() => togglePhoto(item)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbUrl(item.src)} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
                      {selected ? (
                        <span className="absolute left-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                          {order}
                        </span>
                      ) : null}
                      <p className="truncate text-[10px]">{item.alt}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        {panel}
      </div>
    </div>
  );
}