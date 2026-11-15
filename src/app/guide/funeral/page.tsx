import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsBodyMark } from "@/components/cms-body-mark";
import { CmsPageIntro } from "@/components/cms-page-intro";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { PastelBox } from "@/components/pastel-box";
import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { FuneralDocList } from "@/components/funeral-doc-list";
import { Prose } from "@/components/page-hero";
import { getCmsPageLocalized, getCmsPageOrDefault } from "@/lib/cms";
import { resolveCmsPageHero } from "@/lib/cms-page-hero";
import { resolveFuneralDocsDisplay } from "@/lib/funeral-docs-cms";
import { funeralDocsById } from "@/lib/funeral-docs";
import { SITE } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "fun.title") };
}

const FUNERAL_FALLBACK = [
  { id: "1", titleKey: "fun.s1t", bodyKey: "fun.s1d" },
  { id: "2", titleKey: "fun.s2t", bodyKey: "fun.s2d" },
  { id: "3", titleKey: "fun.s3t", bodyKey: "fun.s3d" },
  { id: "4", titleKey: "fun.s4t", bodyKey: "fun.s4d" },
] as const;

export default async function FuneralPage({
  searchParams,
}: {
  searchParams: Promise<{ cmsEdit?: string }>;
}) {
  const locale = await readLocale();
  const cmsEdit = await readCmsEditEnabled(searchParams);
  const cms = cmsEdit
    ? await getCmsPageOrDefault("funeral")
    : await getCmsPageLocalized("funeral", locale);
  const docs = await funeralDocsById();
  const items = (cms.items?.length
    ? cms.items
    : FUNERAL_FALLBACK.map((row) => ({
        id: row.id,
        title: t(locale, row.titleKey),
        text:
          row.bodyKey === "fun.s1d" ? t(locale, row.bodyKey, { phone: SITE.phone }) : t(locale, row.bodyKey),
        image: "",
      }))
  ).map((item) => ({
    ...item,
    image: item.image?.trim() || undefined,
  }));

  const hero = resolveCmsPageHero(locale, cms);
  const docLabels = resolveFuneralDocsDisplay(locale, cms.funeralDocs);

  return (
    <>
      <div className="pc-soft-card-fill mx-auto space-y-10 px-4 py-8 md:py-10">
        <PastelBox className="p-5 md:p-6">
          <CmsPageIntro title={hero.title} lead={hero.lead} cmsSlug="funeral" cmsEditMarkers={cmsEdit} />
        </PastelBox>
        <FeaturesPhotoGrid items={items} cmsSlug="funeral" cmsEditMarkers={cmsEdit} />
      <FuneralDocList locale={locale} docs={docs} labels={docLabels} cmsEditMarkers={cmsEdit} />
      <Prose>
        {cms.body?.trim() ? (
          <CmsBodyMark cmsSlug="funeral" cmsEditMarkers={cmsEdit} text={cms.body} />
        ) : (
          <CmsBodyMark cmsSlug="funeral" cmsEditMarkers={cmsEdit}>
            <p className="break-keep">{t(locale, "fun.more")}</p>
          </CmsBodyMark>
        )}
        <p>
          <a className="text-primary underline-offset-4 hover:underline" href={SITE.phoneTel}>
            {SITE.phone}
          </a>
        </p>
      </Prose>
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
