"use client";

import { Button } from "@/components/ui/button";
import { ManageImagePicker } from "@/components/manage-image-picker";
import type { CmsItem, CmsSlug } from "@/lib/cms-types";
import { CMS_GALLERY_LINK_ITEM_SLUGS } from "@/lib/cms-types";

const field =
  "h-9 w-full rounded-md border border-dashed border-input bg-[#fffcf7]/90 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const area =
  "min-h-24 w-full rounded-md border border-dashed border-input bg-[#fffcf7]/90 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ManageCmsItemEditor({
  slug,
  item,
  index,
  busy,
  directionsPage,
  onPatch,
  onMessage,
}: {
  slug: CmsSlug;
  item: CmsItem;
  index: number;
  busy: boolean;
  directionsPage?: boolean;
  onPatch: (patch: Partial<CmsItem>) => void;
  onMessage: (msg: string) => void;
}) {
  const galleryLink = CMS_GALLERY_LINK_ITEM_SLUGS.includes(slug);

  return (
    <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/[0.04] p-3">
      <p className="text-[11px] font-medium text-primary">편집 · {directionsPage ? `교통 ${index + 1}` : `항목 ${index + 1}`}</p>
      {!directionsPage ? (
        <input
          className={field}
          placeholder="제목"
          value={item.title}
          disabled={busy}
          onChange={(e) => onPatch({ title: e.target.value })}
        />
      ) : (
        <p className="text-xs text-muted-foreground">공개에는 카드 제목 없음 · 내용만 표시</p>
      )}
      <textarea
        className={area}
        placeholder={directionsPage ? "설명 (전체 표시)" : "설명 (Enter=줄바꿈, 빈 줄=문단)"}
        value={item.text ?? ""}
        disabled={busy}
        onChange={(e) => onPatch({ text: e.target.value })}
      />
      {galleryLink ? (
        <div className="space-y-2">
          <ManageImagePicker
            src={item.image ?? ""}
            disabled={busy}
            libraryOnly
            label="갤러리에서 사진 연결"
            onPickSrc={(src, photo) => {
              onPatch({ image: src, galleryId: photo?.id ?? "" });
              onMessage("사진을 연결했습니다. 저장을 눌러 반영하세요.");
            }}
          />
          {item.image || item.galleryId ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                onPatch({ image: "", galleryId: "" });
                onMessage("사진 연결을 해제했습니다.");
              }}
            >
              연결 해제
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}