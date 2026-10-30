import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { PageHero, Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { BURIAL } from "@/lib/content";
import { getCmsPageLocalized } from "@/lib/cms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "burial.title") };
}

export default async function BurialPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("burial", locale);
  const items = cms.items?.length
    ? cms.items
    : BURIAL.map((item) => ({ id: item.title, title: item.title, text: item.caption, image: item.image }));
  return (
    <>
      <PageHero
        kicker={t(locale, "burial.kicker")}
        title={cms.title || t(locale, "burial.title")}
        lead={cms.lead || t(locale, "burial.lead")}
        image={{ src: "/images/burial.jpg", alt: t(locale, "burial.title") }}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <Prose>{cms.body ? <Paragraphs text={cms.body} /> : <p>{t(locale, "burial.body")}</p>}</Prose>
        <LotsPhotoGrid items={items} layout="detail" />
      </div>
    </>
  );
}
