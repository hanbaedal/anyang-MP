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

  const [homeInitial, initialPage, initialFuneralDocs] = await Promise.all([
    slug ? Promise.resolve(null) : getHomeIntroSlidesSettingsForWrite(),
    slug ? getCmsPageOrDefault(slug) : Promise.resolve(null),
    slug === "funeral" ? listFuneralDocs() : Promise.resolve(null),
  ]);

  return (
    <ManageCmsShell
      homeInitial={homeInitial}
      initialSlug={slug}
      initialPage={initialPage}
      initialFuneralDocs={initialFuneralDocs}
    />
  );
}