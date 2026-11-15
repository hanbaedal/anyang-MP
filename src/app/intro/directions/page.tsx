import { DirectionsPageBody } from "@/components/directions-page-body";
import { getCmsPageLocalized, stripDirectionsAddressItems } from "@/lib/cms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "dir.title") };
}

const TRANSIT_FALLBACK = [
  { titleKey: "dir.car", bodyKey: "dir.carBody" },
  { titleKey: "dir.bus", bodyKey: "dir.busBody" },
  { titleKey: "dir.taxi", bodyKey: "dir.taxiBody" },
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
        image: "",
      }))
  ).map((item) => ({
    ...item,
    // 공개 카드: 제목 미표시 · CMS 본문 전체(AMP-75)
    image: item.image?.trim() || undefined,
  }));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <h1 className="sr-only">{t(locale, "dir.title")}</h1>
      {/* AMP-74: 지도 위 · 자가용/버스/택시 카드 아래 · 주소·전화(지도/푸터 중복) 숨김 */}
      <DirectionsPageBody items={items} />
    </div>
  );
}
