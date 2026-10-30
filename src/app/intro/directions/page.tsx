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
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <PageHero compact kicker={t(locale, "dir.kicker")} title={t(locale, "dir.title")} lead={SITE.address}>
        <a className="underline-offset-4 hover:underline" href={SITE.phoneTel}>
          전화번호 : 031-482-2949
        </a>
      </PageHero>
      <div className="flex min-h-0 w-full flex-1 flex-col px-2 py-2 sm:px-3">
        <DirectionsMap fill />
      </div>
    </div>
  );
}
