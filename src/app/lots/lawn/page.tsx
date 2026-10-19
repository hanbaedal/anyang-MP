import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { PageHero, Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { LAWN } from "@/lib/content";
import { getCmsPageLocalized } from "@/lib/cms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "lawn.title") };
}

export default async function LawnPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("lawn", locale);
  const items = cms.items?.length ? cms.items : LAWN.map((item) => ({ id: item.title, title: item.title, image: item.image }));
  return (
    <>
      <PageHero
        kicker={t(locale, "lawn.kicker")}
        title={cms.title || t(locale, "lawn.title")}
        lead={cms.lead || t(locale, "lawn.lead")}
        image={{ src: "/images/lawn.jpg", alt: t(locale, "lawn.title") }}
      />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Prose>{cms.body ? <Paragraphs text={cms.body} /> : <p>{t(locale, "lawn.body")}</p>}</Prose>
        <LotsPhotoGrid items={items} />
      </div>
    </>
  );
}
