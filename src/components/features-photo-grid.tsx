import Image from "next/image";
import { Paragraphs } from "@/components/paragraphs";
import { uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export type FeaturePhotoItem = {
  id?: string;
  title: string;
  text?: string;
  image?: string;
};

/** CMS·복사본에 남을 수 있는 「모억」오기를 「묘역」으로 통일 */
export function normalizeFeatureCopy(text: string) {
  return text.replaceAll("모억", "묘역");
}

/**
 * 공원 특징 2×2 — 풀블리드 사진 + 좌측 흰 글씨 오버레이.
 * 고정 높이로 자르지 않고 min-height만 두어 본문이 잘리지 않게 함.
 */
export function FeaturesPhotoGrid({
  items,
  className,
}: {
  items: FeaturePhotoItem[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <div className={cn("grid gap-4 sm:gap-5 md:grid-cols-2", className)}>
      {items.map((item, index) => {
        const title = normalizeFeatureCopy(item.title);
        const text = item.text ? normalizeFeatureCopy(item.text) : "";
        const src = item.image?.trim() ? uploadOriginalUrl(item.image) : "";

        return (
          <article
            key={item.id || item.title || String(index)}
            className="pc-viewport-card relative isolate min-h-[15.5rem] overflow-hidden rounded-2xl shadow-sm sm:min-h-[17rem] md:min-h-[18.5rem]"
          >
            {src ? (
              <Image
                src={src}
                alt={title}
                fill
                className="object-cover object-center"
                sizes="(max-width: 767px) 100vw, 50vw"
                priority={index < 2}
                unoptimized={src.includes("/api/uploads/")}
              />
            ) : (
              <div className="absolute inset-0 bg-[#002b50]/60" aria-hidden />
            )}
            {/* 좌측 가독성 — 안양 남색 계열, 보라 없음 */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-[#001a33]/78 via-[#001a33]/45 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 w-[78%] max-w-lg bg-gradient-to-r from-black/35 to-transparent" aria-hidden />

            <div className="pc-viewport-card-body relative z-10 flex min-h-[15.5rem] flex-col justify-center gap-2.5 p-5 sm:min-h-[17rem] sm:p-6 md:min-h-[18.5rem] md:max-w-[85%] md:p-7">
              <h3 className="text-lg font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] sm:text-xl md:text-[1.35rem]">
                {title}
              </h3>
              {text ? (
                <div className="space-y-1.5 text-[13px] leading-6 text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] sm:text-sm sm:leading-7">
                  <Paragraphs text={text} className="text-inherit" />
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
