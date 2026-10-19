import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { PageHero, Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { REMODEL_TYPES } from "@/lib/content";
import { getCmsPageLocalized } from "@/lib/cms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "remodel.title") };
}

export default async function RemodelPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("remodeling", locale);
  const items = cms.items?.length
    ? cms.items
    : REMODEL_TYPES.map((item) => ({ id: item.title, title: item.title, text: item.text, image: item.image }));
  return (
    <>
      <PageHero
        kicker={t(locale, "remodel.kicker")}
        title={cms.title || t(locale, "remodel.title")}
        lead={cms.lead || t(locale, "remodel.lead")}
        image={{ src: "/images/remodel-3.jpg", alt: t(locale, "remodel.title") }}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <Prose>
          {cms.body ? (
            <Paragraphs text={cms.body} />
          ) : (
            <>
              <p>{t(locale, "remodel.body")}</p>
              <p className="text-sm text-muted-foreground">{t(locale, "remodel.cost")}</p>
            </>
          )}
        </Prose>
        <LotsPhotoGrid items={items} />
      </div>
    </>
  );
}
