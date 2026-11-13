import { SocialActions } from "@/components/hero-actions";
import { isGuestLocalePath, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { headers } from "next/headers";

export async function SiteFooter() {
  const locale = await readLocale();
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const uiLocale = isGuestLocalePath(pathname) ? locale : "ko";

  return (
    <>
      <footer className="relative z-10 mt-auto shrink-0 border-t border-transparent bg-transparent pb-[env(safe-area-inset-bottom)] text-xs leading-snug text-[color:var(--pastel-chrome-fg)] md:text-base md:leading-snug">
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5 md:px-5 md:py-3">
          <div className="min-w-0 text-left leading-snug">
            <p className="font-serif text-sm leading-tight md:text-lg">{t(uiLocale, "site.legalName")}</p>
            <p className="mt-0.5 text-[0.6875rem] opacity-75 md:text-sm">{t(uiLocale, "site.address")}</p>
          </div>
        </div>
      </footer>
      <SocialActions compact verticalFixed />
    </>
  );
}
