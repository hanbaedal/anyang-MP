"use client";

import { DirectionsMap } from "@/components/directions-map";
import { FeaturesPhotoGrid, type FeaturePhotoItem } from "@/components/features-photo-grid";

/** 오시는 길: 지도는 가로 전체·세로 스크롤 허용(한 화면에 맞추지 않음) */
export function DirectionsPageBody({
  items,
  cmsSlug,
  cmsEditMarkers = false,
}: {
  items: FeaturePhotoItem[];
  cmsSlug?: string;
  cmsEditMarkers?: boolean;
}) {
  return (
    <div className="w-full space-y-6 md:space-y-8">
      <DirectionsMap />
      <FeaturesPhotoGrid
        className="w-full md:grid-cols-3"
        dense
        titleBar
        items={items}
        cmsSlug={cmsSlug}
        cmsEditMarkers={cmsEditMarkers}
      />
    </div>
  );
}