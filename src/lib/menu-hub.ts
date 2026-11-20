import { getCmsPageLocalized } from "@/lib/cms";
import type { CmsSlug } from "@/lib/cms-types";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { NAV } from "@/lib/site";
import type { MenuHubIndexItem } from "@/components/menu-hub-index";

/** 허브 경로 → NAV 자식의 CMS 슬러그·lead i18n 키 */
const HUB_CHILD_META: Record<
  string,
  { slug: CmsSlug; leadKey: string; titleKey?: string }
> = {
  "/intro/greeting": { slug: "greeting", leadKey: "greeting.lead", titleKey: "greeting.title" },
  "/intro/features": { slug: "features", leadKey: "features.lead", titleKey: "features.title" },
  "/intro/directions": { slug: "directions", leadKey: "dir.lead", titleKey: "dir.title" },
  "/lots/lawn": { slug: "lawn", leadKey: "lawn.lead", titleKey: "lawn.title" },
  "/lots/burial": { slug: "burial", leadKey: "burial.lead", titleKey: "burial.title" },
  "/lots/columbarium": { slug: "columbarium", leadKey: "col.lead", titleKey: "col.title" },
  "/guide/procedure": { slug: "procedure", leadKey: "proc.lead", titleKey: "proc.title" },
  "/guide/fees": { slug: "fees", leadKey: "fees.lead", titleKey: "fees.title" },
  "/guide/services": { slug: "services", leadKey: "svc.lead", titleKey: "svc.title" },
  "/guide/funeral": { slug: "funeral", leadKey: "fun.lead", titleKey: "fun.title" },
};

/** AMP-112: NAV 서브메뉴 기준으로 허브 링크 목록(제목·짧은 lead) */
export async function buildMenuHubIndexItems(
  hubHref: "/intro" | "/lots" | "/guide",
  locale: Locale,
): Promise<MenuHubIndexItem[]> {
  const hub = NAV.find((item) => item.href === hubHref);
  const children = hub?.children ?? [];
  if (!children.length) return [];

  return Promise.all(
    children.map(async (child) => {
      const meta = HUB_CHILD_META[child.href];
      if (!meta) {
        return {
          href: child.href,
          title: t(locale, child.i18n),
        };
      }
      const cms = await getCmsPageLocalized(meta.slug, locale);
      const title =
        cms.title?.trim() ||
        (meta.titleKey ? t(locale, meta.titleKey) : null) ||
        t(locale, child.i18n);
      const lead = cms.lead?.trim() || t(locale, meta.leadKey);
      return { href: child.href, title, lead };
    }),
  );
}
