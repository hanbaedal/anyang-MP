"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SITE_MEDIA_MODAL_SHELL, SITE_MEDIA_MODAL_VIEWPORT } from "@/lib/site-media-modal";
import { uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function ImageLightboxDialog({
  open,
  onOpenChange,
  src,
  alt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) setLoaded(false);
  }, [open, src]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SITE_MEDIA_MODAL_SHELL} showCloseButton>
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <figure className={cn(SITE_MEDIA_MODAL_VIEWPORT, "bg-black/30")}>
          {!loaded ? (
            <p
              className="absolute inset-0 z-[1] flex items-center justify-center text-sm text-white/70"
              aria-live="polite"
            >
              원본 불러오는 중…
            </p>
          ) : null}
          <Image
            key={src}
            src={uploadOriginalUrl(src)}
            alt={alt}
            fill
            quality={90}
            unoptimized
            priority
            sizes="(max-width: 1136px) 100vw, 1136px"
            onLoad={() => setLoaded(true)}
            className={cn(
              "guest-photo-bright object-contain p-1 sm:p-2 transition-opacity duration-200",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
          {alt ? (
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-2 z-[1] px-10 text-center text-sm text-white/90">
              {alt}
            </figcaption>
          ) : null}
        </figure>
      </DialogContent>
    </Dialog>
  );
}