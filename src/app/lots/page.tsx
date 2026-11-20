import { CmsBodyMark } from "@/components/cms-body-mark";
import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { MenuHubSection } from "@/components/menu-hub-section";
import { Prose } from "@/components/page-hero";
import { getCmsPageLocalized } from "@/lib/cms";
import { listLotsPhotosFromGallery } from "@/lib/gallery";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import type { CmsSlug } from "@/lib/cms-types";
import type { Locale } from "@/lib/i18n";
import type { LotsGallerySlug } from "@/lib/gallery-types";
import type { LotsPhotoItem } from "@/components/lots-photo-grid";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "nav.lots") };
}

async function lotsSection(
  locale: Locale,
  slug: Extract<CmsSlug, "burial" | "lawn" | "columbarium">,
  gallerySlug: LotsGallerySlug,
  fallbackBodyKey: string,
) {
  const [cms, items] = await Promise.all([
    getCmsPageLocalized(slug, locale),
    listLotsPhotosFromGallery(gallerySlug, locale),
  ]);
  const body: ReactNode = cms.body ? (
    <CmsBodyMark cmsSlug={slug} locale={locale} textStyles={cms.textStyles} text={cms.body} />
  ) : (
    <CmsBodyMark cmsSlug={slug} locale={locale} textStyles={cms.textStyles}>
      <p>{t(locale, fallbackBodyKey)}</p>
    </CmsBodyMark>
  );
  return {
    title: cms.title || t(locale, `${slug === "columbarium" ? "col" : slug}.title`),
    body,
    items: items as LotsPhotoItem[],
  };
}

export default async function LotsHubPage() {
  const locale = await readLocale();
  const emptyLabel = t(locale, "lots.galleryEmpty");
  const [lawn, burial, col] = await Promise.all([
    lotsSection(locale, "lawn", "lawn", "lawn.body"),
    lotsSection(locale, "burial", "burial", "burial.body"),
    lotsSection(locale, "columbarium", "columbarium", "col.body"),
  ]);

  return (
    <div className="site-container w-full space-y-16 py-12">
      <h1 className="sr-only">{t(locale, "nav.lots")}</h1>
      <MenuHubSection id="lawn" title={lawn.title} href="/lots/lawn" moreLabel={t(locale, "more.detail")}>
        <Prose className="max-w-none">{lawn.body}</Prose>
        <LotsPhotoGrid items={lawn.items} layout="detail" emptyLabel={emptyLabel} />
      </MenuHubSection>
      <MenuHubSection id="burial" title={burial.title} href="/lots/burial" moreLabel={t(locale, "more.detail")}>
        <Prose className="max-w-none">{burial.body}</Prose>
        <LotsPhotoGrid items={burial.items} layout="detail" emptyLabel={emptyLabel} />
      </MenuHubSection>
      <MenuHubSection
        id="columbarium"
        title={col.title}
        href="/lots/columbarium"
        moreLabel={t(locale, "more.detail")}
      >
        <Prose className="max-w-none">{col.body}</Prose>
        <LotsPhotoGrid items={col.items} layout="detail" emptyLabel={emptyLabel} />
      </MenuHubSection>
    </div>
  );
}
