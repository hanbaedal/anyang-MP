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

/** AMP-81: 5번 옆 칸 — 안내 2문 (CMS body 끝 2블록 · 기본=계좌·2일 전) */
function procedureNoteBlocks(locale: Awaited<ReturnType<typeof readLocale>>, body?: string) {
  const fromCms = body?.trim()
    ? body
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .slice(-2)
    : [];

  if (fromCms.length) {
    return fromCms.map((block, index) => (
      <Prose key={`note-${index}`} className="max-w-none text-[color:var(--pastel-chrome-fg)]">
        <Paragraphs text={block} />
      </Prose>
    ));
  }

  return [
    <Prose key="account" className="max-w-none text-[color:var(--pastel-chrome-fg)]">
      <p>{t(locale, "proc.account")}</p>
    </Prose>,
    <Prose key="use-date" className="max-w-none text-[color:var(--pastel-chrome-fg)]">
      <p>{t(locale, "proc.twoDays")}</p>
    </Prose>,
  ];
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

  const noteAside = (
    <PastelBox className="flex h-full min-h-0 flex-col justify-center gap-3 overflow-auto p-4 md:p-5">
      {procedureNoteBlocks(locale, cms.body)}
    </PastelBox>
  );

  return (
    <div className="pc-soft-card-fill pc-onepage-shell mx-auto px-4 py-8 md:py-0">
      <h1 className="sr-only">{cms.title || t(locale, "proc.title")}</h1>
      <SaleSteps viewportFill steps={steps.length ? steps : undefined} aside={noteAside} />
    </div>
  );
}
