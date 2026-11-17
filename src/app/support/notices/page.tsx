import { CmsPageHeroBand } from "@/components/cms-page-hero-band";
import { NoticesList } from "@/components/notices-list";
import { listNoticesLocalized } from "@/lib/notices";
import { getNoticesPageSettings } from "@/lib/notices-page";
import { SITE } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "notices.title") };
}

export default async function NoticesPage() {
  const locale = await readLocale();
  const [notices, page] = await Promise.all([listNoticesLocalized(locale), getNoticesPageSettings()]);

  return (
    <>
      <CmsPageHeroBand
        kicker={t(locale, "notices.kicker")}
        title={t(locale, "notices.title")}
        lead={t(locale, "notices.lead")}
        heroImage={page.heroImage}
        imageAlt={t(locale, "notices.title")}
        large
      />
      <div className="site-container pc-notices-fill py-8 md:py-0">
        <div className="pc-notices-fill-grid pc-notices-fill-grid--text-only">
          <NoticesList items={notices} empty={t(locale, "notices.empty", { phone: SITE.phone })} fill />
        </div>
      </div>
    </>
  );
}
