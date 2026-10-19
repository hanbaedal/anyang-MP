"use client";

import { useState } from "react";
import {
  DEST_ADDRESS,
  DEST_NAME,
  googleMapsEmbedUrl,
  googleMapsViewUrl,
  kakaoDirectionsUrl,
  naverDirectionsUrl,
} from "@/lib/site";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/locale-provider";

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

export function DirectionsMap({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const [busy, setBusy] = useState<"naver" | "kakao" | null>(null);

  async function openRoute(kind: "naver" | "kakao") {
    setBusy(kind);
    const start = await readStart();
    setBusy(null);
    const href = kind === "naver" ? naverDirectionsUrl(start ?? undefined) : kakaoDirectionsUrl(start ?? undefined);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
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
      <figure className="space-y-2">
        <iframe
          title={`${DEST_NAME} ${t("directions")}`}
          src={googleMapsEmbedUrl()}
          className={compact ? "h-56 w-full rounded-xl border" : "h-80 w-full rounded-xl border md:h-96"}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <figcaption className="text-sm font-medium">
          {DEST_NAME} · {DEST_ADDRESS}
        </figcaption>
      </figure>
    </div>
  );
}
