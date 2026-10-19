"use client";

import { useState } from "react";
import {
  DEST_ADDRESS,
  DEST_QUERY,
  googleMapsEmbedUrl,
  googleMapsViewUrl,
  kakaoDirectionsUrl,
  naverDirectionsUrl,
  SITE,
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
  const [usedStart, setUsedStart] = useState<boolean | null>(null);

  async function openRoute(kind: "naver" | "kakao") {
    setBusy(kind);
    const start = await readStart();
    setUsedStart(Boolean(start));
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
          <a href={googleMapsViewUrl()} target="_blank" rel="noreferrer" title={`${SITE.legalName} 구글 지도`}>
            {t("map.view")}
          </a>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t("map.routeHint", { dest: DEST_QUERY })}</p>
      {usedStart === false ? <p className="text-sm text-muted-foreground">{t("map.routeNoStart")}</p> : null}
      <p className="text-sm text-muted-foreground">
        {t("site.address")} · {t("phone")}{" "}
        <a className="text-primary underline-offset-4 hover:underline" href={SITE.phoneTel}>
          {SITE.phone}
        </a>
      </p>
      <figure className="space-y-2">
        <iframe
          title={`${t("site.legalName")} ${t("directions")}`}
          src={googleMapsEmbedUrl()}
          className={compact ? "h-56 w-full rounded-xl border" : "h-80 w-full rounded-xl border md:h-96"}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <figcaption className="text-sm font-medium">
          {SITE.legalName} · {DEST_ADDRESS}
        </figcaption>
      </figure>
    </div>
  );
}
