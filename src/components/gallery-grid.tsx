"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { GALLERY, type GalleryItem, type GalleryTag } from "@/lib/content";
import { mediaUrl, thumbUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { ImageLightboxDialog } from "@/components/image-lightbox-dialog";
import { useT } from "@/components/locale-provider";

const TAGS: Array<{ value: "전체" | GalleryTag; key: string }> = [
  { value: "전체", key: "gallery.all" },
  { value: "일반", key: "gallery.tag.general" },
  { value: "전경", key: "gallery.tag.view" },
  { value: "매장묘", key: "gallery.tag.burial" },
  { value: "평장묘", key: "gallery.tag.lawn" },
  { value: "봉안묘", key: "gallery.tag.columbarium" },
  { value: "리모델링", key: "gallery.tag.remodel" },
];

export function GalleryGrid({ preview, items = GALLERY }: { preview?: number; items?: GalleryItem[] }) {
  const t = useT();
  const [tag, setTag] = useState<(typeof TAGS)[number]["value"]>("전체");
  const [open, setOpen] = useState<string | null>(null);

  const itemsFiltered = useMemo(() => {
    const filtered = tag === "전체" ? items : items.filter((item) => item.tags.includes(tag));
    return typeof preview === "number" ? filtered.slice(0, preview) : filtered;
  }, [tag, preview, items]);

  const current = items.find((item) => item.src === open);

  return (
    <div>
      {preview ? null : (
        <div className="mb-6 flex flex-wrap gap-2">
          {TAGS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={tag === item.value ? "default" : "outline"}
              onClick={() => setTag(item.value)}
            >
              {t(item.key)}
            </Button>
          ))}
        </div>
      )}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {itemsFiltered.map((item) => (
          <li key={item.src}>
            <button
              type="button"
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted"
              onClick={() => setOpen(item.src)}
              onMouseEnter={() => {
                const img = new window.Image();
                img.src = mediaUrl(item.src);
              }}
            >
              <Image
                src={thumbUrl(item.src)}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, (max-width: 1536px) 20vw, 16vw"
              />
            </button>
            <p className="mt-2 text-sm text-muted-foreground">{item.alt}</p>
          </li>
        ))}
      </ul>
      {itemsFiltered.length === 0 ? <p className="text-sm text-muted-foreground">{t("gallery.empty")}</p> : null}
      {current ? (
        <ImageLightboxDialog open={Boolean(open)} onOpenChange={(next) => !next && setOpen(null)} src={current.src} alt={current.alt} />
      ) : null}
    </div>
  );
}
