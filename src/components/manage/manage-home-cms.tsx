"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CmsFontPick } from "@/components/manage/cms-font-pick";
import { CmsFontScale } from "@/components/manage/cms-font-scale";
import { CmsTextColor } from "@/components/manage/cms-text-color";
import { CmsFieldKo, CmsSlotPanel } from "@/components/manage/cms-slot-panel";
import { Button } from "@/components/ui/button";
import {
  defaultHomeHeroTextScale,
  defaultHomeIntroHeroCopy,
  HOME_INTRO_HERO_COPY_LIMITS,
  HOME_INTRO_SLIDES_MAX,
  type HomeHeroTextScale,
  type HomeIntroHeroCopy,
  type HomeIntroSlide,
  type HomeIntroSlidesSettings,
} from "@/lib/home-intro-slides-types";
import { HOME_CMS_SLOT_KEYS, HOME_CMS_SLOT_META, type HomeCmsSlotKey } from "@/lib/home-cms-slots";
import {
  defaultHomeHeroTextColor,
  defaultHomeHeroTextFont,
  type HomeHeroFontPreset,
  type HomeHeroTextColor,
  type HomeHeroTextFont,
} from "@/lib/home-hero-text-style";
import { GALLERY_TAGS, type GalleryPhoto } from "@/lib/gallery-types";
import type { GalleryTag } from "@/lib/content";
import { thumbUrl } from "@/lib/media";
import {
  HOME_SOCIAL_ADD_SLOT,
  SITE_SOCIAL_ICON_LABELS,
  SITE_SOCIAL_ICONS,
  SITE_SOCIAL_MAX,
  defaultHrefForSocialIcon,
  defaultSiteSocialLinks,
  homeSocialSlotKey,
  isHomeSocialSlotKey,
  socialIdFromHomeSlotKey,
  type SiteSocialIcon,
  type SiteSocialLink,
} from "@/lib/site-social";
import { cn } from "@/lib/utils";

type Filter = "전체" | GalleryTag;

const KEY_TO_FIELD: Record<string, keyof HomeIntroHeroCopy> = {
  "home.kicker": "kicker",
  "home.heroLine1": "heroLine1",
  "home.heroLine2": "heroLine2",
  "home.lead": "lead",
};

