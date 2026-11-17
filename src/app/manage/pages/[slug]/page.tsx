import { notFound, redirect } from "next/navigation";
import { isCmsSlug } from "@/lib/cms-types";
import { isManageVisualCmsSlug } from "@/lib/manage-visual-pages";

/** 소메뉴 CMS — 통합 홈페이지 CMS로 이동 */
export default async function ManageCmsLegacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isCmsSlug(slug) || !isManageVisualCmsSlug(slug)) notFound();
  redirect(`/manage/cms?slug=${slug}`);
}