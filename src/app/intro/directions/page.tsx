import { DirectionsMap } from "@/components/directions-map";
import { PageHero } from "@/components/page-hero";
import { SITE } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "dir.title") };
}

export default async function DirectionsPage() {
  const locale = await readLocale();

  return (
    <>
      <PageHero kicker={t(locale, "dir.kicker")} title={t(locale, "dir.title")} lead={SITE.address}>
        <a className="underline-offset-4 hover:underline" href={SITE.phoneTel}>
          전화번호 : 031-482-2949
        </a>
      </PageHero>
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        <DirectionsMap />
      </div>
    </>
  );
}
