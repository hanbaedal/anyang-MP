import { DirectionsMap } from "@/components/directions-map";
import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { getCmsPageLocalized, stripDirectionsAddressItems } from "@/lib/cms";
import { FEATURES } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "dir.title") };
}

const TRANSIT_FALLBACK = [
  { titleKey: "dir.car", bodyKey: "dir.carBody", image: FEATURES[0].image },
  { titleKey: "dir.bus", bodyKey: "dir.busBody", image: FEATURES[1].image },
  { titleKey: "dir.taxi", bodyKey: "dir.taxiBody", image: FEATURES[2].image },
] as const;

export default async function DirectionsPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("directions", locale);
  const rawItems = stripDirectionsAddressItems(cms.items ?? []);
  const items = (rawItems.length
    ? rawItems
    : TRANSIT_FALLBACK.map((row) => ({
        id: row.titleKey,
        title: t(locale, row.titleKey),
        text: t(locale, row.bodyKey),
        image: row.image,
      }))
  ).map((item, index) => ({
    ...item,
    // 공개 카드: 제목 미표시 · 본문 첫 줄만(FeaturesPhotoGrid captionFirstLine)
    image: item.image?.trim() || TRANSIT_FALLBACK[index % TRANSIT_FALLBACK.length]?.image,
  }));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <h1 className="sr-only">{t(locale, "dir.title")}</h1>
      {/* AMP-74: 지도 위 · 자가용/버스/택시 카드 아래 · 주소·전화(지도/푸터 중복) 숨김 */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2 pb-2 sm:px-3 md:flex md:flex-col md:overflow-hidden">
        <div className="flex min-h-[12rem] w-full flex-1 flex-col md:min-h-0">
          <DirectionsMap fill />
        </div>
        <FeaturesPhotoGrid className="shrink-0 md:grid-cols-3" dense captionFirstLine items={items} />
      </div>
    </div>
  );
}
