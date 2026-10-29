import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { CmsEditor } from "@/components/cms-editor";
import { ManageFuneralDocs } from "@/components/manage-funeral-docs";
import { CMS_SLUGS, getCmsPageOrDefault, isCmsSlug } from "@/lib/cms";
import { listFuneralDocs } from "@/lib/funeral-docs";

export default async function ManageCmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isCmsSlug(slug)) notFound();
  const meta = CMS_SLUGS.find((item) => item.slug === slug)!;
  const page = await getCmsPageOrDefault(slug);
  const funeralDocs = slug === "funeral" ? await listFuneralDocs() : null;

  const lead =
    slug === "funeral"
      ? "절차 카드·안내 문구를 수정하고, 아래에서 공공서류 PDF를 등록합니다. Enter=줄바꿈·빈 줄=문단, 한글 저장 시 영어·중국어 자동 번역."
      : slug === "greeting"
        ? "제목·본문과 본문 좌측 이미지를 등록합니다. Enter는 줄바꿈, 빈 줄은 문단입니다. 한글 저장 시 영어·중국어가 자동 번역됩니다."
        : ["burial", "lawn", "columbarium", "remodeling"].includes(slug)
          ? "갤러리와 같이 사진을 올리고, 3열 격자에서 제목·설명을 수정합니다. Enter는 줄바꿈, 빈 줄은 문단입니다. 한글 저장 시 영어·중국어가 자동 번역됩니다."
          : "한글 제목·본문·항목을 저장하면 Enter는 줄바꿈, 빈 줄은 문단으로 공개됩니다. 영어·중국어는 자동 번역됩니다. 분양가 원을 비우면 ‘확인 필요’로 보입니다.";

  return (
    <>
      <PageHero kicker="관리" title={meta.label} lead={lead} />
      <CmsEditor initial={page} />
      {funeralDocs ? (
        <div className="mx-auto max-w-6xl space-y-3 border-t px-4 py-10">
          <h2 className="text-lg font-medium">공공서류 PDF (4종)</h2>
          <p className="text-sm text-muted-foreground">
            사망진단서·화장증명서·가족관계증명서(또는 제적등본)·검사지휘서 PDF를 등록합니다. 공개 페이지에서는 매장 시 /
            화장 시 목록으로 나눠 보이며, 없으면 「준비 중」입니다.
          </p>
          <ManageFuneralDocs initial={funeralDocs} />
        </div>
      ) : null}
    </>
  );
}
