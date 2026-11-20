import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsBodyMark } from "@/components/cms-body-mark";
import { CmsManagedPageHero } from "@/components/cms-managed-page-hero";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { PastelBox } from "@/components/pastel-box";
import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { FuneralDocList } from "@/components/funeral-doc-list";
import { Prose } from "@/components/page-hero";
import { loadCmsPageForView } from "@/lib/cms-page-view";
import { resolveFuneralDocsDisplay } from "@/lib/funeral-docs-cms";
import { funeralDocsById } from "@/lib/funeral-docs";
import { SITE } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

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
  const { cms, displayLocale } = await loadCmsPageForView("funeral", locale, cmsEdit);
  const docs = await funeralDocsById();
  const items = (cms.items?.length
    ? cms.items
    : FUNERAL_FALLBACK.map((row) => ({
        id: row.id,
        title: t(displayLocale, row.titleKey),
        text:
          row.bodyKey === "fun.s1d"
            ? t(displayLocale, row.bodyKey, { phone: SITE.phone })
            : t(displayLocale, row.bodyKey),
        image: "",
      }))
  ).map((item) => ({
    ...item,
    image: item.image?.trim() || undefined,
  }));

  const docLabels = resolveFuneralDocsDisplay(displayLocale, cms.funeralDocs);

  return (
    <>
      <CmsManagedPageHero locale={displayLocale} cms={cms} cmsEdit={cmsEdit} />
      <div className="site-container pc-soft-card-fill space-y-10 py-8 md:py-10">
        <FeaturesPhotoGrid
          items={items}
          cmsSlug="funeral"
          cmsEditMarkers={cmsEdit}
          locale={displayLocale}
          cmsTextStyles={cms.textStyles}
        />
      <FuneralDocList locale={displayLocale} docs={docs} labels={docLabels} cmsEditMarkers={cmsEdit} />
      <Prose>
        {cms.body?.trim() ? (
          <CmsBodyMark cmsSlug="funeral" locale={displayLocale} textStyles={cms.textStyles} cmsEditMarkers={cmsEdit} text={cms.body} />
        ) : (
          <CmsBodyMark cmsSlug="funeral" locale={displayLocale} textStyles={cms.textStyles} cmsEditMarkers={cmsEdit}>
            <p className="break-keep">{t(displayLocale, "fun.more")}</p>
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
