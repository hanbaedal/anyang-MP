"use client";

import { useState } from "react";
import { DirectionsMap } from "@/components/directions-map";
import { FeaturesPhotoGrid, type FeaturePhotoItem } from "@/components/features-photo-grid";
import { cn } from "@/lib/utils";

/** 오시는 길: 지도 figure 폭에 교통 카드 열 맞춤 */
export function DirectionsPageBody({ items }: { items: FeaturePhotoItem[] }) {
  const [mapWidth, setMapWidth] = useState<number | null>(null);
  const alignWidth = mapWidth != null && mapWidth > 0;

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 pb-2 sm:px-3 md:flex md:flex-col md:gap-3 md:overflow-hidden md:pb-3">
      <div className="flex min-h-[12rem] min-h-0 w-full flex-1 flex-col md:min-h-0">
        <DirectionsMap fill contentColumnWidth={mapWidth} onFigureWidthChange={setMapWidth} />
      </div>
      <div
        className={cn("mx-auto w-full shrink-0", alignWidth && "max-w-full")}
        style={alignWidth ? { width: mapWidth, maxWidth: "100%" } : undefined}
      >
        <FeaturesPhotoGrid className="w-full md:grid-cols-3" dense titleBar items={items} />
      </div>
    </div>
  );
}