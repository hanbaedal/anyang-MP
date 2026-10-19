import { SocialActions } from "@/components/hero-actions";
import { SITE } from "@/lib/site";
import { isGuestLocalePath, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { headers } from "next/headers";

export async function SiteFooter() {
  const locale = await readLocale();
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const uiLocale = isGuestLocalePath(pathname) ? locale : "ko";
  return (
    <footer className="shrink-0 border-t border-primary-foreground/20 bg-primary text-xs leading-snug text-primary-foreground md:text-sm md:leading-5">
      <div className="flex flex-col items-center gap-1.5 px-3 py-1.5 text-center sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-5 lg:py-2 lg:text-left">
        <div className="min-w-0">
          <p className="font-serif text-sm md:text-base">{t(uiLocale, "site.legalName")}</p>
          <p className="text-primary-foreground/85">
            {t(uiLocale, "site.address")}
            {" · "}
            {t(uiLocale, "phone")}{" "}
            <a className="underline-offset-4 hover:underline" href={SITE.phoneTel}>
              {SITE.phone}
            </a>
            {" · "}
            {SITE.postalCode}
          </p>
        </div>
        <div className="flex shrink-0 justify-center lg:justify-end">
          <SocialActions compact />
        </div>
      </div>
    </footer>
  );
}
