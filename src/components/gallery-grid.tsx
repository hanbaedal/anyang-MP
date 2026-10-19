"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { GALLERY, type GalleryItem, type GalleryTag } from "@/lib/content";
import { mediaUrl, thumbUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { GallerySlideModal } from "@/components/gallery-slide-modal";
import { ImageLightboxDialog } from "@/components/image-lightbox-dialog";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const TAGS: Array<{ value: "전체" | GalleryTag; key: string }> = [
  { value: "전체", key: "gallery.all" },
  { value: "일반", key: "gallery.tag.general" },
  { value: "전경", key: "gallery.tag.view" },
  { value: "매장묘", key: "gallery.tag.burial" },
  { value: "평장묘", key: "gallery.tag.lawn" },
  { value: "봉안묘", key: "gallery.tag.columbarium" },
  { value: "리모델링", key: "gallery.tag.remodel" },
];

function openPreview(src: string) {
  const img = new window.Image();
  img.src = mediaUrl(src);
}

export function GalleryGrid({ preview, items = GALLERY }: { preview?: number; items?: GalleryItem[] }) {
  const t = useT();
  const [tag, setTag] = useState<(typeof TAGS)[number]["value"]>("전체");
  const [open, setOpen] = useState<string | null>(null);
  const [listIndex, setListIndex] = useState<number | null>(null);

  const itemsFiltered = useMemo(() => {
    const filtered = tag === "전체" ? items : items.filter((item) => item.tags.includes(tag));
    return typeof preview === "number" ? filtered.slice(0, preview) : filtered;
  }, [tag, preview, items]);

  const tickerItems = useMemo(() => {
    if (itemsFiltered.length === 0) return [];
    // PC 1.5×(~2칸)·모바일 기존 크기에 맞춰 패딩 후 2배 복제 → translateX(-50%) 루프
    let base = [...itemsFiltered];
    while (base.length < 3) base = base.concat(itemsFiltered);
    return [...base, ...base];
  }, [itemsFiltered]);

  const current = items.find((item) => item.src === open);
  const durationSec = Math.max(60, itemsFiltered.length * 10);

  if (preview) {
    return (
      <div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {itemsFiltered.map((item) => (
            <li key={item.src}>
              <button
                type="button"
                className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted"
                onClick={() => setOpen(item.src)}
                onMouseEnter={() => openPreview(item.src)}
              >
                <Image src={thumbUrl(item.src)} alt={item.alt} fill className="object-cover" sizes="33vw" />
              </button>
              <p className="mt-2 text-sm text-muted-foreground">{item.alt}</p>
            </li>
          ))}
        </ul>
        {current ? (
          <ImageLightboxDialog open={Boolean(open)} onOpenChange={(next) => !next && setOpen(null)} src={current.src} alt={current.alt} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-full min-w-0 space-y-8">
      {itemsFiltered.length > 0 ? (
        <section
          aria-label={t("gallery.title")}
          className="max-w-full overflow-hidden rounded-2xl border border-[#ead7b4] bg-[#f8eedd] p-3"
        >
          <div className="gallery-marquee">
            <div
              className="gallery-marquee-track gap-3"
              style={{ animationDuration: `${durationSec}s` }}
            >
              {tickerItems.map((item, index) => (
                <button
                  key={`${item.src}-${index}`}
                  type="button"
                  className="gallery-marquee-card"
                  onClick={() => setOpen(item.src)}
                  onMouseEnter={() => openPreview(item.src)}
                  aria-label={item.alt}
                >
                  <Image
                    src={thumbUrl(item.src)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 50vw"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="max-w-full min-w-0">
        <div
          role="tablist"
          aria-label={t("gallery.title")}
          className="flex w-full max-w-full min-w-0 flex-nowrap gap-1 overflow-x-auto overscroll-x-contain touch-pan-x pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:gap-2 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {TAGS.map((item) => (
            <Button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tag === item.value}
              size="xs"
              variant={tag === item.value ? "default" : "outline"}
              className="h-6 shrink-0 px-1.5 text-[11px] leading-none md:h-8 md:px-3 md:text-sm"
              onClick={() => setTag(item.value)}
            >
              {t(item.key)}
            </Button>
          ))}
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {itemsFiltered.map((item, index) => (
          <li key={item.src}>
            <button
              type="button"
              className={cn(
                "flex h-full w-full items-stretch gap-3 rounded-xl border border-[#ead7b4] bg-[#fffcf7] p-3 text-left transition-colors sm:gap-4",
                "hover:border-[#d4c08a] hover:bg-[#f8eedd]/60",
              )}
              onClick={() => setListIndex(index)}
              onMouseEnter={() => openPreview(item.src)}
            >
              <span className="relative h-[4.75rem] w-[6.5rem] shrink-0 overflow-hidden rounded-lg bg-muted sm:h-[5.5rem] sm:w-[7.5rem]">
                <Image src={thumbUrl(item.src)} alt="" fill className="object-cover" sizes="120px" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
                <span className="font-medium text-foreground">{item.alt}</span>
                <span className="text-sm text-muted-foreground">{item.tags.join(" · ")}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {itemsFiltered.length === 0 ? <p className="text-sm text-muted-foreground">{t("gallery.empty")}</p> : null}
      {current ? (
        <ImageLightboxDialog open={Boolean(open)} onOpenChange={(next) => !next && setOpen(null)} src={current.src} alt={current.alt} />
      ) : null}
      {listIndex !== null ? (
        <GallerySlideModal
          open={listIndex !== null}
          onOpenChange={(next) => {
            if (!next) setListIndex(null);
          }}
          items={itemsFiltered}
          index={Math.min(listIndex, Math.max(0, itemsFiltered.length - 1))}
          onIndexChange={setListIndex}
        />
      ) : null}
    </div>
  );
}
