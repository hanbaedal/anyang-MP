import { CmsPageHero } from "@/components/cms-page-hero";
import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { getCmsPageLocalized } from "@/lib/cms";
import { resolveCmsPageHero } from "@/lib/cms-page-hero";
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
  ).map((item) => ({
    ...item,
    image: item.image?.trim() || undefined,
  }));

  const hero = resolveCmsPageHero(locale, cms);

  return (
    <>
      <CmsPageHero {...hero} />
      <div className="pc-soft-card-fill mx-auto space-y-8 px-4 py-8 md:py-10">
        <FeaturesPhotoGrid items={items} />
      </div>
    </>
  );
}
