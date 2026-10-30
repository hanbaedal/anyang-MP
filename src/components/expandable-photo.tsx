"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { uploadOriginalUrl } from "@/lib/media";
import { ImageLightboxDialog } from "@/components/image-lightbox-dialog";

export function ExpandablePhoto({
  src,
  alt,
  className,
  priority,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [open, setOpen] = useState(false);

  const preloadOriginal = useCallback(() => {
    if (typeof window === "undefined") return;
    const img = new window.Image();
    img.src = uploadOriginalUrl(src);
  }, [src]);

  return (
    <>
      <button
        type="button"
        className={cn(
          "relative block w-full cursor-zoom-in overflow-hidden rounded-xl bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          className,
        )}
        onClick={() => setOpen(true)}
        onMouseEnter={preloadOriginal}
        onFocus={preloadOriginal}
        aria-label={alt ? `${alt} 원본 보기` : "사진 원본 보기"}
      >
        <Image
          src={uploadOriginalUrl(src)}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
          quality={90}
          unoptimized
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      </button>
      <ImageLightboxDialog open={open} onOpenChange={setOpen} src={src} alt={alt} />
    </>
  );
}
