import Link from "next/link";
import { Prose } from "@/components/page-hero";
import { PastelBox } from "@/components/pastel-box";
import { Paragraphs } from "@/components/paragraphs";
import { SaleSteps } from "@/components/sale-steps";
import { getCmsPageLocalized } from "@/lib/cms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "proc.title") };
}

export default async function ProcedurePage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("procedure", locale);
  const steps = (cms.items ?? []).map((item, index) => ({
    n: String(index + 1),
    title: item.title,
    text: item.text ?? "",
    image: item.image?.trim() || undefined,
  }));

  const noteBoxes = cms.body?.trim()
    ? cms.body
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block) => (
          <PastelBox key={block.slice(0, 48)} className="pc-onepage-cell p-3 md:p-4">
            <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
              <Paragraphs text={block} />
            </Prose>
          </PastelBox>
        ))
    : [
        <PastelBox key="consult" className="pc-onepage-cell p-3 md:p-4">
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <p>
              {t(locale, "proc.consult")}{" "}
              <Link href="/support/inquiry" className="underline-offset-4 hover:underline">
                {t(locale, "proc.form")}
              </Link>
              {t(locale, "proc.consultEnd")}
            </p>
          </Prose>
        </PastelBox>,
        <PastelBox key="account" className="pc-onepage-cell p-3 md:p-4">
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <p>{t(locale, "proc.account")}</p>
          </Prose>
        </PastelBox>,
        <PastelBox key="use-date" className="pc-onepage-cell p-3 md:p-4">
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <p>{t(locale, "proc.twoDays")}</p>
          </Prose>
        </PastelBox>,
      ];

  return (
    <div className="pc-soft-card-fill pc-onepage-shell mx-auto px-4 py-8 md:py-0">
      <h1 className="sr-only">{cms.title || t(locale, "proc.title")}</h1>
      <div className="pc-onepage-stack space-y-6 md:space-y-0">
        <SaleSteps viewportFill steps={steps.length ? steps : undefined} />
        <div className="pc-onepage-foot grid gap-3 sm:grid-cols-2 md:gap-3">{noteBoxes}</div>
      </div>
    </div>
  );
}
