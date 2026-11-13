import { CMS_SLUGS } from "./cms-types";

export const MANAGE_HOME = "/manage";

export type ManageNavItem = { href: string; i18n: string };

function cmsPage(slug: (typeof CMS_SLUGS)[number]["slug"]): ManageNavItem {
  const item = CMS_SLUGS.find((row) => row.slug === slug)!;
  return { href: `/manage/pages/${item.slug}`, i18n: item.i18n };
}

/**
 * 홈페이지 관리 서브메뉴 (AMP-72).
 * 순서 = 공개 GNB: 메인 전용 → 공원소개 → 분양안내 → 이용안내 → 갤러리.
 * 숨김: 리모델링 · 분양가·잔여 · 문의.
 */
export function manageNavItems(): ManageNavItem[] {
  return [
    // 메인 전용 (공개 GNB에는 없음)
    { href: "/manage/home-slides", i18n: "manage.homeSlides" },
    { href: "/manage/home-hero", i18n: "manage.homeHero" },
    { href: "/manage/announcements", i18n: "manage.announcements" },
    // 공원소개: 인사말 → 공원 특징 → 공지사항 → 오시는 길
    cmsPage("greeting"),
    cmsPage("features"),
    { href: "/manage/notices", i18n: "manage.noticesPage" },
    cmsPage("directions"),
    // 분양안내: 매장묘 → 평장묘 → 봉안묘
    cmsPage("burial"),
    cmsPage("lawn"),
    cmsPage("columbarium"),
    // 이용안내: 분양 절차 → 관리비 → 이용안내 → 이용절차
    cmsPage("procedure"),
    cmsPage("fees"),
    { href: "/manage/pages/services", i18n: "manage.servicesPage" },
    cmsPage("funeral"),
    // 갤러리
    { href: "/manage/gallery", i18n: "manage.galleryAdmin" },
  ];
}
