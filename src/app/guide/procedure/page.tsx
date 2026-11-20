import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsManagedPageHero } from "@/components/cms-managed-page-hero";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { pageSlotBody } from "@/lib/page-cms-slots";
import { Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { SaleSteps } from "@/components/sale-steps";
import { cmsBodyBlocks } from "@/lib/cms-body-blocks";
import { loadCmsPageForView } from "@/lib/cms-page-view";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "proc.title") };
}

/** 분양 절차 하단 — CMS 본문 (빈 줄 단락 · 단일 줄바꿈은 한 단락 안에서 처리) */
function procedureNoteBlocks(locale: Awaited<ReturnType<typeof readLocale>>, body?: string) {
  const trimmed = body?.trim() ?? "";
  const fromCms = cmsBodyBlocks(body);

  const proseClass =
    "max-w-none space-y-3 text-center text-[15px] leading-7 text-[color:var(--pastel-chrome-fg)] md:space-y-[0.65em] md:text-[length:inherit] md:leading-[inherit]";

  if (fromCms.length) {
    return fromCms.map((block, index) => (
      <Prose key={`note-${index}`} className={proseClass}>
        <Paragraphs text={block} />
      </Prose>
    ));
  }

  if (trimmed) {
    return [
      <Prose key="body-single" className={proseClass}>
        <Paragraphs text={trimmed} />
      </Prose>,
    ];
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
  const { cms, displayLocale } = await loadCmsPageForView("procedure", locale, cmsEdit);
  const steps = (cms.items ?? []).map((item, index) => ({
    n: String(index + 1),
    id: item.id,
    title: item.title,
    text: item.text ?? "",
    image: item.image?.trim() || undefined,
  }));

  const noteAside = (
    <div className="pc-procedure-note procedure-orbs-aside-text w-full">
      <div
        {...(cmsEdit ? { "data-cms-key": pageSlotBody("procedure"), "data-cms-body-root": "1" as const } : {})}
      >
        {procedureNoteBlocks(displayLocale, cms.body)}
      </div>
    </div>
  );

  return (
    <>
      <CmsManagedPageHero locale={displayLocale} cms={cms} cmsEdit={cmsEdit} />
      <div className="site-container w-full space-y-8 py-8 md:py-10">
        <SaleSteps
          variant="detail"
          steps={steps.length ? steps : undefined}
          aside={noteAside}
          cmsSlug="procedure"
          cmsEditMarkers={cmsEdit}
          cmsTextStyles={cms.textStyles}
        />
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
