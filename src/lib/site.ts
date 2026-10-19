import type { Role } from "./auth-types";
import { isCmsStaff, isStaffRole, isStatusStaff } from "./auth-types";
import { EXEC_NAV } from "./exec-nav";
import { manageNavItems, MANAGE_HOME } from "./manage-nav";
import { SUPERVISOR_HOME, SUPERVISOR_NAV } from "./supervisor-nav";
import { WORK_NAV } from "./work-nav";

export const SITE = {
  legalName: "(재)안양공원묘원",
  shortName: "안양공원",
  /** U+2011(줄바꿈 없는 하이픈) — 본문·푸터 표시용 */
  phone: "031\u2011482\u20112949",
  phoneTel: "tel:031-482-2949",
  visitName: "공동묘지관리소",
  /** 공개·푸터·오시는 길에 쓰는 도로명+지번 */
  address: "경기 안산시 상록구 오리골길 41 (양상동 산50)",
  addressLine: "경기 안산시 상록구 오리골길 41",
  /** @deprecated 공개 주소와 동일. 기존 호출부 호환용 */
  addressAlt: "경기 안산시 상록구 오리골길 41 (양상동 산50)",
  /** 지도·내비에 남을 수 있는 옛 도로명(공개 문구에는 쓰지 않음) */
  addressLegacy: "경기 안산시 상록구 버대길 195",
  addressDetail: "양상동",
  region: "안산 상록구 양상동",
  postalCode: "15208",
  lat: 37.3521505,
  lng: 126.8419504,
  heroLine: "수도권 최상·최선·최고·최대, 접근성이 뛰어난 명당자리 (재)안양공원묘원",
  description:
    "경기 안산시 상록구 양상동 공동묘지관리소·(재)안양공원묘원. 매장·평장·봉안, 분양 안내, 관리비·묻고답하기.",
} as const;

export const DEFAULT_SITE_URL = "https://mp-anyang.onrender.com";

/** 소셜 URL. 값이 생기면 여기 또는 환경변수에 넣고, 비어 있으면 홈 버튼은 기존 안내 경로를 씁니다. 지어낸 주소는 넣지 않습니다. */
export const SOCIAL_URLS = {
  FACEBOOK: "https://www.facebook.com/profile.php?id=61595231941222",
  INSTAGRAM: "https://www.instagram.com/anyangmp/",
  YOUTUBE: "https://www.youtube.com/channel/UCnMpOKXKjlrDnVtWHZUH_wA",
  BLOG: "https://blog.naver.com/ahnyangmp",
} as const;

export type SocialKey = keyof typeof SOCIAL_URLS;

export function socialHref(key: SocialKey, fallback: string) {
  const fromEnv =
    process.env[`NEXT_PUBLIC_${key}_URL`]?.trim() ||
    process.env[`${key}_URL`]?.trim() ||
    process.env[key]?.trim();
  const fromConfig = SOCIAL_URLS[key].trim();
  return fromEnv || fromConfig || fallback;
}

export function siteUrl() {
  const raw = process.env.SITE_URL?.trim() || DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function metadataBase() {
  const url = siteUrl();
  return url ? new URL(url) : undefined;
}

export const DEST_ADDRESS = "경기 안산시 상록구 오리골길 41";
/** 길찾기·지도 도착 표시명. 관리사무소·경유지·다른 묘원 이름으로 바꾸지 않음. */
export const DEST_NAME = "안양공원묘원";
export const DEST_LABEL = `${DEST_NAME} ${DEST_ADDRESS}`;
export const DEST_QUERY = DEST_LABEL;

export type MapStart = { lat: number; lng: number };

export function destQuery() {
  return DEST_LABEL;
}

export function naverDirectionsUrl(start?: MapStart) {
  // /p/directions/{출발}/{도착}/{경유}/car — 도착 칸만 DEST_NAME, 경유는 항상 '-'
  const dest = `${SITE.lng},${SITE.lat},${encodeURIComponent(DEST_NAME)}`;
  if (!start) return `https://map.naver.com/p/directions/-/${dest}/-/car`;
  const from = `${start.lng},${start.lat},${encodeURIComponent("현재위치")}`;
  return `https://map.naver.com/p/directions/${from}/${dest}/-/car`;
}

export function kakaoDirectionsUrl(_start?: MapStart) {
  // 공식 도착 URL. ?sName&sX&eName 은 위치 허용 시 도착 칸이 비므로 쓰지 않음.
  // /link/to/이름,위도,경도 → 도착=안양공원묘원, 출발은 카카오가 현재위치.
  return `https://map.kakao.com/link/to/${encodeURIComponent(DEST_NAME)},${SITE.lat},${SITE.lng}`;
}

export function googleMapsQuery() {
  return DEST_LABEL;
}

export function googleMapsViewUrl() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(DEST_LABEL)}`;
}

export function googleMapsEmbedUrl() {
  return `https://maps.google.com/maps?q=${encodeURIComponent(DEST_LABEL)}&z=16&hl=ko&ie=UTF8&iwloc=A&output=embed`;
}

