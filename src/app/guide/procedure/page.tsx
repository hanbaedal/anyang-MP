import Link from "next/link";
import { PageHero, Prose } from "@/components/page-hero";
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
  }));

  const noteBoxes = cms.body?.trim()
    ? cms.body
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block) => (
          <PastelBox key={block.slice(0, 48)}>
            <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
              <Paragraphs text={block} />
            </Prose>
          </PastelBox>
        ))
    : [
        <PastelBox key="consult">
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
        <PastelBox key="account">
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <p>{t(locale, "proc.account")}</p>
          </Prose>
        </PastelBox>,
        <PastelBox key="use-date">
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <p>{t(locale, "proc.twoDays")}</p>
          </Prose>
        </PastelBox>,
      ];

  return (
    <>
      <PageHero
        kicker={t(locale, "proc.kicker")}
        title={cms.title || t(locale, "proc.title")}
        lead={cms.lead || t(locale, "proc.lead")}
      />
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        <SaleSteps steps={steps.length ? steps : undefined} />
        <div className="grid gap-4 sm:grid-cols-2">{noteBoxes}</div>
      </div>
    </>
  );
}
