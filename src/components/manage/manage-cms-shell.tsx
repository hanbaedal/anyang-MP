"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CmsWorkspaceSelect, type CmsWorkspace } from "@/components/manage/cms-workspace-select";
import { ManageFuneralDocs } from "@/components/manage-funeral-docs";
import { ManageHomeCms } from "@/components/manage/manage-home-cms";
import { ManagePageCms } from "@/components/manage/manage-page-cms";
import type { CmsPage } from "@/lib/cms-types";
import type { FuneralDocFile } from "@/lib/funeral-docs-types";
import type { HomeIntroSlidesSettings } from "@/lib/home-intro-slides-types";
import { isManageVisualCmsSlug, type ManageVisualCmsSlug } from "@/lib/manage-visual-pages";
import { pageSlotHeroImage } from "@/lib/page-cms-slots";

function syncCmsUrl(ws: CmsWorkspace) {
  if (typeof window === "undefined") return;
  const url = ws.kind === "home" ? "/manage/cms" : `/manage/cms?slug=${ws.slug}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === url || current === `${url}/`) return;
  window.history.replaceState(window.history.state, "", url);
}

export function ManageCmsShell({
  homeInitial,
  initialSlug = null,
  initialPage = null,
  initialFuneralDocs = null,
}: {
  homeInitial: HomeIntroSlidesSettings | null;
  initialSlug?: ManageVisualCmsSlug | null;
  initialPage?: CmsPage | null;
  initialFuneralDocs?: FuneralDocFile[] | null;
}) {
  const [workspace, setWorkspace] = useState<CmsWorkspace>(
    initialSlug ? { kind: "page", slug: initialSlug } : { kind: "home" },
  );
  const [homeSettings, setHomeSettings] = useState<HomeIntroSlidesSettings | null>(homeInitial);
  const [homeLoading, setHomeLoading] = useState(false);
  const [page, setPage] = useState<CmsPage | null>(initialPage);
  const [displaySlug, setDisplaySlug] = useState<ManageVisualCmsSlug | null>(initialSlug);
  const [funeralDocs, setFuneralDocs] = useState<FuneralDocFile[] | null>(initialFuneralDocs);
  const [pageFetching, setPageFetching] = useState(false);

  const pageCache = useRef(new Map<ManageVisualCmsSlug, CmsPage>());
  const funeralCache = useRef<FuneralDocFile[] | null>(null);

  if (initialPage && initialSlug) {
    pageCache.current.set(initialSlug, initialPage);
  }
  if (initialFuneralDocs) {
    funeralCache.current = initialFuneralDocs;
  }

  const loadHomeSettings = useCallback(async () => {
    if (homeSettings) return homeSettings;
    setHomeLoading(true);
    try {
      const res = await fetch("/api/manage/home-slides");
      const json = (await res.json()) as { ok?: boolean; settings?: HomeIntroSlidesSettings };
      if (json.settings) {
        setHomeSettings(json.settings);
        return json.settings;
      }
    } finally {
      setHomeLoading(false);
    }
    return null;
  }, [homeSettings]);

  const loadPage = useCallback(async (slug: ManageVisualCmsSlug, { background = false } = {}) => {
    const cached = pageCache.current.get(slug);
    if (cached && !background) {
      setPage(cached);
      setDisplaySlug(slug);
      if (slug === "funeral" && funeralCache.current) {
        setFuneralDocs(funeralCache.current);
      }
    }

    setPageFetching(true);
    try {
      const res = await fetch(`/api/manage/pages?slug=${encodeURIComponent(slug)}`);
      const json = (await res.json()) as { ok?: boolean; page?: CmsPage };
      if (json.page) {
        pageCache.current.set(slug, json.page);
        setPage(json.page);
        setDisplaySlug(slug);
      }
      if (slug === "funeral") {
        const fd = await fetch("/api/manage/funeral-docs");
        const fdJson = (await fd.json()) as { items?: FuneralDocFile[] };
        if (fdJson.items) {
          funeralCache.current = fdJson.items;
          setFuneralDocs(fdJson.items);
        }
      } else {
        setFuneralDocs(null);
      }
    } finally {
      setPageFetching(false);
    }
  }, []);

  useEffect(() => {
    if (workspace.kind === "home" && !homeSettings) {
      void loadHomeSettings();
    }
  }, [workspace.kind, homeSettings, loadHomeSettings]);

  function onWorkspaceChange(next: CmsWorkspace) {
    setWorkspace(next);
    syncCmsUrl(next);
    if (next.kind === "page") {
      const cached = pageCache.current.get(next.slug);
      if (cached) {
        setPage(cached);
        setDisplaySlug(next.slug);
        setPageFetching(true);
        void loadPage(next.slug, { background: true });
      } else if (next.slug !== page?.slug) {
        void loadPage(next.slug);
      }
    }
  }

  const pageReady =
    workspace.kind === "page" &&
    page &&
    displaySlug === workspace.slug &&
    isManageVisualCmsSlug(page.slug);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] min-h-0 flex-1 flex-col bg-background">
      <div className="shrink-0 border-b bg-[#fffcf7] px-3 py-2 md:px-4">
        <CmsWorkspaceSelect value={workspace} disabled={pageFetching && !pageReady} onChange={onWorkspaceChange} />
      </div>
      {workspace.kind === "home" ? (
        homeSettings ? (
          <ManageHomeCms initial={homeSettings} />
        ) : (
          <p className="p-6 text-sm text-muted-foreground">{homeLoading ? "메인 설정을 불러오는 중…" : ""}</p>
        )
      ) : pageReady ? (
        <>
          <div className="relative min-h-0 flex-1">
            {pageFetching ? (
              <p className="pointer-events-none absolute right-4 top-2 z-10 rounded-md bg-card/90 px-2 py-1 text-xs text-muted-foreground shadow-sm">
                최신 데이터 동기화 중…
              </p>
            ) : null}
            <ManagePageCms
              key={page.slug}
              initial={page}
              slug={page.slug as ManageVisualCmsSlug}
              defaultSlotKey={pageSlotHeroImage(page.slug)}
              onPersisted={(saved) => {
                if (isManageVisualCmsSlug(saved.slug)) {
                  pageCache.current.set(saved.slug, saved);
                }
              }}
            />
          </div>
          {page.slug === "funeral" && funeralDocs ? (
            <div className="mx-auto w-full max-w-[100rem] space-y-3 border-t px-4 py-8">
              <h2 className="text-base font-medium">공공서류 PDF (4종)</h2>
              <p className="text-sm text-muted-foreground">이용절차 카드 아래 공개 화면에 표시됩니다.</p>
              <ManageFuneralDocs initial={funeralDocs} />
            </div>
          ) : null}
        </>
      ) : (
        <p className="p-6 text-sm text-muted-foreground">페이지를 불러오는 중…</p>
      )}
    </div>
  );
}