import { ManageCmsShell } from "@/components/manage/manage-cms-shell";
import { getCmsPageOrDefault } from "@/lib/cms";
import { listFuneralDocs } from "@/lib/funeral-docs";
import { getHomeIntroSlidesSettingsForWrite } from "@/lib/home-intro-slides";
import { isManageVisualCmsSlug, type ManageVisualCmsSlug } from "@/lib/manage-visual-pages";

export default async function ManageCmsPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const sp = await searchParams;
  const slugRaw = sp.slug?.trim() ?? "";
  const slug: ManageVisualCmsSlug | null = isManageVisualCmsSlug(slugRaw) ? slugRaw : null;

  const homeInitial = await getHomeIntroSlidesSettingsForWrite();
  const initialPage = slug ? await getCmsPageOrDefault(slug) : null;
  const initialFuneralDocs = slug === "funeral" ? await listFuneralDocs() : null;

  return (
    <ManageCmsShell
      homeInitial={homeInitial}
      initialSlug={slug}
      initialPage={initialPage}
      initialFuneralDocs={initialFuneralDocs}
    />
  );
}