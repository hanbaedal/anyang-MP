"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  DEST_NAME,
  googleMapsViewUrl,
  kakaoAndroidMapRouteIntent,
  kakaoAndroidNaviIntent,
  kakaoDirectionsUrl,
  kakaoMapAppRouteUrl,
  kakaoNaviUrl,
  naverAndroidNaviIntent,
  naverAndroidRouteIntent,
  naverDirectionsUrl,
  naverMapAppRouteUrl,
  naverNaviUrl,
} from "@/lib/site";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const MAP_SRC = "/images/anyang-route-map.png";
const MAP_W = 2752;
const MAP_H = 1536;

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile|SamsungBrowser/i.test(navigator.userAgent);
}

function launchAppScheme(href: string) {
  if (href.startsWith("intent:")) {
    window.location.href = href;
    return;
  }
  const link = document.createElement("a");
  link.href = href;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function readStart(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  });
}

/** 앱이 열리면 페이지가 숨겨짐. 그때는 웹 길찾기 미리보기를 열지 않음. */
function watchAppHandoff(ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (handedOff: boolean) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
      resolve(handedOff);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") finish(true);
    };
    const onHide = () => finish(true);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    window.setTimeout(() => finish(false), ms);
  });
}

export function DirectionsMap({
  compact = false,
  fill = false,
  /** fill 모드: 지도 figure 실측 폭(px) — 하단 카드 열 맞춤용 */
  onFigureWidthChange,
  /** 지도와 같은 폭으로 길찾기 버튼 줄 맞춤 */
  contentColumnWidth,
}: {
  compact?: boolean;
  fill?: boolean;
  onFigureWidthChange?: (widthPx: number) => void;
  contentColumnWidth?: number | null;
}) {
  const t = useT();
  const [busy, setBusy] = useState<"naver" | "kakao" | null>(null);
  const figureRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!fill || !onFigureWidthChange) return;
    const el = figureRef.current;
    if (!el) return;
    const report = () => onFigureWidthChange(el.getBoundingClientRect().width);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    window.addEventListener("resize", report);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", report);
    };
  }, [fill, onFigureWidthChange]);

  async function openRoute(kind: "naver" | "kakao") {
    setBusy(kind);
    // 네이버 웹만 출발 좌표를 씀. 카카오는 웹/앱 모두 출발 생략(앱 GPS).
    const startPromise = kind === "naver" ? readStart() : Promise.resolve(null);
    try {
      if (isMobile()) {
        const schemes =
          kind === "naver"
            ? isAndroid()
              ? [naverAndroidNaviIntent(), naverAndroidRouteIntent()]
              : [naverNaviUrl(), naverMapAppRouteUrl()]
            : isAndroid()
              ? [kakaoAndroidNaviIntent(), kakaoAndroidMapRouteIntent()]
              : [kakaoNaviUrl(), kakaoMapAppRouteUrl()];
        for (const href of schemes) {
          launchAppScheme(href);
          if (await watchAppHandoff(900)) return;
        }
      }
      const start = (await startPromise) ?? undefined;
      const web = kind === "naver" ? naverDirectionsUrl(start) : kakaoDirectionsUrl();
      window.open(web, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={cn(fill ? "flex min-h-0 flex-1 flex-col gap-2 md:gap-3" : "space-y-4")}>
      <div
        className={cn(
          "flex shrink-0 flex-wrap gap-2",
          fill && contentColumnWidth != null && contentColumnWidth > 0 && "mx-auto max-w-full",
        )}
        style={
          fill && contentColumnWidth != null && contentColumnWidth > 0
            ? { width: contentColumnWidth, maxWidth: "100%" }
            : undefined
        }
      >
        <Button type="button" disabled={busy !== null} onClick={() => void openRoute("naver")}>
          {t("map.naver")}
        </Button>
        <Button type="button" variant="outline" disabled={busy !== null} onClick={() => void openRoute("kakao")}>
          {t("map.kakao")}
        </Button>
        <Button asChild variant="secondary">
          <a href={googleMapsViewUrl()} target="_blank" rel="noreferrer" title={`${DEST_NAME} 구글 지도`}>
            {t("map.view")}
          </a>
        </Button>
      </div>
      <div
        className={cn(
          fill && "@container relative min-h-0 w-full flex-1",
        )}
      >
        <figure
          ref={figureRef}
          className={cn(
            "relative overflow-hidden rounded-xl border bg-muted",
            fill ? "mx-auto w-full max-w-[min(100%,96rem)]" : "w-full",
            compact && !fill && "max-h-56",
          )}
          style={fill ? { aspectRatio: `${MAP_W} / ${MAP_H}` } : undefined}
        >
          <Image
            src={MAP_SRC}
            alt={`${DEST_NAME} ${t("directions")}`}
            fill={fill}
            width={fill ? undefined : MAP_W}
            height={fill ? undefined : MAP_H}
            className={cn(
              "guest-photo-bright",
              fill ? "object-contain object-center" : "h-auto w-full",
              compact && "object-cover object-center",
            )}
            sizes="100vw"
            quality={100}
            unoptimized
            priority
          />
        </figure>
      </div>
    </div>
  );
}
