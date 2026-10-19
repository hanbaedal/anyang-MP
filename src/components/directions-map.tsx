"use client";

import { useState } from "react";
import {
  DEST_NAME,
  googleMapsEmbedUrl,
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
    <div className={cn(fill ? "flex min-h-0 flex-1 flex-col gap-3 md:gap-4" : "space-y-4")}>
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
      <figure className={cn(fill ? "flex min-h-[14rem] flex-1 flex-col md:min-h-0" : undefined)}>
        <iframe
          title={`${DEST_NAME} ${t("directions")}`}
          src={googleMapsEmbedUrl()}
          className={
            compact
              ? "h-56 w-full rounded-xl border"
              : fill
                ? "h-full min-h-[14rem] w-full flex-1 rounded-xl border md:min-h-0"
                : "h-80 w-full rounded-xl border md:h-96"
          }
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </figure>
    </div>
  );
}
