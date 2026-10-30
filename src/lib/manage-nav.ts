import { CMS_SLUGS } from "./cms-types";

export const MANAGE_HOME = "/manage";

export type ManageNavItem = { href: string; i18n: string };

function cmsPage(slug: (typeof CMS_SLUGS)[number]["slug"]): ManageNavItem {
  const item = CMS_SLUGS.find((row) => row.slug === slug)!;
  return { href: `/manage/pages/${item.slug}`, i18n: item.i18n };
}

/**
 * 홈페이지 관리 서브메뉴.
 * 공개 NAV 순서: 메인 전용 → 공원소개(공지사항 포함) → 분양안내 → 이용안내 → 갤러리.
 */
export function manageNavItems(): ManageNavItem[] {
  return [
    { href: "/manage/home-hero", i18n: "manage.homeHero" },
    { href: "/manage/announcements", i18n: "manage.announcements" },
    cmsPage("greeting"),
    cmsPage("features"),
    cmsPage("directions"),
    cmsPage("burial"),
    cmsPage("lawn"),
    cmsPage("columbarium"),
    cmsPage("remodeling"),
    cmsPage("prices"),
    cmsPage("procedure"),
    cmsPage("fees"),
    cmsPage("services"),
    cmsPage("funeral"),
    { href: "/manage/gallery", i18n: "manage.gallery" },
    { href: "/manage/notices", i18n: "manage.notices" },
    { href: "/manage/inquiries", i18n: "manage.inquiries" },
  ];
}
