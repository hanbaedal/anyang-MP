import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsPageIntro } from "@/components/cms-page-intro";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { PastelBox } from "@/components/pastel-box";
import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { getCmsPageLocalized } from "@/lib/cms";
import { resolveCmsPageHero } from "@/lib/cms-page-hero";
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

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ cmsEdit?: string }>;
}) {
  const locale = await readLocale();
  const cmsEdit = await readCmsEditEnabled(searchParams);
  const cms = await getCmsPageLocalized("services", locale);
  const items = (cms.items?.length
    ? cms.items
    : SERVICE_FALLBACK.map((row) => ({
        id: row.titleKey,
        title: t(locale, row.titleKey),
        text: row.bodyKeys.map((key) => t(locale, key)).join("\n\n"),
        image: "",
      }))
  ).map((item) => ({
    ...item,
    image: item.image?.trim() || undefined,
  }));

  const hero = resolveCmsPageHero(locale, cms);

  return (
    <>
      <div className="pc-soft-card-fill mx-auto space-y-8 px-4 py-8 md:py-10">
        <PastelBox className="p-5 md:p-6">
          <CmsPageIntro title={hero.title} lead={hero.lead} cmsSlug="services" cmsEditMarkers={cmsEdit} />
        </PastelBox>
        <FeaturesPhotoGrid items={items} cmsSlug="services" cmsEditMarkers={cmsEdit} />
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
