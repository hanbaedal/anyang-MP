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
 * 본문 **첫 줄 전체** (빈 줄 건너뜀). 중간 글자 자르기 없음.
 * 비어 있으면 "" → 공개에서 문구 생략.
 */
export function firstBodyLine(text: string) {
  return (
    text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? ""
  );
}

/**
 * 공원 특징 2×2 — 풀블리드 사진 + 좌측 흰 글씨 오버레이.
 * 고정 높이로 자르지 않고 min-height만 두어 본문이 잘리지 않게 함.
 */
export function FeaturesPhotoGrid({
  items,
  className,
  dense = false,
  /** 오시는길: 제목 숨김 · 본문 첫 줄만(없으면 생략) */
  captionFirstLine = false,
}: {
  items: FeaturePhotoItem[];
  className?: string;
  /** 오시는길 등 — 한 화면용 낮은 카드 */
  dense?: boolean;
  captionFirstLine?: boolean;
}) {
  if (!items.length) return null;

  return (
    <div className={cn("grid gap-4 sm:gap-5 md:grid-cols-2", dense && "gap-3 sm:gap-3", className)}>
      {items.map((item, index) => {
        const title = normalizeFeatureCopy(item.title);
        const raw = item.text ? normalizeFeatureCopy(item.text) : "";
        const text = captionFirstLine ? firstBodyLine(raw) : raw;
        const showTitle = !captionFirstLine && Boolean(title);
        const showText = Boolean(text);
        const showCopy = showTitle || showText;
        const src = item.image?.trim() ? uploadOriginalUrl(item.image) : "";
        const alt = title || text || "photo";

        return (
          <article
            key={item.id || item.title || String(index)}
            className={cn(
              "pc-viewport-card relative isolate overflow-hidden rounded-2xl shadow-sm",
              dense
                ? "min-h-[9.5rem] sm:min-h-[10.5rem] md:min-h-[11.5rem]"
                : "min-h-[15.5rem] sm:min-h-[17rem] md:min-h-[18.5rem]",
            )}
          >
            {src ? (
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover object-center"
                sizes={dense ? "(max-width: 767px) 100vw, 33vw" : "(max-width: 767px) 100vw, 50vw"}
                priority={index < 2}
                unoptimized={src.includes("/api/uploads/")}
              />
            ) : (
              <div className="absolute inset-0 bg-[#002b50]/60" aria-hidden />
            )}
            {showCopy ? (
              <>
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#001a33]/78 via-[#001a33]/45 to-transparent"
                  aria-hidden
                />
                <div
                  className="absolute inset-y-0 left-0 w-[78%] max-w-lg bg-gradient-to-r from-black/35 to-transparent"
                  aria-hidden
                />
              </>
            ) : null}

            {showCopy ? (
              <div
                className={cn(
                  "pc-viewport-card-body relative z-10 flex flex-col justify-end md:max-w-[90%]",
                  dense
                    ? "min-h-[9.5rem] gap-1 p-4 sm:min-h-[10.5rem] sm:p-4 md:min-h-[11.5rem] md:p-5"
                    : "min-h-[15.5rem] gap-2.5 p-5 sm:min-h-[17rem] sm:p-6 md:min-h-[18.5rem] md:p-7 md:justify-center",
                )}
              >
                {showTitle ? (
                  <h3
                    className={cn(
                      "font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]",
                      dense ? "text-base sm:text-lg" : "text-lg sm:text-xl md:text-[1.35rem]",
                    )}
                  >
                    {title}
                  </h3>
                ) : null}
                {showText ? (
                  <div
                    className={cn(
                      "text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]",
                      dense
                        ? "text-[12px] leading-5 sm:text-[13px] sm:leading-6"
                        : "space-y-1.5 text-[13px] leading-6 sm:text-sm sm:leading-7",
                    )}
                  >
                    {captionFirstLine ? <p className="text-inherit">{text}</p> : <Paragraphs text={text} className="text-inherit" />}
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
