import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { getCmsPageLocalized } from "@/lib/cms";
import { FEATURES } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "fees.title") };
}

const FEE_FALLBACK = [
  { titleKey: "fees.c1.title", bodyKey: "fees.p1" },
  { titleKey: "fees.c2.title", bodyKey: "fees.p2" },
  { titleKey: "fees.c3.title", bodyKey: "fees.p3" },
  { titleKey: "fees.c4.title", bodyKey: "fees.p4" },
] as const;

export default async function FeesPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("fees", locale);
  const items = (cms.items?.length
    ? cms.items
    : FEE_FALLBACK.map((row) => ({
        id: row.titleKey,
        title: t(locale, row.titleKey),
        text: t(locale, row.bodyKey),
        image: "",
      }))
  ).map((item, index) => ({
    ...item,
    image: item.image?.trim() || FEATURES[index % FEATURES.length]?.image,
  }));

  return (
    <div className="pc-soft-card-fill pc-onepage-shell mx-auto px-4 py-8 md:py-0">
      <h1 className="sr-only">{cms.title || t(locale, "fees.title")}</h1>
      <FeaturesPhotoGrid viewportFill items={items} />
    </div>
  );
}
