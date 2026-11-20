import { MenuHubIndex } from "@/components/menu-hub-index";
import { buildMenuHubIndexItems } from "@/lib/menu-hub";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "nav.guide") };
}

/** AMP-112: 서브메뉴 링크 허브 — 상세·CMS는 /guide/* (AMP-111 허브 복제 문제 해소) */
export default async function GuideHubPage() {
  const locale = await readLocale();
  const items = await buildMenuHubIndexItems("/guide", locale);

  return (
    <div className="site-container space-y-8 py-12 md:py-14">
      <h1 className="font-serif text-2xl text-primary md:text-3xl">{t(locale, "nav.guide")}</h1>
      <MenuHubIndex items={items} />
    </div>
  );
}
