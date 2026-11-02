import { Prose } from "@/components/page-hero";
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
    <div className="pc-soft-card-fill pc-onepage-shell mx-auto px-4 py-8 md:py-0">
      <h1 className="sr-only">{cms.title || t(locale, "fees.title")}</h1>
      <div className="pc-onepage-grow pc-onepage-grid-2 grid gap-4">
        {sections.map((section) => (
          <PastelBox key={section.slice(0, 48)} className="pc-onepage-cell">
            <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
              <Paragraphs text={section} />
            </Prose>
          </PastelBox>
        ))}
      </div>
    </div>
  );
}
