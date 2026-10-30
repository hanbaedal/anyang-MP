"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

const shellClassName =
  "fixed inset-0 z-50 !top-0 !left-0 flex h-[100dvh] w-screen max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden border-0 bg-black/92 p-0 shadow-none sm:max-w-none [&_[data-slot=dialog-overlay]]:bg-black/92 [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:z-10 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-white/20";

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
      <DialogContent className={shellClassName} showCloseButton>
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <figure className="relative min-h-0 flex-1">
          {!loaded ? (
            <p className="absolute inset-0 z-[1] flex items-center justify-center text-sm text-white/70" aria-live="polite">
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
            sizes="100vw"
            onLoad={() => setLoaded(true)}
            className={cn(
              "object-contain p-1 sm:p-2 transition-opacity duration-200",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
          {alt ? (
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-3 z-[1] px-12 text-center text-sm text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              {alt}
            </figcaption>
          ) : null}
        </figure>
      </DialogContent>
    </Dialog>
  );
}
