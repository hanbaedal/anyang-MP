import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { MenuHubSection } from "@/components/menu-hub-section";
import { PageHero, Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { BURIAL, COLUMBARIUM, LAWN } from "@/lib/content";
import { getCmsPageLocalized } from "@/lib/cms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import type { CmsSlug } from "@/lib/cms-types";
import type { Locale } from "@/lib/i18n";
import type { LotsPhotoItem } from "@/components/lots-photo-grid";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "nav.lots") };
}

async function lotsSection(
  locale: Locale,
  slug: Extract<CmsSlug, "burial" | "lawn" | "columbarium">,
  fallbackItems: LotsPhotoItem[],
  fallbackBodyKey: string,
) {
  const cms = await getCmsPageLocalized(slug, locale);
  const items = cms.items?.length ? cms.items : fallbackItems;
  return {
    title: cms.title || t(locale, `${slug === "columbarium" ? "col" : slug}.title`),
    body: cms.body ? <Paragraphs text={cms.body} /> : <p>{t(locale, fallbackBodyKey)}</p>,
    items,
  };
}

export default async function LotsHubPage() {
  const locale = await readLocale();
  const burialFallback = BURIAL.map((item) => ({
    id: item.title,
    title: item.title,
    text: item.caption,
    image: item.image,
  }));
  const lawnFallback = LAWN.map((item) => ({ id: item.title, title: item.title, image: item.image }));
  const colFallback = COLUMBARIUM.map((item) => ({ id: item.title, title: item.title, image: item.image }));
  const [burial, lawn, col] = await Promise.all([
    lotsSection(locale, "burial", burialFallback, "burial.body"),
    lotsSection(locale, "lawn", lawnFallback, "lawn.body"),
    lotsSection(locale, "columbarium", colFallback, "col.body"),
  ]);

  return (
    <>
      <PageHero
        kicker={t(locale, "nav.lots")}
        title={t(locale, "nav.lots")}
        lead={t(locale, "hub.lots.lead")}
        image={{ src: "/images/plots.jpg", alt: t(locale, "nav.lots") }}
      />
      <div className="mx-auto w-full max-w-7xl space-y-16 px-4 py-12">
        <MenuHubSection id="burial" title={burial.title} href="/lots/burial" moreLabel={t(locale, "more.detail")}>
          <Prose>{burial.body}</Prose>
          <LotsPhotoGrid items={burial.items} />
        </MenuHubSection>
        <MenuHubSection id="lawn" title={lawn.title} href="/lots/lawn" moreLabel={t(locale, "more.detail")}>
          <Prose>{lawn.body}</Prose>
          <LotsPhotoGrid items={lawn.items} />
        </MenuHubSection>
        <MenuHubSection
          id="columbarium"
          title={col.title}
          href="/lots/columbarium"
          moreLabel={t(locale, "more.detail")}
        >
          <Prose>{col.body}</Prose>
          <LotsPhotoGrid items={col.items} />
        </MenuHubSection>
      </div>
    </>
  );
}
