import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { FuneralDocList } from "@/components/funeral-doc-list";
import { Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { getCmsPageLocalized } from "@/lib/cms";
import { funeralDocsById } from "@/lib/funeral-docs";
import { FEATURES, SITE } from "@/lib/site";
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

export default async function FuneralPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("funeral", locale);
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
  ).map((item, index) => ({
    ...item,
    image: item.image?.trim() || FEATURES[index % FEATURES.length]?.image,
  }));

  return (
    /* AMP-89: one-page shell/viewportFill 없음 — #content 자연 스크롤 */
    <div className="pc-soft-card-fill mx-auto space-y-10 px-4 py-8 md:py-10">
      <h1 className="sr-only">{cms.title || t(locale, "fun.title")}</h1>
      <FeaturesPhotoGrid items={items} />
      <FuneralDocList locale={locale} docs={docs} />
      <Prose>
        {cms.body?.trim() ? <Paragraphs text={cms.body} /> : <p className="break-keep">{t(locale, "fun.more")}</p>}
        <p>
          <a className="text-primary underline-offset-4 hover:underline" href={SITE.phoneTel}>
            {SITE.phone}
          </a>
        </p>
      </Prose>
    </div>
  );
}