const KEY_TO_SCALE: Record<string, keyof HomeHeroTextScale> = {
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
  const [heroTextScale, setHeroTextScale] = useState<HomeHeroTextScale>(
    initial.heroTextScale ?? defaultHomeHeroTextScale(),
  );
  const [heroTextFont, setHeroTextFont] = useState<HomeHeroTextFont>(
    initial.heroTextFont ?? defaultHomeHeroTextFont(),
  );
  const [heroTextColor, setHeroTextColor] = useState<HomeHeroTextColor>(
    initial.heroTextColor ?? defaultHomeHeroTextColor(),
  );
  const [socialLinks, setSocialLinks] = useState<SiteSocialLink[]>(
    initial.socialLinks?.length ? initial.socialLinks : defaultSiteSocialLinks(),
  );
  const [activeKey, setActiveKey] = useState<string | null>("home.slides");
  const [draftIcon, setDraftIcon] = useState<SiteSocialIcon>("facebook");
  const [draftHref, setDraftHref] = useState("");
  const [draftLabel, setDraftLabel] = useState("");
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [filter, setFilter] = useState<Filter>("전경");
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [galleryError, setGalleryError] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [frameRev, setFrameRev] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const galleryGridRef = useRef<HTMLUListElement>(null);
  const busy = status === "busy";

  const isHomeContentSlot = activeKey === "home.slides" || Boolean(activeKey && activeKey in HOME_CMS_SLOT_META);

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
      const data = event.data as { type?: string; key?: string; href?: string; text?: string };
      if (data?.type === "anyang-cms-ready") {
        for (const key of Object.keys(KEY_TO_SCALE)) {
          const field = KEY_TO_SCALE[key];
          if (!field) continue;
          postToFrame({
            type: "anyang-cms-patch",
            key,
            fontScale: heroTextScale[field],
            fontPreset: heroTextFont[field],
            textColor: heroTextColor[field],
          });
        }
      }
      if (data?.type === "anyang-cms-select" && data.key) {
        const key = data.key;
        const socialId = socialIdFromHomeSlotKey(key);
        if (socialId) {
          const href = data.href?.trim();
          const label = data.text?.trim();
          if (href || label) {
            setSocialLinks((prev) =>
              prev.map((row) =>
                row.id === socialId
                  ? {
                      ...row,
                      ...(href ? { href } : {}),
                      ...(label ? { label } : {}),
                    }
                  : row,
              ),
            );
          }
        }
        if (key in HOME_CMS_SLOT_META || isHomeSocialSlotKey(key)) setActiveKey(key);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [heroTextColor, heroTextFont, heroTextScale, postToFrame]);

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

  useEffect(() => {
    if (activeKey !== HOME_SOCIAL_ADD_SLOT) return;
    setDraftHref(defaultHrefForSocialIcon(draftIcon));
    setDraftLabel((prev) => (prev.trim() ? prev : SITE_SOCIAL_ICON_LABELS[draftIcon]));
  }, [activeKey, draftIcon]);

  const visible =
    filter === "전체" ? gallery : gallery.filter((item) => item.tags.includes(filter));

  function bumpFrame() {
    setFrameRev((n) => n + 1);
  }

  const editingSocialId = socialIdFromHomeSlotKey(activeKey);
  const editingSocial = editingSocialId ? socialLinks.find((row) => row.id === editingSocialId) : undefined;

  function patchSocial(id: string, patch: Partial<Pick<SiteSocialLink, "href" | "label" | "icon">>) {
    setSocialLinks((prev) => {
      const next = prev.map((row) => (row.id === id ? { ...row, ...patch } : row));
      const updated = next.find((row) => row.id === id);
      if (updated) {
        postToFrame({
          type: "anyang-cms-patch",
          key: homeSocialSlotKey(id),
          href: updated.href,
          text: updated.label,
        });
      }
      return next;
    });
    setDirty(true);
    setStatus("idle");
  }

  function removeSocial(id: string) {
    setSocialLinks((prev) => prev.filter((row) => row.id !== id).map((row, index) => ({ ...row, sort: index })));
    setActiveKey(null);
    setDirty(true);
    setMessage("SNS 아이콘을 삭제했습니다. 저장을 눌러 반영하세요.");
    setStatus("idle");
    bumpFrame();
  }

  function addSocialFromDraft() {
    if (socialLinks.length >= SITE_SOCIAL_MAX) {
      setMessage(`SNS는 최대 ${SITE_SOCIAL_MAX}개까지입니다.`);
      setStatus("error");
      return;
    }
    const href = draftHref.trim() || defaultHrefForSocialIcon(draftIcon);
    if (!/^https?:\/\//i.test(href)) {
      setMessage("URL은 https:// 로 시작해야 합니다.");
      setStatus("error");
      return;
    }
    const label = draftLabel.trim() || SITE_SOCIAL_ICON_LABELS[draftIcon];
    const id = crypto.randomUUID();
    setSocialLinks((prev) => [
      ...prev,
      { id, icon: draftIcon, href, label, sort: prev.length },
    ]);
    setDirty(true);
    setActiveKey(homeSocialSlotKey(id));
    setDraftHref(defaultHrefForSocialIcon(draftIcon));
    setDraftLabel("");
    setMessage("SNS를 추가했습니다. 저장을 눌러 반영하세요.");
    setStatus("idle");
    bumpFrame();
  }

  function patchHeroScale(field: keyof HomeHeroTextScale, scale: number) {
    setHeroTextScale((prev) => ({ ...prev, [field]: scale }));
    setDirty(true);
    setStatus("idle");
    const slotKey = Object.entries(KEY_TO_SCALE).find(([, f]) => f === field)?.[0];
    if (slotKey) postToFrame({ type: "anyang-cms-patch", key: slotKey, fontScale: scale });
  }

  function patchHeroFont(field: keyof HomeHeroTextFont, preset: HomeHeroFontPreset) {
    setHeroTextFont((prev) => ({ ...prev, [field]: preset }));
    setDirty(true);
    setStatus("idle");
    const slotKey = Object.entries(KEY_TO_SCALE).find(([, f]) => f === field)?.[0];
    if (slotKey) postToFrame({ type: "anyang-cms-patch", key: slotKey, fontPreset: preset });
  }

  function patchHeroColor(field: keyof HomeHeroTextColor, color: string) {
    setHeroTextColor((prev) => ({ ...prev, [field]: color }));
    setDirty(true);
    setStatus("idle");
    const slotKey = Object.entries(KEY_TO_SCALE).find(([, f]) => f === field)?.[0];
    if (slotKey) postToFrame({ type: "anyang-cms-patch", key: slotKey, textColor: color });
  }

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
        body: JSON.stringify({ slides, heroCopy, heroTextScale, heroTextFont, heroTextColor, socialLinks }),
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
      if (json.settings.heroTextScale) setHeroTextScale(json.settings.heroTextScale);
      if (json.settings.heroTextFont) setHeroTextFont(json.settings.heroTextFont);
      if (json.settings.heroTextColor) setHeroTextColor(json.settings.heroTextColor);
      if (json.settings.socialLinks?.length) setSocialLinks(json.settings.socialLinks);
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

  const slotMeta =
    activeKey && activeKey in HOME_CMS_SLOT_META
      ? HOME_CMS_SLOT_META[activeKey as keyof typeof HOME_CMS_SLOT_META]
      : null;

  function HomeCmsSlotSelect() {
    if (!isHomeContentSlot) return null;
    const value: HomeCmsSlotKey =
      activeKey === "home.slides" || (activeKey && activeKey in HOME_CMS_SLOT_META)
        ? (activeKey as HomeCmsSlotKey)
        : "home.slides";
    return (
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-foreground">편집 슬롯</span>
        <select
          className="h-9 w-full rounded-md border-2 border-primary/35 bg-card px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={value}
          disabled={busy}
          onChange={(e) => setActiveKey(e.target.value)}
        >
          {HOME_CMS_SLOT_KEYS.map((key) => (
            <option key={key} value={key}>
              {HOME_CMS_SLOT_META[key].label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  const panelChildren =
    activeKey === HOME_SOCIAL_ADD_SLOT ? (
      <div className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">우측 SNS 막대에 아이콘을 추가합니다 (최대 {SITE_SOCIAL_MAX}개).</p>
        <label className="block space-y-1">
          <span className="font-medium">아이콘</span>
          <select
            className="h-9 w-full rounded-md border border-input bg-card px-2"
            value={draftIcon}
            disabled={busy}
            onChange={(e) => {
              const icon = e.target.value as SiteSocialIcon;
              setDraftIcon(icon);
              setDraftHref(defaultHrefForSocialIcon(icon));
            }}
          >
            {SITE_SOCIAL_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {SITE_SOCIAL_ICON_LABELS[icon]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="font-medium">링크 URL</span>
          <input
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            disabled={busy}
            value={draftHref || defaultHrefForSocialIcon(draftIcon)}
            onChange={(e) => setDraftHref(e.target.value)}
            placeholder={defaultHrefForSocialIcon(draftIcon)}
          />
        </label>
        <label className="block space-y-1">
          <span className="font-medium">이름 (스크린리더)</span>
          <input
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            disabled={busy}
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            placeholder={SITE_SOCIAL_ICON_LABELS[draftIcon]}
          />
        </label>
        <Button type="button" size="sm" disabled={busy} onClick={addSocialFromDraft}>
          목록에 추가
        </Button>
      </div>
    ) : editingSocial ? (
      <div className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">미리보기에서는 이동하지 않습니다. 아래에 현재 연결 URL이 표시됩니다.</p>
        <label className="block space-y-1">
          <span className="font-medium">아이콘</span>
          <select
            className="h-9 w-full rounded-md border border-input bg-card px-2"
            value={editingSocial.icon}
            disabled={busy}
            onChange={(e) => {
              patchSocial(editingSocial.id, { icon: e.target.value as SiteSocialIcon });
              bumpFrame();
            }}
          >
            {SITE_SOCIAL_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {SITE_SOCIAL_ICON_LABELS[icon]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="font-medium">링크 URL (현재 연결)</span>
          <input
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            disabled={busy}
            value={
              editingSocial.href.trim() || defaultHrefForSocialIcon(editingSocial.icon)
            }
            onChange={(e) => patchSocial(editingSocial.id, { href: e.target.value })}
            placeholder={defaultHrefForSocialIcon(editingSocial.icon)}
          />
        </label>
        <label className="block space-y-1">
          <span className="font-medium">이름 (스크린리더)</span>
          <input
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            disabled={busy}
            value={editingSocial.label}
            onChange={(e) => patchSocial(editingSocial.id, { label: e.target.value })}
          />
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-destructive"
          disabled={busy}
          onClick={() => removeSocial(editingSocial.id)}
        >
          이 SNS 삭제
        </Button>
      </div>
    ) : activeKey === "home.slides" ? (
      <>
        <HomeCmsSlotSelect />
        <Button
          type="button"
          className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={busy}
          onClick={() => galleryGridRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })}
        >
          배경 이미지 선택
        </Button>
        {slides.length > 0 ? (
          <ul className="space-y-0.5 text-[11px] text-muted-foreground">
            {slides.map((s) => (
              <li key={s.id} className="truncate font-mono" title={s.src}>
                {s.src}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-muted-foreground">선택된 전경 이미지가 없습니다.</p>
        )}
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
          <ul ref={galleryGridRef} className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
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
        const scaleField = KEY_TO_SCALE[activeKey];
        if (!field) return null;
        return (
          <>
            <HomeCmsSlotSelect />
            {scaleField ? (
              <>
                <CmsFontPick
                  value={heroTextFont[scaleField]}
                  disabled={busy}
                  onChange={(preset) => patchHeroFont(scaleField, preset)}
                />
                <CmsFontScale
                  value={heroTextScale[scaleField]}
                  disabled={busy}
                  onChange={(scale) => patchHeroScale(scaleField, scale)}
                />
                <CmsTextColor
                  value={heroTextColor[scaleField]}
                  disabled={busy}
                  onChange={(color) => patchHeroColor(scaleField, color)}
                />
              </>
            ) : null}
            <CmsFieldKo
              multiline={activeKey === "home.lead"}
              disabled={busy}
              maxLength={HOME_INTRO_HERO_COPY_LIMITS[field]}
              value={heroCopy[field]}
              onChange={(value) => patchHeroField(field, value)}
            />
          </>
        );
      })()
    ) : null;

  const panelHint =
    activeKey === "home.slides"
      ? "갤러리 썸네일을 눌러 순서대로 선택하세요. 또는 미리보기에서 「전경 슬라이드」·배경을 클릭합니다."
      : isHomeSocialSlotKey(activeKey ?? "")
        ? "SNS 아이콘은 우측 세로 막대입니다. + 로 추가, 아이콘 클릭으로 URL을 편집합니다."
        : activeKey
          ? "입력 즉시 왼쪽 미리보기에 반영됩니다. 한글만 저장하면 영·중은 공개 페이지에서 자동 처리됩니다."
          : undefined;

  const slotLabel =
    activeKey === "home.slides"
      ? HOME_CMS_SLOT_META["home.slides"].label
      : activeKey === HOME_SOCIAL_ADD_SLOT
        ? "SNS 아이콘 추가"
        : editingSocial
          ? `SNS · ${editingSocial.label}`
          : slotMeta?.label;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <p className="cms-orders-lead">
        실제 홈페이지(<code>/</code>)와 동일한 배치입니다. 오른쪽 패널에서 <strong>갤러리 사진</strong>을 고르거나
        전경·문구·<strong>우측 SNS</strong>를 클릭해 수정하세요. 영상·음악은{" "}
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
            <Button
              type="button"
              size="sm"
              variant={activeKey === "home.slides" ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setActiveKey("home.slides")}
            >
              전경 슬라이드·갤러리
            </Button>
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
          slotLabel={slotLabel}
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