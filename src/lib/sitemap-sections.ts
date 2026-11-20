import type { Role } from "./auth-types";
import {
  canAccessExecOverview,
  canAccessHomepageManage,
  canAccessSupervisorNav,
  canAccessWorkProgram,
} from "./auth-types";
import { EXEC_NAV } from "./exec-nav";
import { manageNavItems } from "./manage-nav";
import { SUPERVISOR_NAV } from "./supervisor-nav";
import { NAV, type NavChild } from "./site";
import { WORK_NAV_GROUPS } from "./work-nav";

export type SitemapColumn = {
  titleI18n: string;
  href?: string;
  children: NavChild[];
};

export type SitemapSection = {
  titleI18n: string;
  wrapped?: boolean;
  innerBannerI18n?: string;
  innerBannerHref?: string;
  columns: SitemapColumn[];
};

function publicSitemapColumns(): SitemapColumn[] {
  return NAV.filter((item) => item.href !== "/sitemap").map((item) => ({
    titleI18n: item.i18n,
    href: item.href,
    children:
      item.children?.length ? item.children : [{ href: item.href, label: item.label, i18n: item.i18n }],
  }));
}

function manageSitemapColumns(): SitemapColumn[] {
  const items = manageNavItems();
  const toChild = (row: (typeof items)[number]): NavChild => ({
    href: row.href,
    label: row.i18n,
    i18n: row.i18n,
  });
  return [
    {
      titleI18n: "sitemap.manageCol.main",
      href: "/manage/cms",
      children: items.slice(0, 3).map(toChild),
    },
    {
      titleI18n: "nav.intro",
      href: "/intro",
      children: items.slice(3, 6).map(toChild),
    },
    {
      titleI18n: "nav.lots",
      href: "/lots",
      children: items.slice(6, 9).map(toChild),
    },
    {
      titleI18n: "sitemap.manageCol.guide",
      href: "/guide",
      children: items.slice(9).map(toChild),
    },
  ];
}

function workSitemapColumns(role?: Role | null, _username?: string | null): SitemapColumn[] {
  const columns: SitemapColumn[] = WORK_NAV_GROUPS.map((group) => ({
    titleI18n: group.i18n,
    href: group.href,
    children: group.items.map((row) => ({ href: row.href, label: row.i18n, i18n: row.i18n })),
  }));

  // AMP-147: ceo·supervisor 모두 경영관리, supervisor는 슈퍼바이저 추가
  if (canAccessExecOverview(role)) {
    columns.push({
      titleI18n: "work.overview",
      href: "/work/exec/fees",
      children: EXEC_NAV.map((row) => ({ href: row.href, label: row.i18n, i18n: row.i18n })),
    });
  }
  if (canAccessSupervisorNav(role)) {
    columns.push({
      titleI18n: "nav.supervisor",
      href: "/supervisor/contracts",
      children: SUPERVISOR_NAV.map((row) => ({ href: row.href, label: row.i18n, i18n: row.i18n })),
    });
  }

  return columns;
}

/** Carebase 스타일 3단: 홈페이지 · 홈페이지관리 · 업무관리 */
export function buildSitemapSections(role?: Role | null, username?: string | null): SitemapSection[] {
  const sections: SitemapSection[] = [
    { titleI18n: "sitemap.sectionPublic", columns: publicSitemapColumns() },
  ];

  if (canAccessHomepageManage(role)) {
    sections.push({
      titleI18n: "sitemap.sectionManage",
      wrapped: true,
      innerBannerI18n: "sitemap.manageHome",
      innerBannerHref: "/manage/cms",
      columns: manageSitemapColumns(),
    });
  }

  const showWork = canAccessWorkProgram(role, username);
  if (showWork) {
    sections.push({
      titleI18n: "sitemap.sectionWork",
      columns: workSitemapColumns(role, username),
    });
  }

  return sections;
}