import { CMS_SLUGS } from "./cms-types";

export const MANAGE_HOME = "/manage";

export type ManageNavItem = { href: string; i18n: string };

function cmsPage(slug: (typeof CMS_SLUGS)[number]["slug"]): ManageNavItem {
  const item = CMS_SLUGS.find((row) => row.slug === slug)!;
  return { href: `/manage/pages/${item.slug}`, i18n: item.i18n };
}

/**
 * 홈페이지 관리 서브메뉴 (AMP-70).
 * 숨김: 리모델링 · 분양가·잔여 · 문의.
 * 중복 표기 피하려고 일부는 manage.* 키 사용.
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
    cmsPage("procedure"),
    cmsPage("fees"),
    { href: "/manage/pages/services", i18n: "manage.servicesPage" },
    cmsPage("funeral"),
    { href: "/manage/gallery", i18n: "manage.galleryAdmin" },
    { href: "/manage/notices", i18n: "manage.noticesPage" },
  ];
}
