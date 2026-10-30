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
import { Button } from "@/components/ui/button";
import { ImageLightboxDialog } from "@/components/image-lightbox-dialog";
import { useT } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

const MAP_OVERVIEW = "/images/directions-map.jpg";
const MAP_DETAIL = "/images/directions-map-route-v2.png";
/** 첨부 광역 지도(1024×570)에서 빨간 핀 중심 */
const PIN_LEFT = "56.05%";
const PIN_TOP = "53.68%";

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
      <figure className="relative w-full overflow-hidden rounded-xl border bg-muted">
        <Image
          src={MAP_OVERVIEW}
          alt={`${DEST_NAME} ${t("directions")}`}
          width={1024}
          height={570}
          className={cn("h-auto w-full", compact && "max-h-56 object-cover object-center")}
          sizes="100vw"
          priority
        />
        <button
          type="button"
          className="absolute z-[1] size-12 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none md:size-14"
          style={{ left: PIN_LEFT, top: PIN_TOP }}
          aria-label={t("map.pin")}
          onClick={() => setDetailOpen(true)}
        >
          <span className="absolute inset-1 animate-ping rounded-full bg-red-500/40" aria-hidden />
        </button>
      </figure>
      <ImageLightboxDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        src={MAP_DETAIL}
        alt={t("map.detailAlt")}
      />
    </div>
  );
}
