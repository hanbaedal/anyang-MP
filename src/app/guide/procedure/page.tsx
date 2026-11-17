import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsManagedPageHero } from "@/components/cms-managed-page-hero";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { pageSlotBody } from "@/lib/page-cms-slots";
import { Prose } from "@/components/page-hero";
import { PastelBox } from "@/components/pastel-box";
import { Paragraphs } from "@/components/paragraphs";
import { SaleSteps } from "@/components/sale-steps";
import { getCmsPageLocalized, getCmsPageOrDefault } from "@/lib/cms";
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

  const proseClass =
    "max-w-none space-y-3 text-[15px] leading-7 text-[color:var(--pastel-chrome-fg)] md:space-y-[0.65em] md:text-[length:inherit] md:leading-[inherit]";

  if (fromCms.length) {
    return fromCms.map((block, index) => (
      <Prose key={`note-${index}`} className={proseClass}>
        <Paragraphs text={block} />
      </Prose>
    ));
  }

  return [
    <Prose key="account" className={proseClass}>
      <p>{t(locale, "proc.account")}</p>
    </Prose>,
    <Prose key="use-date" className={proseClass}>
      <p>{t(locale, "proc.twoDays")}</p>
    </Prose>,
  ];
}

export default async function ProcedurePage({
  searchParams,
}: {
  searchParams: Promise<{ cmsEdit?: string }>;
}) {
  const locale = await readLocale();
  const cmsEdit = await readCmsEditEnabled(searchParams);
  const cms = cmsEdit
    ? await getCmsPageOrDefault("procedure")
    : await getCmsPageLocalized("procedure", locale);
  const steps = (cms.items ?? []).map((item, index) => ({
    n: String(index + 1),
    id: item.id,
    title: item.title,
    text: item.text ?? "",
    image: item.image?.trim() || undefined,
  }));

  const noteAside = (
    <PastelBox className="pc-procedure-note flex h-full min-h-0 flex-col justify-center gap-3 overflow-auto p-4 md:p-5">
      <div {...(cmsEdit ? { "data-cms-key": pageSlotBody("procedure") } : {})}>{procedureNoteBlocks(locale, cms.body)}</div>
    </PastelBox>
  );

  return (
    <>
      <CmsManagedPageHero locale={locale} cms={cms} cmsEdit={cmsEdit} />
      <div className="pc-soft-card-fill mx-auto space-y-8 px-4 py-8 md:py-10">
        <SaleSteps
          steps={steps.length ? steps : undefined}
          aside={noteAside}
          cmsSlug="procedure"
          cmsEditMarkers={cmsEdit}
        />
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
