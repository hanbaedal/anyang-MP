import Image from "next/image";
import { isUploadMediaPath, uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/** 안내 카드 배경 — 업로드·절대 URL은 `<img>`로 Next Image 호스트 검증 오류 방지 */
export function GuideCardCoverImage({
  imagePath,
  alt,
  index,
  dense,
  className,
}: {
  imagePath: string;
  alt: string;
  index: number;
  dense?: boolean;
  className?: string;
}) {
  const resolved = uploadOriginalUrl(imagePath.trim());
  if (!resolved?.trim()) return null;

  const skipOptimizer =
    isUploadMediaPath(imagePath) || /^https?:\/\//i.test(resolved) || resolved.includes("/api/uploads/");

  if (skipOptimizer) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- GridFS·자기 도메인 절대 URL
      <img
        src={resolved}
        alt={alt}
        className={cn("absolute inset-0 h-full w-full object-cover object-center", className)}
        loading={index < 2 ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      className={cn("object-cover object-center", className)}
      sizes={dense ? "(max-width: 767px) 100vw, 33vw" : "(max-width: 767px) 100vw, 50vw"}
      priority={index < 2}
    />
  );
}