"use client";

import Link from "next/link";
import { useState } from "react";
import { ManageHomeCms } from "@/components/manage/manage-home-cms";
import { CMS_SLUGS } from "@/lib/cms-types";
import { MANAGE_VISUAL_CMS_SLUGS } from "@/lib/manage-visual-pages";
import type { HomeIntroSlidesSettings } from "@/lib/home-intro-slides-types";
import { cn } from "@/lib/utils";

const PUBLIC_PATH: Record<string, string> = {
  greeting: "/intro/greeting",
  features: "/intro/features",
  directions: "/intro/directions",
  lawn: "/lots/lawn",
  burial: "/lots/burial",
  columbarium: "/lots/columbarium",
  procedure: "/guide/procedure",
  fees: "/guide/fees",
  services: "/guide/services",
  funeral: "/guide/funeral",
};

export function ManageCmsShell({ homeInitial }: { homeInitial: HomeIntroSlidesSettings }) {
  const [tab, setTab] = useState<"home" | "pages">("home");

  const pageRows = MANAGE_VISUAL_CMS_SLUGS.map((slug) => {
    const meta = CMS_SLUGS.find((r) => r.slug === slug)!;
    return { slug, label: meta.label, href: `/manage/pages/${slug}`, public: PUBLIC_PATH[slug] ?? "/" };
  });

  return (
    <div className="min-h-full bg-background">
      <header className="shrink-0 border-b bg-[#fffcf7] px-4 py-3">
        <h1 className="text-lg font-medium text-foreground">홈페이지 CMS</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          메인 홈은 공개 URL을 iframe으로 그대로 보여 주고, 소메뉴는 각 페이지 미러 편집으로 연결합니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium",
              tab === "home" ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
            )}
            onClick={() => setTab("home")}
          >
            메인 홈
          </button>
          <button
            type="button"
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium",
              tab === "pages" ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
            )}
            onClick={() => setTab("pages")}
          >
            소메뉴 페이지
          </button>
        </div>
      </header>
      {tab === "home" ? (
        <ManageHomeCms initial={homeInitial} />
      ) : (
        <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
          <p className="text-sm text-muted-foreground">
            각 페이지는 공개 레이아웃 위에서 직접 수정합니다. 갤러리·공지사항은 기존 관리 메뉴를 씁니다.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {pageRows.map((row) => (
              <li key={row.slug} className="rounded-xl border bg-card p-4 shadow-sm">
                <h2 className="font-medium">{row.label}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={row.href}
                    className="inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    편집
                  </Link>
                  <Link
                    href={row.public}
                    target="_blank"
                    className="inline-flex rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  >
                    공개 보기
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}