export const MAP = {
  placeName: SITE.legalName,
  destQuery: DEST_QUERY,
  naverSearch: `https://map.naver.com/p/search/${encodeURIComponent(DEST_QUERY)}`,
  naverDirections: naverDirectionsUrl(),
  kakaoSearch: `https://map.kakao.com/?q=${encodeURIComponent(DEST_QUERY)}`,
  kakaoDirections: kakaoDirectionsUrl(),
  googleView: googleMapsViewUrl(),
  googleEmbed: googleMapsEmbedUrl(),
  osmEmbed: `https://www.openstreetmap.org/export/embed.html?bbox=${SITE.lng - 0.012}%2C${SITE.lat - 0.008}%2C${SITE.lng + 0.012}%2C${SITE.lat + 0.008}&layer=mapnik&marker=${SITE.lat}%2C${SITE.lng}`,
};

export type NavTone = "home" | "intro" | "lots" | "guide" | "gallery" | "support" | "more";
export type NavChild = { href: string; label: string; i18n: string; hint?: string };
export type NavItem = {
  href: string;
  label: string;
  i18n: string;
  tone: NavTone;
  image?: string;
  children?: NavChild[];
};

/** 사이트맵 카드용 (호버로 살짝 진해짐) */
export const NAV_TONE_CLASS: Record<NavTone, string> = {
  home: "bg-[#eef3e8] hover:bg-[#e3eadc] border-[#d5e0c8]",
  intro: "bg-[#e7f3ee] hover:bg-[#d9ebe3] border-[#c5ddd3]",
  lots: "bg-[#f8eedd] hover:bg-[#f0e2c9] border-[#ead7b4]",
  guide: "bg-[#e7eef8] hover:bg-[#d7e3f3] border-[#c4d4ea]",
  gallery: "bg-[#eee8f7] hover:bg-[#e3daf0] border-[#d4c8e6]",
  support: "bg-[#f8e8e6] hover:bg-[#f0d9d5] border-[#e6c9c4]",
  more: "bg-[#e8f3f1] hover:bg-[#d7eae6] border-[#c3ddd8]",
};

/** 탐색기 그룹용 (행 호버만 쓰고 그룹 전체는 고정) */
export const NAV_TONE_SURFACE: Record<NavTone, string> = {
  home: "bg-[#eef3e8] border-[#d5e0c8]",
  intro: "bg-[#e7f3ee] border-[#c5ddd3]",
  lots: "bg-[#f8eedd] border-[#ead7b4]",
  guide: "bg-[#e7eef8] border-[#c4d4ea]",
  gallery: "bg-[#eee8f7] border-[#d4c8e6]",
  support: "bg-[#f8e8e6] border-[#e6c9c4]",
  more: "bg-[#e8f3f1] border-[#c3ddd8]",
};

/** 안내·소개 섹션 카드용 파스텔 (내비 톤과 동일 계열, hover 없음) */
export const PASTEL_CARD_TONES = [
  "border-[#c5ddd3] bg-[#e7f3ee]", // intro mint
  "border-[#c4d4ea] bg-[#e7eef8]", // guide blue
  "border-[#d5e0c8] bg-[#eef3e8]", // home sage
  "border-[#c3ddd8] bg-[#e8f3f1]", // more aqua
  "border-[#ead7b4] bg-[#f8eedd]", // lots sand
] as const;

export function pastelCardClass(index: number): string {
  return PASTEL_CARD_TONES[index % PASTEL_CARD_TONES.length]!;
}

export type SitemapMenu = {
  href: string;
  i18n: string;
  tone: NavTone;
  children: NavChild[];
};

