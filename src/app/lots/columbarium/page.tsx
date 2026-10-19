import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { PageHero, Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { COLUMBARIUM } from "@/lib/content";
import { getCmsPageLocalized } from "@/lib/cms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "col.title") };
}

export default async function ColumbariumPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("columbarium", locale);
  const items = cms.items?.length
    ? cms.items
    : COLUMBARIUM.map((item) => ({ id: item.title, title: item.title, image: item.image }));
  return (
    <>
      <PageHero
        kicker={t(locale, "col.kicker")}
        title={cms.title || t(locale, "col.title")}
        lead={cms.lead || t(locale, "col.lead")}
        image={{ src: "/images/columbarium.jpg", alt: t(locale, "col.title") }}
      />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Prose>{cms.body ? <Paragraphs text={cms.body} /> : <p>{t(locale, "col.body")}</p>}</Prose>
        <LotsPhotoGrid items={items} />
      </div>
    </>
  );
}
