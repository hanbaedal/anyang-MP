"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CmsFieldKo, CmsSlotPanel } from "@/components/manage/cms-slot-panel";
import { Button } from "@/components/ui/button";
import {
  defaultHomeIntroHeroCopy,
  HOME_INTRO_HERO_COPY_LIMITS,
  HOME_INTRO_SLIDES_MAX,
  type HomeIntroHeroCopy,
  type HomeIntroSlide,
  type HomeIntroSlidesSettings,
} from "@/lib/home-intro-slides-types";
import { HOME_CMS_SLOT_META, type HomeCmsSlotKey } from "@/lib/home-cms-slots";
import { GALLERY_TAGS, type GalleryPhoto } from "@/lib/gallery-types";
import type { GalleryTag } from "@/lib/content";
import { thumbUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Filter = "전체" | GalleryTag;

const KEY_TO_FIELD: Record<string, keyof HomeIntroHeroCopy> = {
  "home.kicker": "kicker",
  "home.heroLine1": "heroLine1",
  "home.heroLine2": "heroLine2",
  "home.lead": "lead",
};

function slideIdForPhoto(photo: GalleryPhoto) {
  return `gallery:${photo.id}`;
}

export function ManageHomeCms({
  initial,
}: {
  initial: HomeIntroSlidesSettings;
  /** @deprecated iframe이 공개 / 를 직접 로드합니다 */
  heroMedia?: { videoSrc: string; audioSrc: string; posterSrc: string };
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
  const [frameRev, setFrameRev] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const busy = status === "busy";

  const iframeSrc = useMemo(() => `/?cmsEdit=1&_v=${frameRev}`, [frameRev]);

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

  const postToFrame = useCallback((payload: object) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(payload, window.location.origin);
  }, []);

  useEffect(() => {
    postToFrame({ type: "anyang-cms-active", key: activeKey, active: Boolean(activeKey) });
  }, [activeKey, postToFrame]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; key?: string };
      if (data?.type === "anyang-cms-select" && data.key) {
        const key = data.key as HomeCmsSlotKey;
        if (key in HOME_CMS_SLOT_META) setActiveKey(key);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

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

  function patchHeroField(field: keyof HomeIntroHeroCopy, value: string) {
    setHeroCopy((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setStatus("idle");
    const slotKey = Object.entries(KEY_TO_FIELD).find(([, f]) => f === field)?.[0];
    if (slotKey) postToFrame({ type: "anyang-cms-patch", key: slotKey, text: value });
  }

  function togglePhoto(photo: GalleryPhoto) {
    const id = slideIdForPhoto(photo);
    const existing = slides.findIndex((s) => s.id === id || s.src === photo.src);
    let next: HomeIntroSlide[];
    if (existing >= 0) {
      next = slides.filter((_, i) => i !== existing).map((s, i) => ({ ...s, sort: i }));
    } else {
      if (slides.length >= HOME_INTRO_SLIDES_MAX) {
        setMessage(`최대 ${HOME_INTRO_SLIDES_MAX}장까지 고를 수 있습니다.`);
        setStatus("error");
        return;
      }
      next = [
        ...slides,
        {
          id,
          src: photo.src,
          alt: photo.alt?.trim().slice(0, 80) || `메인 전경 ${slides.length + 1}`,
          sort: slides.length,
          createdAt: new Date().toISOString(),
        },
      ].map((s, i) => ({ ...s, sort: i }));
    }
    setSlides(next);
    setDirty(true);
    setMessage("슬라이드 목록을 바꿨습니다. 저장을 눌러 반영하세요.");
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
      setFrameRev((n) => n + 1);
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

  const slotMeta = activeKey ? HOME_CMS_SLOT_META[activeKey] : null;

  const panelChildren =
    activeKey === "home.slides" ? (
      <>
        <p className="text-xs text-muted-foreground">
          클릭 순서 = 슬라이드 순서 (최대 {HOME_INTRO_SLIDES_MAX}장). 저장 후 iframe이 갱신됩니다.
        </p>
        <p className="text-xs text-muted-foreground">
          선택 {slides.length}/{HOME_INTRO_SLIDES_MAX}
          {dirty ? " · 미저장" : ""}
        </p>
        <Button type="button" size="sm" variant="outline" disabled={busy || slides.length === 0} onClick={clearAll}>
          모두 해제
        </Button>
        <div className="space-y-2 border-t pt-3">
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
          <ul className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
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
                      "relative w-full rounded-lg border p-1.5 text-left transition",
                      selected ? "border-primary ring-2 ring-primary/30" : "hover:border-primary",
                    )}
                    onClick={() => togglePhoto(item)}
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
        </div>
      </>
    ) : activeKey && slotMeta && slotMeta.field !== "slides" ? (
      (() => {
        const field = KEY_TO_FIELD[activeKey];
        if (!field) return null;
        return (
          <CmsFieldKo
            multiline={activeKey === "home.lead"}
            disabled={busy}
            maxLength={HOME_INTRO_HERO_COPY_LIMITS[field]}
            value={heroCopy[field]}
            onChange={(value) => patchHeroField(field, value)}
          />
        );
      })()
    ) : null;

  const panelHint =
    activeKey === "home.slides"
      ? undefined
      : activeKey
        ? "입력 즉시 왼쪽 미리보기에 반영됩니다. 한글만 저장하면 영·중은 공개 페이지에서 자동 처리됩니다."
        : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <p className="cms-orders-lead">
        실제 홈페이지(<code>/</code>)와 동일한 배치입니다. 편집할 문구·전경을 <strong>클릭</strong>한 뒤 오른쪽에서
        수정하세요. 영상·음악은{" "}
        <Link href="/manage/home-hero" className="text-primary underline-offset-2 hover:underline">
          메인 영상·음악
        </Link>
        .
      </p>
      <div className="cms-layout mx-auto w-full max-w-[100rem] flex-1 gap-4 p-3 md:p-4">
        <div className="cms-preview-wrap flex min-h-0 min-w-0 flex-col">
          <div className="cms-preview-toolbar">
            <span className="text-muted-foreground">미리보기 언어</span>
            <select
              className="h-8 rounded-md border border-input bg-card px-2 text-xs"
              value="ko"
              disabled
              aria-label="미리보기 언어"
            >
              <option value="ko">한국어</option>
            </select>
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto rounded-md border border-input bg-card px-2.5 py-1 text-xs font-medium hover:bg-accent"
            >
              공개 홈 새 창
            </Link>
          </div>
          <iframe
            ref={iframeRef}
            key={iframeSrc}
            title="홈페이지 미리보기"
            src={iframeSrc}
            className="cms-frame flex-1"
          />
        </div>
        <CmsSlotPanel
          slotKey={activeKey ?? undefined}
          slotLabel={slotMeta?.label}
          onSave={() => void save()}
          saveDisabled={busy}
          saving={busy}
          hint={panelHint}
          footer={
            message ? (
              <p
                className={cn(
                  "text-center text-xs",
                  status === "error" ? "text-destructive" : status === "ok" ? "text-green-700" : "text-muted-foreground",
                )}
              >
                {message}
                {dirty && status !== "error" ? " (미저장 변경 있음)" : null}
              </p>
            ) : dirty ? (
              <p className="text-center text-xs text-amber-800">미저장 변경이 있습니다.</p>
            ) : null
          }
        >
          {panelChildren}
        </CmsSlotPanel>
      </div>
    </div>
  );
}