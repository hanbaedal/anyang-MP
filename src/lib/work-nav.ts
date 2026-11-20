export const WORK_NAV = [
  { href: "/work/contracts", i18n: "work.contracts" },
  { href: "/work/fees", i18n: "work.fees" },
  { href: "/work/receipts", i18n: "work.receipts" },
  { href: "/work/partners", i18n: "work.partners" },
  { href: "/work/materials", i18n: "work.materials" },
  { href: "/work/products", i18n: "work.products" },
  { href: "/work/orders", i18n: "work.orders" },
  { href: "/work/purchases", i18n: "work.purchases" },
  { href: "/work/statements", i18n: "work.statements" },
  { href: "/work/inventory", i18n: "work.inventory" },
] as const;

/**
 * AMP-147: 업무 GNB·사이트맵 3그룹
 * - 계약·수납 / 거래처·품목 / 주문·재고
 */
export const WORK_NAV_GROUPS = [
  {
    i18n: "sitemap.workCol.contracts",
    href: WORK_NAV[0].href,
    items: [WORK_NAV[0], WORK_NAV[1], WORK_NAV[2], WORK_NAV[8]] as const,
  },
  {
    i18n: "sitemap.workCol.master",
    href: WORK_NAV[3].href,
    items: [WORK_NAV[3], WORK_NAV[4], WORK_NAV[5]] as const,
  },
  {
    i18n: "sitemap.workCol.trade",
    href: WORK_NAV[6].href,
    items: [WORK_NAV[6], WORK_NAV[7], WORK_NAV[9]] as const,
  },
] as const;
