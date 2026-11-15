import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsBodyMark } from "@/components/cms-body-mark";
import { CmsPageIntro } from "@/components/cms-page-intro";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { PastelBox } from "@/components/pastel-box";
import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { Prose } from "@/components/page-hero";
import { getCmsPageLocalized } from "@/lib/cms";
import { resolveCmsPageHero } from "@/lib/cms-page-hero";
import { listLotsPhotosFromGallery } from "@/lib/gallery";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "burial.title") };
}

export default async function BurialPage({
  searchParams,
}: {
  searchParams: Promise<{ cmsEdit?: string }>;
}) {
  const locale = await readLocale();
  const cmsEdit = await readCmsEditEnabled(searchParams);
  const [cms, items] = await Promise.all([
    getCmsPageLocalized("burial", locale),
    listLotsPhotosFromGallery("burial", locale),
  ]);
  const hero = resolveCmsPageHero(locale, cms);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:py-10">
        <PastelBox className="p-5 md:p-6">
          <CmsPageIntro title={hero.title} lead={hero.lead} cmsSlug="burial" cmsEditMarkers={cmsEdit} />
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            {cms.body ? (
              <CmsBodyMark cmsSlug="burial" cmsEditMarkers={cmsEdit} text={cms.body} />
            ) : (
              <CmsBodyMark cmsSlug="burial" cmsEditMarkers={cmsEdit}>
                <p>{t(locale, "burial.body")}</p>
              </CmsBodyMark>
            )}
          </Prose>
        </PastelBox>
        <LotsPhotoGrid items={items} layout="detail" emptyLabel={t(locale, "lots.galleryEmpty")} />
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
