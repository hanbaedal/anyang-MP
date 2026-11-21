"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GALLERY_MANAGE_UI_TAGS, type GalleryPhoto } from "@/lib/gallery-types";
import type { GalleryTag } from "@/lib/content";
import { thumbUrl } from "@/lib/media";

type Filter = "전체" | GalleryTag;

export function ManageGalleryLibrary({
  open,
  onOpenChange,
  onPick,
  preferTag = "일반",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (photo: GalleryPhoto) => void;
  preferTag?: GalleryTag;
}) {
  const [items, setItems] = useState<GalleryPhoto[]>([]);
  const [filter, setFilter] = useState<Filter>(preferTag);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/manage/gallery");
      const json = (await res.json()) as { ok?: boolean; items?: GalleryPhoto[]; error?: string };
      if (!res.ok || !json.items) {
        setError(json.error || "갤러리 사진을 불러오지 못했습니다.");
        return;
      }
      setItems(json.items);
    } catch {
      setError("네트워크 오류입니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setFilter(preferTag);
    void load();
  }, [open, preferTag, load]);

  const visible =
    filter === "전체" ? items : items.filter((item) => item.tags.includes(filter));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>갤러리에서 고르기</DialogTitle>
          <DialogDescription>
            갤러리에 올린 사진을 홈페이지 관리에서도 그대로 씁니다. 「일반」 태그를 먼저 보여 줍니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-1.5">
          {(["전체", ...GALLERY_MANAGE_UI_TAGS] as Filter[]).map((tag) => (
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
        {loading ? <p className="text-sm text-muted-foreground">불러오는 중…</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!loading && !error && visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            이 태그에 사진이 없습니다. 갤러리 관리에서 「일반」으로 먼저 올려 주세요.
          </p>
        ) : null}
        <ul className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full space-y-1 rounded-lg border bg-card p-2 text-left transition hover:border-primary hover:bg-accent"
                onClick={() => {
                  onPick(item);
                  onOpenChange(false);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbUrl(item.src)} alt={item.alt} className="aspect-[4/3] w-full rounded-md object-cover" />
                <p className="truncate text-xs font-medium">{item.alt}</p>
                <p className="truncate text-[10px] text-muted-foreground">{item.tags.join(" · ")}</p>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
