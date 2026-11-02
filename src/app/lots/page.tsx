import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { MenuHubSection } from "@/components/menu-hub-section";
import { Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { getCmsPageLocalized } from "@/lib/cms";
import { listLotsPhotosFromGallery } from "@/lib/gallery";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import type { CmsSlug } from "@/lib/cms-types";
import type { Locale } from "@/lib/i18n";
import type { LotsGallerySlug } from "@/lib/gallery-types";
import type { LotsPhotoItem } from "@/components/lots-photo-grid";

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
  return {
    title: cms.title || t(locale, `${slug === "columbarium" ? "col" : slug}.title`),
    body: cms.body ? <Paragraphs text={cms.body} /> : <p>{t(locale, fallbackBodyKey)}</p>,
    items: items as LotsPhotoItem[],
  };
}

export default async function LotsHubPage() {
  const locale = await readLocale();
  const emptyLabel = t(locale, "lots.galleryEmpty");
  const [burial, lawn, col] = await Promise.all([
    lotsSection(locale, "burial", "burial", "burial.body"),
    lotsSection(locale, "lawn", "lawn", "lawn.body"),
    lotsSection(locale, "columbarium", "columbarium", "col.body"),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-16 px-4 py-12">
      <h1 className="sr-only">{t(locale, "nav.lots")}</h1>
        <MenuHubSection id="burial" title={burial.title} href="/lots/burial" moreLabel={t(locale, "more.detail")}>
          <Prose>{burial.body}</Prose>
          <LotsPhotoGrid items={burial.items} emptyLabel={emptyLabel} />
        </MenuHubSection>
        <MenuHubSection id="lawn" title={lawn.title} href="/lots/lawn" moreLabel={t(locale, "more.detail")}>
          <Prose>{lawn.body}</Prose>
          <LotsPhotoGrid items={lawn.items} emptyLabel={emptyLabel} />
        </MenuHubSection>
        <MenuHubSection
          id="columbarium"
          title={col.title}
          href="/lots/columbarium"
          moreLabel={t(locale, "more.detail")}
        >
          <Prose>{col.body}</Prose>
          <LotsPhotoGrid items={col.items} emptyLabel={emptyLabel} />
        </MenuHubSection>
    </div>
  );
}
