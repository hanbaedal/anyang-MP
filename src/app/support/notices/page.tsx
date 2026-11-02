import Image from "next/image";
import { NoticesList } from "@/components/notices-list";
import { listNoticesLocalized } from "@/lib/notices";
import { getNoticesPageSettings } from "@/lib/notices-page";
import { SITE } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { uploadOriginalUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "notices.title") };
}

export default async function NoticesPage() {
  const locale = await readLocale();
  const [notices, page] = await Promise.all([listNoticesLocalized(locale), getNoticesPageSettings()]);
  const src = page.listImage?.trim() ? uploadOriginalUrl(page.listImage) : "";

  return (
    <div className="pc-notices-fill mx-auto px-4 py-8 md:py-0">
      <h1 className="sr-only">{t(locale, "notices.title")}</h1>
      <div className="pc-notices-fill-grid grid gap-6 md:gap-0">
        <aside className="pc-notices-aside relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl border border-[#c4a574]/40 bg-[#f4efe6] md:mx-0 md:max-w-none md:aspect-auto">
          {src ? (
            <Image
              src={src}
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 767px) 90vw, (min-width: 2560px) 48rem, 42rem"
              unoptimized={src.includes("/api/uploads/")}
              priority
            />
          ) : (
            <span className="sr-only">{t(locale, "notices.listImageEmpty")}</span>
          )}
        </aside>
        <div className="pc-notices-list min-w-0">
          <NoticesList items={notices} empty={t(locale, "notices.empty", { phone: SITE.phone })} fill />
        </div>
      </div>
    </div>
  );
}
