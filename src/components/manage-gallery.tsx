"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecadePager } from "@/components/decade-pager";
import { GallerySlideModal } from "@/components/gallery-slide-modal";
import { ensureImageWithinMaxBytes } from "@/lib/compress-image-client";
import type { GalleryTag } from "@/lib/content";
import { GALLERY_TAGS, type GalleryPhoto } from "@/lib/gallery-types";
import type { GalleryPageSettings } from "@/lib/gallery-page";
import { ManageImagePicker } from "@/components/manage-image-picker";
import { MANAGE_IMAGE_MAX_BYTES, MANAGE_IMAGE_MAX_MB } from "@/lib/image-upload-limits";
import { thumbUrl, uploadOriginalUrl } from "@/lib/media";

const field =
  "h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const area =
  "min-h-20 w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function formatMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

const STRIP_SIZE = 5;

export function ManageGallery({
  initial,
  initialPage,
}: {
  initial: GalleryPhoto[];
  initialPage: GalleryPageSettings;
}) {
  const [items, setItems] = useState(initial);
  const [heroImage, setHeroImage] = useState(initialPage.heroImage);
  const [pageBusy, setPageBusy] = useState(false);
  const [alt, setAlt] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<GalleryTag[]>(["일반"]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"전체" | GalleryTag>("전체");
  const [viewIndex, setViewIndex] = useState(0);
  const [stripStart, setStripStart] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function refresh() {
    const res = await fetch("/api/manage/gallery");
    const json = (await res.json()) as { items?: GalleryPhoto[] };
    if (json.items) setItems(json.items);
  }

  async function saveGalleryHero() {
    setPageBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/manage/gallery-page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroImage }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; settings?: GalleryPageSettings };
      if (!res.ok || !json.ok || !json.settings) {
        setMessage(json.error || "배너 저장에 실패했습니다.");
        return;
      }
      setHeroImage(json.settings.heroImage);
      setMessage("갤러리 상단 배너 배경을 저장했습니다.");
    } catch {
      setMessage("네트워크 오류입니다.");
    } finally {
      setPageBusy(false);
    }
  }

  function pickFile(next: File | null) {
    setFile(next);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next ? URL.createObjectURL(next) : null;
    });
  }

  async function onPickFile(next: File | null) {
    if (!next) {
      pickFile(null);
      setMessage("");
      return;
    }

    setBusy(true);
    if (next.size > MANAGE_IMAGE_MAX_BYTES) {
      setMessage(`${formatMb(next.size)}MB 파일이라 ${MANAGE_IMAGE_MAX_MB}MB 이하로 압축하는 중…`);
    } else {
      setMessage("");
    }

    try {
      const result = await ensureImageWithinMaxBytes(next);
      pickFile(result.file);
      if (result.compressed) {
        setMessage(
          `용량이 커서 ${formatMb(next.size)}MB → ${formatMb(result.file.size)}MB로 줄였습니다. 그대로 올려 주세요.`,
        );
      } else {
        setMessage("");
      }
    } catch (error) {
      pickFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage(error instanceof Error ? error.message : "이미지 압축에 실패했습니다. 다른 파일을 선택해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setMessage("사진 파일을 선택해 주세요.");
      return;
    }
    setBusy(true);
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    form.set("alt", alt);
    form.set("description", description);
    form.set("tags", tags.join(","));
    try {
      const res = await fetch("/api/manage/gallery", { method: "POST", body: form });
      let json: { ok?: boolean; error?: string } = {};
      try {
        json = (await res.json()) as { ok?: boolean; error?: string };
      } catch {
        setMessage("서버 응답을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      if (!res.ok || !json.ok) {
        setMessage(json.error || "업로드에 실패했습니다.");
        return;
      }
      setAlt("");
      setDescription("");
      setTags(["일반"]);
      pickFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage(
        "올렸습니다. 분류(매장묘·평장묘·봉안묘) 태그가 분양안내 사진에 바로 반영됩니다.",
      );
      await refresh();
    } catch {
      setMessage("네트워크 오류로 올리지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function onSave(item: GalleryPhoto) {
    setBusy(true);
    await fetch("/api/manage/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        alt: item.alt,
        description: item.description ?? "",
        tags: item.tags,
      }),
    });
    await refresh();
    setBusy(false);
  }

  async function onDelete(id: string) {
    if (!confirm("이 사진을 지울까요?")) return;
    setBusy(true);
    await fetch(`/api/manage/gallery?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await refresh();
    setBusy(false);
  }

  function toggleTag(current: GalleryTag[], tag: GalleryTag) {
    return current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag];
  }

  function patchItem(id: string, patch: Partial<GalleryPhoto>) {
    setItems((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  const visible = filter === "전체" ? items : items.filter((item) => item.tags.includes(filter));
  const total = visible.length;
  const safeIndex = total ? Math.min(viewIndex, total - 1) : 0;
  const current = total ? visible[safeIndex] : null;

  useEffect(() => {
    setViewIndex(0);
    setStripStart(0);
  }, [filter]);

  useEffect(() => {
    if (viewIndex >= total && total > 0) setViewIndex(total - 1);
  }, [total, viewIndex]);

  useEffect(() => {
    setStripStart((start) => {
      if (safeIndex < start || safeIndex >= start + STRIP_SIZE) {
        return Math.floor(safeIndex / STRIP_SIZE) * STRIP_SIZE;
      }
      return start;
    });
  }, [safeIndex]);

  const maxStripStart = total > STRIP_SIZE ? total - STRIP_SIZE : 0;
  const stripItems = visible.slice(stripStart, stripStart + STRIP_SIZE);
  const canStripPrev = stripStart > 0;
  const canStripNext = stripStart < maxStripStart;

  function openModalAt(index: number) {
    setViewIndex(index);
    setModalOpen(true);
  }

  function stripPrev() {
    setStripStart((s) => Math.max(0, s - STRIP_SIZE));
  }

  function stripNext() {
    setStripStart((s) => Math.min(maxStripStart, s + STRIP_SIZE));
  }

  function downloadFilename(item: GalleryPhoto, url: string) {
    const extMatch = url.split("?")[0]?.match(/\.(jpe?g|png|webp|gif)$/i);
    const ext = extMatch ? extMatch[1]!.toLowerCase().replace("jpeg", "jpg") : "jpg";
    const base = (item.alt || `gallery-${item.id}`).replace(/[\\/:*?"<>|]/g, "_").trim() || item.id;
    return `${base}.${ext}`;
  }

  async function onDownload(item: GalleryPhoto) {
    const url = uploadOriginalUrl(item.src);
    const filename = downloadFilename(item, url);
    try {
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  function itemEditor(item: GalleryPhoto) {
    return (
      <>
        <input
          className={field}
          placeholder="제목"
          value={item.alt}
          onChange={(e) => patchItem(item.id, { alt: e.target.value })}
        />
        <textarea
          className={area}
          placeholder="설명 (분양안내 카드 본문)"
          value={item.description ?? ""}
          onChange={(e) => patchItem(item.id, { description: e.target.value })}
        />
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
          {GALLERY_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={item.tags.includes(tag)}
                onChange={() => patchItem(item.id, { tags: toggleTag(item.tags, tag) })}
              />
              {tag}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={busy} onClick={() => void onSave(item)}>
            저장
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void onDelete(item.id)}>
            삭제
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void onDownload(item)}>
            다운로드
          </Button>
        </div>
      </>
    );
  }

  const filterBar = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-medium">등록된 사진 ({items.length})</h2>
      <div className="flex max-w-full flex-wrap gap-1.5">
        {(["전체", ...GALLERY_TAGS] as Array<"전체" | GalleryTag>).map((tag) => (
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
    </div>
  );

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-8 overflow-x-hidden px-4 py-8 md:py-10">
      <div className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-medium">갤러리 페이지 상단 배너 배경</h2>
        <p className="text-sm text-muted-foreground">
          공개 갤러리(<code>/gallery</code>) 헤더 아래 배경입니다. 제목·요약은 다국어 기본 문구를 사용합니다.
        </p>
        <ManageImagePicker
          src={heroImage}
          disabled={pageBusy || busy}
          enableLibrary
          label="배너 배경"
          onPickSrc={(src) => {
            setHeroImage(src);
            setMessage("배경을 골랐습니다. 「배너 저장」을 눌러 반영하세요.");
          }}
          onFile={async (file) => {
            setPageBusy(true);
            const form = new FormData();
            form.set("file", file);
            try {
              const res = await fetch("/api/manage/upload-image", { method: "POST", body: form });
              const json = (await res.json()) as { src?: string; error?: string };
              if (json.src) {
                setHeroImage(json.src);
                setMessage("배경을 올렸습니다. 「배너 저장」을 눌러 반영하세요.");
              } else {
                setMessage(json.error || "업로드 실패");
              }
            } finally {
              setPageBusy(false);
            }
          }}
        />
        <Button type="button" disabled={pageBusy || busy} onClick={() => void saveGalleryHero()}>
          {pageBusy ? "저장 중…" : "배너 저장"}
        </Button>
      </div>
      {/* 1. 사진 올리기 */}
      <form
        onSubmit={onUpload}
        className="rounded-xl border bg-card p-4 sm:p-5 md:grid md:grid-cols-2 md:items-start md:gap-x-8 md:gap-y-3"
      >
        <h2 className="font-medium md:col-span-2">사진 올리기</h2>

        {/* PC·노트북: 좌 미리보기 / 우 입력·버튼 — 모바일: 세로 순서 유지 */}
        <div className="mt-3 min-w-0 space-y-2 md:mt-0">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[16rem] overflow-hidden rounded-md border bg-muted sm:max-w-xs md:mx-0 md:max-w-none">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-contain object-center" />
            ) : (
              <span className="flex h-full items-center justify-center px-2 text-center text-[11px] leading-tight text-muted-foreground">
                선택한 파일
                <br />
                미리보기
              </span>
            )}
          </div>
          <p className="text-center text-[11px] text-muted-foreground md:text-left">
            JPG · PNG · WebP · GIF · {MANAGE_IMAGE_MAX_MB}MB 이하 (초과 시 자동 압축)
          </p>
        </div>

        <div className="mt-3 min-w-0 space-y-2 md:mt-0">
          <input
            className={field}
            placeholder="제목 (갤러리·분양안내 카드 제목)"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
          <textarea
            className={`${area} md:min-h-16`}
            placeholder="설명 (분양안내 카드 본문·캡션, Enter=줄바꿈)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {GALLERY_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-1">
                <input type="checkbox" checked={tags.includes(tag)} onChange={() => setTags(toggleTag(tags, tag))} />
                {tag}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" className="w-fit" asChild>
              <label className={`cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
                {file ? "다른 파일 선택" : "파일 선택"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </Button>
            {file ? (
              <p className="min-w-0 truncate text-xs text-muted-foreground">
                {file.name}
                <span className="hidden sm:inline"> · {formatMb(file.size)}MB</span>
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={busy} className="w-full sm:w-fit">
            {busy ? "올리는 중…" : "올리기"}
          </Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
      </form>

      {/* 2. 등록된 사진 */}
      <div className="min-w-0 space-y-4">
        {filterBar}

        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">이 태그에 사진이 없습니다.</p>
        ) : (
          <>
            {/* PC·노트북: 5장 스트립 + 번호 줄 · 클릭 시 풀페이지 모달 */}
            <section className="hidden min-w-0 space-y-3 md:block" aria-label="등록된 사진 미리보기">
              <p className="text-center text-sm text-muted-foreground">
                {safeIndex + 1} / {total}
                {current?.alt ? ` · ${current.alt}` : ""}
                <span className="hidden lg:inline"> · 사진을 클릭하면 크게 볼 수 있습니다</span>
              </p>
              <div className="relative w-full max-w-full overflow-hidden rounded-xl border border-[#ead7b4] bg-[#f8eedd] p-2">
                <div className="relative grid grid-cols-5 gap-2">
                  {stripItems.map((item, i) => {
                    const itemIndex = stripStart + i;
                    const selected = itemIndex === safeIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`relative aspect-[4/3] w-full min-w-0 overflow-hidden rounded-lg bg-[#ead7b4]/40 ring-offset-2 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          selected ? "ring-2 ring-primary" : "ring-1 ring-[#ead7b4]"
                        }`}
                        aria-label={`${itemIndex + 1}번 사진 크게 보기`}
                        aria-current={selected ? "true" : undefined}
                        onClick={() => openModalAt(itemIndex)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbUrl(item.src)}
                          alt={item.alt}
                          className="h-full w-full object-cover object-center"
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {itemIndex + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {total > STRIP_SIZE ? (
                  <>
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 z-[1] flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md ring-1 ring-white/35 hover:bg-black/60 disabled:pointer-events-none disabled:opacity-30"
                      aria-label="이전 5장"
                      disabled={!canStripPrev}
                      onClick={stripPrev}
                    >
                      <ChevronLeft className="size-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 z-[1] flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-md ring-1 ring-white/35 hover:bg-black/60 disabled:pointer-events-none disabled:opacity-30"
                      aria-label="다음 5장"
                      disabled={!canStripNext}
                      onClick={stripNext}
                    >
                      <ChevronRight className="size-5" aria-hidden />
                    </button>
                  </>
                ) : null}
              </div>

              <DecadePager
                total={total}
                index={safeIndex}
                onGo={setViewIndex}
                itemLabel={(n) => `${n}번 사진`}
                label="등록된 사진"
              />

              {current ? (
                <div className="space-y-2 rounded-xl border bg-card p-4">{itemEditor(current)}</div>
              ) : null}

              <GallerySlideModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                items={visible.map((item) => ({ src: item.src, alt: item.alt }))}
                index={safeIndex}
                onIndexChange={setViewIndex}
                fullPage
                imageFit="contain"
              />
            </section>

            {/* 모바일: 기존 카드 격자 */}
            <ul className="grid gap-4 sm:grid-cols-2 md:hidden">
              {visible.map((item) => (
                <li key={item.id} className="min-w-0 space-y-2 rounded-xl border bg-card p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl(item.src)} alt={item.alt} className="aspect-[4/3] w-full rounded-md object-cover" />
                  {itemEditor(item)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}