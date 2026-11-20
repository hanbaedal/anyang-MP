import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsManagedPageHero } from "@/components/cms-managed-page-hero";
import { ProcedureNoteAside } from "@/components/procedure-note-aside";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { SaleSteps } from "@/components/sale-steps";
import { loadCmsPageForView } from "@/lib/cms-page-view";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "proc.title") };
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

  return (
    <>
      <CmsManagedPageHero locale={displayLocale} cms={cms} cmsEdit={cmsEdit} />
      <div className="site-container pc-soft-card-fill space-y-8 py-8 md:py-10">
        <SaleSteps
          variant="orbs"
          steps={steps.length ? steps : undefined}
          aside={
            <ProcedureNoteAside
              locale={displayLocale}
              body={cms.body}
              textStyles={cms.textStyles}
              cmsEdit={cmsEdit}
            />
          }
          cmsSlug="procedure"
          cmsEditMarkers={cmsEdit}
          cmsTextStyles={cms.textStyles}
        />
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
