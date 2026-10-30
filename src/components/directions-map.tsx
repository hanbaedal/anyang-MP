"use client";

import { useState } from "react";
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
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageLightboxDialog } from "@/components/image-lightbox-dialog";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const MAP_OVERVIEW = "/images/directions-map-wide.jpg";
const MAP_DETAIL = "/images/directions-map-route-v2.png";
const MAP_W = 1024;
const MAP_H = 512;
/** 광역 지도에서 안양공원묘원 위치 */
const PIN_LEFT = "55.8%";
const PIN_TOP = "55.2%";

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

export function DirectionsMap({ compact = false, fill = false }: { compact?: boolean; fill?: boolean }) {
  const t = useT();
  const [busy, setBusy] = useState<"naver" | "kakao" | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
      <div className="flex shrink-0 flex-wrap gap-2">
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
          className={cn(
            "relative overflow-hidden rounded-xl border bg-muted",
            fill
              ? "absolute left-1/2 top-1/2 max-h-full -translate-x-1/2 -translate-y-1/2"
              : "w-full",
            compact && !fill && "max-h-56",
          )}
          style={
            fill
              ? { width: `min(100%, calc(100cqh * ${MAP_W} / ${MAP_H}))`, aspectRatio: `${MAP_W} / ${MAP_H}` }
              : undefined
          }
        >
          <Image
            src={MAP_OVERVIEW}
            alt={`${DEST_NAME} ${t("directions")}`}
            fill={fill}
            width={fill ? undefined : MAP_W}
            height={fill ? undefined : MAP_H}
            className={cn(
              fill ? "object-contain" : "h-auto w-full",
              compact && "object-cover object-center",
            )}
            sizes="100vw"
            quality={100}
            unoptimized
            priority
          />
          <button
            type="button"
            className="absolute z-[1] flex -translate-x-1/2 -translate-y-[88%] flex-col items-center rounded-full focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
            style={{ left: PIN_LEFT, top: PIN_TOP }}
            aria-label={t("map.pin")}
            onClick={() => setDetailOpen(true)}
          >
            <span className="absolute bottom-1 size-8 animate-ping rounded-full bg-red-500/35" aria-hidden />
            <MapPin className="relative size-10 fill-red-600 text-red-700 drop-shadow md:size-11" aria-hidden />
          </button>
        </figure>
      </div>
      <ImageLightboxDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        src={MAP_DETAIL}
        alt={t("map.detailAlt")}
      />
    </div>
  );
}
