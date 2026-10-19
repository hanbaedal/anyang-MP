"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ensureImageWithinMaxBytes } from "@/lib/compress-image-client";
import type { GalleryTag } from "@/lib/content";
import { GALLERY_TAGS, type GalleryPhoto } from "@/lib/gallery-types";
import { MANAGE_IMAGE_MAX_BYTES, MANAGE_IMAGE_MAX_MB } from "@/lib/image-upload-limits";
import { thumbUrl } from "@/lib/media";

const field =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function formatMb(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export function ManageGallery({ initial }: { initial: GalleryPhoto[] }) {
  const [items, setItems] = useState(initial);
  const [alt, setAlt] = useState("");
  const [tags, setTags] = useState<GalleryTag[]>(["일반"]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<"전체" | GalleryTag>("전체");
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
      setTags(["일반"]);
      pickFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("올렸습니다. 공개 갤러리와 홈페이지 관리(팝업·분양 사진)에서 바로 고를 수 있습니다.");
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
      body: JSON.stringify(item),
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

  const visible = filter === "전체" ? items : items.filter((item) => item.tags.includes(filter));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <form onSubmit={onUpload} className="space-y-3 rounded-xl border bg-card p-5">
        <h2 className="font-medium">사진 올리기</h2>
        <p className="text-sm text-muted-foreground">
          일반 사진은 「일반」 태그를 켜 두세요. 올린 사진은 공개 갤러리와 홈페이지 관리에서 함께 씁니다.
        </p>
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-md border bg-muted">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center px-2 text-center text-[11px] leading-tight text-muted-foreground">
                선택한 파일
                <br />
                미리보기
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
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
              <p className="truncate text-xs text-muted-foreground">
                {file.name} · {formatMb(file.size)}MB
              </p>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              JPG · PNG · WebP · GIF · {MANAGE_IMAGE_MAX_MB}MB 이하 (초과 시 자동 압축)
            </p>
          </div>
        </div>
        <input
          className={field}
          placeholder="설명 (갤러리·관리 화면 제목)"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 text-sm">
          {GALLERY_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-1">
              <input type="checkbox" checked={tags.includes(tag)} onChange={() => setTags(toggleTag(tags, tag))} />
              {tag}
            </label>
          ))}
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "올리는 중…" : "올리기"}
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">등록된 사진 ({items.length})</h2>
          <div className="flex flex-wrap gap-1.5">
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <li key={item.id} className="space-y-2 rounded-xl border bg-card p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbUrl(item.src)} alt={item.alt} className="aspect-[4/3] w-full rounded-md object-cover" />
              <input
                className={field}
                value={item.alt}
                onChange={(e) => setItems(items.map((row) => (row.id === item.id ? { ...row, alt: e.target.value } : row)))}
              />
              <div className="flex flex-wrap gap-2 text-xs">
                {GALLERY_TAGS.map((tag) => (
                  <label key={tag} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={item.tags.includes(tag)}
                      onChange={() =>
                        setItems(items.map((row) => (row.id === item.id ? { ...row, tags: toggleTag(row.tags, tag) } : row)))
                      }
                    />
                    {tag}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" disabled={busy} onClick={() => void onSave(item)}>
                  저장
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void onDelete(item.id)}>
                  삭제
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {visible.length === 0 ? <p className="text-sm text-muted-foreground">이 태그에 사진이 없습니다.</p> : null}
      </div>
    </div>
  );
}
