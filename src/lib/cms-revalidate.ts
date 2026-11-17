import { revalidatePath } from "next/cache";
import type { CmsSlug } from "@/lib/cms-types";
import type { ManageVisualCmsSlug } from "@/lib/manage-visual-pages";
import { PAGE_CMS_PUBLIC_PATH } from "@/lib/page-cms-path";

const CMS_HUB_PATHS: Partial<Record<CmsSlug, string[]>> = {
  greeting: ["/intro"],
  features: ["/intro"],
  directions: ["/intro"],
  burial: ["/lots"],
  lawn: ["/lots"],
  columbarium: ["/lots"],
  procedure: ["/guide"],
  fees: ["/guide"],
  services: ["/guide"],
  funeral: ["/guide"],
};

/** CMS 저장 후 공개·허브 페이지 캐시 무효화 */
export function revalidateCmsPublicPages(slug: CmsSlug) {
  const path = PAGE_CMS_PUBLIC_PATH[slug as ManageVisualCmsSlug];
  if (path) {
    revalidatePath(path, "layout");
    revalidatePath(path, "page");
  }
  for (const hub of CMS_HUB_PATHS[slug] ?? []) {
    revalidatePath(hub, "layout");
    revalidatePath(hub, "page");
  }
}