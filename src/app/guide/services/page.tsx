import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { getCmsPageLocalized } from "@/lib/cms";
import { FEATURES } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "svc.title") };
}

const SERVICE_FALLBACK = [
  { titleKey: "svc.reloc.title", bodyKeys: ["svc.reloc.p1", "svc.reloc.p2"] },
  { titleKey: "svc.stone.title", bodyKeys: ["svc.stone.p1"] },
  { titleKey: "svc.turf.title", bodyKeys: ["svc.turf.p1"] },
  { titleKey: "svc.weed.title", bodyKeys: ["svc.weed.p1"] },
  { titleKey: "svc.design.title", bodyKeys: ["svc.design.p1"] },
] as const;

export default async function ServicesPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("services", locale);
  const items = (cms.items?.length
    ? cms.items
    : SERVICE_FALLBACK.map((row) => ({
        id: row.titleKey,
        title: t(locale, row.titleKey),
        text: row.bodyKeys.map((key) => t(locale, key)).join("\n\n"),
        image: "",
      }))
  ).map((item, index) => ({
    ...item,
    image: item.image?.trim() || FEATURES[index % FEATURES.length]?.image,
  }));

  return (
    <div className="pc-soft-card-fill pc-onepage-shell mx-auto px-4 py-8 md:py-0">
      <h1 className="sr-only">{cms.title || t(locale, "svc.title")}</h1>
      <FeaturesPhotoGrid viewportFill items={items} />
    </div>
  );
}
