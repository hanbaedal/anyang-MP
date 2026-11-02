"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ManageGalleryLibrary } from "@/components/manage-gallery-library";
import type { GalleryPhoto } from "@/lib/gallery-types";
import { thumbUrl } from "@/lib/media";

export function ManageImagePicker({
  src,
  disabled,
  label = "이미지 선택",
  onFile,
  onPickSrc,
  enableLibrary = false,
  /** true면 파일 업로드 없이 갤러리에서만 고름 */
  libraryOnly = false,
}: {
  src: string;
  disabled?: boolean;
  label?: string;
  onFile?: (file: File) => void | Promise<void>;
  /** 갤러리에서 고른 src. 있으면 홈페이지 관리에서 재사용 가능 */
  onPickSrc?: (src: string, photo?: GalleryPhoto) => void;
  enableLibrary?: boolean;
  libraryOnly?: boolean;
}) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  useEffect(() => {
    if (!src) return;
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [src]);

  const preview = localPreview || (src ? thumbUrl(src) : "");

  return (
    <div className="flex gap-3">
      <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-md border bg-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center text-[11px] leading-tight text-muted-foreground">
            선택한 이미지
            <br />
            미리보기
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex flex-wrap gap-1.5">
          {!libraryOnly && onFile ? (
            <Button type="button" variant="outline" size="sm" className="w-fit" disabled={disabled} asChild>
              <label className="cursor-pointer">
                {src || localPreview ? "다른 파일" : label}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  disabled={disabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setLocalPreview((prev) => {
                      if (prev) URL.revokeObjectURL(prev);
                      return URL.createObjectURL(file);
                    });
                    void onFile(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
          ) : null}
          {(enableLibrary || libraryOnly) && onPickSrc ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={disabled}
              onClick={() => setLibraryOpen(true)}
            >
              {libraryOnly && (src || localPreview) ? "다른 사진 고르기" : libraryOnly ? label || "갤러리에서 고르기" : "갤러리에서 고르기"}
            </Button>
          ) : null}
        </div>
        {src ? <p className="truncate text-[10px] text-muted-foreground">{src}</p> : null}
        {enableLibrary || libraryOnly ? (
          <p className="text-[10px] text-muted-foreground">
            {libraryOnly
              ? "갤러리에 등록된 사진을 골라 연결합니다. 새 파일 업로드는 없습니다."
              : "갤러리에 「일반」으로 올린 사진을 그대로 쓸 수 있습니다."}
          </p>
        ) : null}
      </div>
      {(enableLibrary || libraryOnly) && onPickSrc ? (
        <ManageGalleryLibrary
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          onPick={(photo) => {
            setLocalPreview((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return null;
            });
            onPickSrc(photo.src, photo);
          }}
        />
      ) : null}
    </div>
  );
}
