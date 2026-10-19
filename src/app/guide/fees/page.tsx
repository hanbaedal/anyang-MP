import { PageHero, Prose } from "@/components/page-hero";
import { PastelBox } from "@/components/pastel-box";
import { Paragraphs } from "@/components/paragraphs";
import { getCmsPageLocalized } from "@/lib/cms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "fees.title") };
}

export default async function FeesPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("fees", locale);
  const sections = cms.body?.trim()
    ? cms.body
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
    : [t(locale, "fees.p1"), t(locale, "fees.p2"), t(locale, "fees.p3"), t(locale, "fees.p4")];

  return (
    <>
      <PageHero
        kicker={t(locale, "fees.kicker")}
        title={cms.title || t(locale, "fees.title")}
        lead={cms.lead || t(locale, "fees.lead")}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <PastelBox key={section.slice(0, 48)}>
              <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
                <Paragraphs text={section} />
              </Prose>
            </PastelBox>
          ))}
        </div>
      </div>
    </>
  );
}
