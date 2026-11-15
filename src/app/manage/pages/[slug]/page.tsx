import { notFound } from "next/navigation";
import { ManageFuneralDocs } from "@/components/manage-funeral-docs";
import { ManagePageCms } from "@/components/manage/manage-page-cms";
import { CMS_SLUGS, getCmsPageOrDefault, isCmsSlug } from "@/lib/cms";
import { listFuneralDocs } from "@/lib/funeral-docs";
import { isManageVisualCmsSlug } from "@/lib/manage-visual-pages";

export default async function ManageCmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isCmsSlug(slug)) notFound();
  const page = await getCmsPageOrDefault(slug);
  const funeralDocs = slug === "funeral" ? await listFuneralDocs() : null;

  if (!isManageVisualCmsSlug(slug)) {
    notFound();
  }

  const meta = CMS_SLUGS.find((item) => item.slug === slug)!;

  return (
    <>
      <header className="shrink-0 border-b bg-[#fffcf7] px-4 py-3">
        <h1 className="text-lg font-medium text-foreground">홈페이지 CMS · {meta.label}</h1>
      </header>
      <ManagePageCms initial={page} slug={slug} />
      {funeralDocs ? (
        <div className="mx-auto max-w-6xl space-y-3 border-t bg-background px-4 py-10">
          <h2 className="text-lg font-medium text-foreground">공공서류 PDF (4종)</h2>
          <p className="text-sm text-muted-foreground">
            이용절차 카드 아래에 공개됩니다. PDF는 이 영역에서만 수정합니다.
          </p>
          <ManageFuneralDocs initial={funeralDocs} />
        </div>
      ) : null}
    </>
  );
}