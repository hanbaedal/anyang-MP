import { PageHero, Prose } from "@/components/page-hero";
import { SITE } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "privacy.title") };
}

export default async function PrivacyPage() {
  const locale = await readLocale();
  return (
    <>
      <PageHero kicker={t(locale, "privacy.kicker")} title={t(locale, "privacy.title")} lead={t(locale, "privacy.lead")} />
      <div className="site-container py-12">
        <Prose>
          <p>{t(locale, "privacy.p1")}</p>
          <p>{t(locale, "privacy.p2")}</p>
          <p>{t(locale, "privacy.p3")}</p>
          <p>
            {t(locale, "privacy.p4")}{" "}
            <a className="text-primary underline-offset-4 hover:underline" href={SITE.phoneTel}>
              {SITE.phone}
            </a>
          </p>
        </Prose>
      </div>
    </>
  );
}
