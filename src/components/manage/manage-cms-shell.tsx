"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CmsWorkspaceSelect, type CmsWorkspace } from "@/components/manage/cms-workspace-select";
import { ManageFuneralDocs } from "@/components/manage-funeral-docs";
import { ManageHomeCms } from "@/components/manage/manage-home-cms";
import { ManagePageCms } from "@/components/manage/manage-page-cms";
import type { CmsPage } from "@/lib/cms-types";
import type { FuneralDocFile } from "@/lib/funeral-docs-types";
import type { HomeIntroSlidesSettings } from "@/lib/home-intro-slides-types";
import { isManageVisualCmsSlug, type ManageVisualCmsSlug } from "@/lib/manage-visual-pages";
import { pageSlotHeroImage } from "@/lib/page-cms-slots";

export function ManageCmsShell({
  homeInitial,
  initialSlug = null,
  initialPage = null,
  initialFuneralDocs = null,
}: {
  homeInitial: HomeIntroSlidesSettings;
  initialSlug?: ManageVisualCmsSlug | null;
  initialPage?: CmsPage | null;
  initialFuneralDocs?: FuneralDocFile[] | null;
}) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<CmsWorkspace>(
    initialSlug ? { kind: "page", slug: initialSlug } : { kind: "home" },
  );
  const [page, setPage] = useState<CmsPage | null>(initialPage);
  const [funeralDocs, setFuneralDocs] = useState<FuneralDocFile[] | null>(initialFuneralDocs);
  const [loadingPage, setLoadingPage] = useState(false);

  const syncUrl = useCallback(
    (ws: CmsWorkspace) => {
      if (ws.kind === "home") {
        router.replace("/manage/cms");
        return;
      }
      router.replace(`/manage/cms?slug=${ws.slug}`);
    },
    [router],
  );

  const loadPage = useCallback(async (slug: ManageVisualCmsSlug) => {
    setLoadingPage(true);
    try {
      const res = await fetch(`/api/manage/pages?slug=${encodeURIComponent(slug)}`);
      const json = (await res.json()) as { ok?: boolean; page?: CmsPage };
      if (json.page) setPage(json.page);
      if (slug === "funeral") {
        const fd = await fetch("/api/manage/funeral-docs");
        const fdJson = (await fd.json()) as { items?: FuneralDocFile[] };
        if (fdJson.items) setFuneralDocs(fdJson.items);
      } else {
        setFuneralDocs(null);
      }
    } finally {
      setLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    if (workspace.kind !== "page") return;
    if (page?.slug === workspace.slug) return;
    void loadPage(workspace.slug);
  }, [workspace, page?.slug, loadPage]);

  function onWorkspaceChange(next: CmsWorkspace) {
    setWorkspace(next);
    syncUrl(next);
    if (next.kind === "page" && page?.slug !== next.slug) {
      setPage(null);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] min-h-0 flex-1 flex-col bg-background">
      <div className="shrink-0 border-b bg-[#fffcf7] px-3 py-2 md:px-4">
        <CmsWorkspaceSelect value={workspace} disabled={loadingPage} onChange={onWorkspaceChange} />
      </div>
      {workspace.kind === "home" ? (
        <ManageHomeCms initial={homeInitial} />
      ) : loadingPage && !page ? (
        <p className="p-6 text-sm text-muted-foreground">페이지를 불러오는 중…</p>
      ) : page && isManageVisualCmsSlug(page.slug) ? (
        <>
          <ManagePageCms
            key={page.slug}
            initial={page}
            slug={page.slug}
            defaultSlotKey={pageSlotHeroImage(page.slug)}
          />
          {page.slug === "funeral" && funeralDocs ? (
            <div className="mx-auto w-full max-w-[100rem] space-y-3 border-t px-4 py-8">
              <h2 className="text-base font-medium">공공서류 PDF (4종)</h2>
              <p className="text-sm text-muted-foreground">이용절차 카드 아래 공개 화면에 표시됩니다.</p>
              <ManageFuneralDocs initial={funeralDocs} />
            </div>
          ) : null}
        </>
      ) : (
        <p className="p-6 text-sm text-destructive">페이지를 불러오지 못했습니다.</p>
      )}
    </div>
  );
}