export function sitemapMenus(role?: Role | null): SitemapMenu[] {
  const menus: SitemapMenu[] = [];
  for (const item of NAV) {
    if (!item.children?.length) continue;
    menus.push({
      href: item.href,
      i18n: item.i18n,
      tone: item.tone,
      children: item.children,
    });
  }
  if (isStaffRole(role)) {
    menus.push({
      href: WORK_NAV[0].href,
      i18n: "work.program",
      tone: "guide",
      children: WORK_NAV.map((item) => ({ href: item.href, label: item.i18n, i18n: item.i18n })),
    });
  }
  if (isStatusStaff(role)) {
    menus.push({
      href: EXEC_NAV[0].href,
      i18n: "work.overview",
      tone: "lots",
      children: EXEC_NAV.map((item) => ({ href: item.href, label: item.i18n, i18n: item.i18n })),
    });
  }
  if (role === "supervisor") {
    menus.push({
      href: SUPERVISOR_HOME,
      i18n: "nav.supervisor",
      tone: "more",
      children: SUPERVISOR_NAV.map((item) => ({
        href: item.href,
        label: item.i18n,
        i18n: item.i18n,
      })),
    });
  }
  if (isCmsStaff(role)) {
    menus.push({
      href: MANAGE_HOME,
      i18n: "manage.homepage",
      tone: "support",
      children: manageNavItems().map((item) => ({
        href: item.href,
        label: item.i18n,
        i18n: item.i18n,
      })),
    });
  }
  return menus;
}

export const NAV: NavItem[] = [
  {
    href: "/intro/greeting",
    label: "공원소개",
    i18n: "nav.intro",
    tone: "intro",
    image: "/images/park-overview.jpg",
    children: [
      { href: "/intro/greeting", label: "인사말", i18n: "nav.greeting" },
      { href: "/intro/features", label: "공원 특징", i18n: "nav.features" },
      { href: "/intro/directions", label: "오시는 길", i18n: "nav.directions" },
    ],
  },
  {
    href: "/lots/burial",
    label: "분양안내",
    i18n: "nav.lots",
    tone: "lots",
    image: "/images/plots.jpg",
    children: [
      { href: "/lots/burial", label: "매장묘", i18n: "nav.burial" },
      { href: "/lots/lawn", label: "평장묘", i18n: "nav.lawn" },
      { href: "/lots/columbarium", label: "봉안묘", i18n: "nav.columbarium" },
      { href: "/lots/remodeling", label: "리모델링", i18n: "nav.remodel" },
      { href: "/lots/prices", label: "분양가·잔여", i18n: "nav.prices" },
    ],
  },
  {
    href: "/guide/procedure",
    label: "이용안내",
    i18n: "nav.guide",
    tone: "guide",
    image: "/images/lawn.jpg",
    children: [
      { href: "/guide/procedure", label: "분양 절차", i18n: "nav.procedure" },
      { href: "/guide/fees", label: "관리비", i18n: "nav.fees" },
      { href: "/guide/services", label: "서비스", i18n: "nav.services" },
      { href: "/guide/funeral", label: "장례·안치", i18n: "nav.funeral" },
    ],
  },
  {
    href: "/gallery",
    label: "둘러보기",
    i18n: "nav.gallery",
    tone: "gallery",
    image: "/images/gallery-mound.jpg",
    children: [{ href: "/gallery", label: "공원 갤러리", i18n: "gallery.title" }],
  },
  {
    href: "/support/notices",
    label: "고객센터",
    i18n: "nav.support",
    tone: "support",
    image: "/images/gallery-4.jpg",
    children: [
      { href: "/support/notices", label: "공지사항", i18n: "nav.notices" },
      { href: "/support/inquiry", label: "문의·상담", i18n: "nav.inquiry" },
    ],
  },
  {
    href: "/sitemap",
    label: "사이트맵",
    i18n: "nav.sitemap",
    tone: "more",
  },
];

export const SALE_STEPS = [
  { n: "1", titleKey: "step.1.title", textKey: "step.1.text" },
  { n: "2", titleKey: "step.2.title", textKey: "step.2.text" },
  { n: "3", titleKey: "step.3.title", textKey: "step.3.text" },
  { n: "4", titleKey: "step.4.title", textKey: "step.4.text" },
  { n: "5", titleKey: "step.5.title", textKey: "step.5.text" },
] as const;

export const FEATURES = [
  { titleKey: "feature.1.title", bodyKey: "feature.1.body" },
  { titleKey: "feature.2.title", bodyKey: "feature.2.body" },
  { titleKey: "feature.3.title", bodyKey: "feature.3.body" },
  { titleKey: "feature.4.title", bodyKey: "feature.4.body" },
] as const;
