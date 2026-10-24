import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { readSession } from "@/lib/auth";
import { NAV_TONE_CLASS, sitemapMenus } from "@/lib/site";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "sitemap.title") };
}

export default async function SitemapPage() {
  const locale = await readLocale();
  const session = await readSession();
  const menus = sitemapMenus(session?.role);

  return (
    /* 높이·overflow는 #content 스크롤 영역에 맡김 — h-full+내부 overflow-y는
       로그인 메뉴가 늘어난 모바일에서 본문 스크롤이 막히는 원인이 됨 */
    <div className="px-3 py-3 pb-6 sm:px-4 sm:py-4">
      <h1 className="sr-only">{t(locale, "nav.sitemap")}</h1>
      <ul
        className={cn(
          "mx-auto grid w-full max-w-[1600px] auto-rows-min content-start gap-2 sm:gap-2.5",
          /* 폭만 줄임: PC에서 한 줄에 더 많은 카드, 글자 크기는 유지 */
          "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        )}
      >
        {menus.map((menu) => {
          const manyChildren = menu.children.length >= 10;
          return (
            <li
              key={menu.i18n}
              className={cn(
                "flex min-w-0 flex-col overflow-hidden rounded-lg border",
                NAV_TONE_CLASS[menu.tone],
              )}
            >
              <Link
                href={menu.href}
                className="flex items-center gap-1 border-b border-black/10 px-2.5 py-2 hover:bg-white/40 sm:px-3"
              >
                <span className="min-w-0 flex-1 truncate font-serif text-sm leading-tight text-primary">
                  {t(locale, menu.i18n)}
                </span>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
              {menu.children.length ? (
                <ul
                  className={cn(
                    "py-0.5",
                    manyChildren && "md:grid md:grid-cols-2 md:gap-px md:py-1",
                    !manyChildren && "divide-y divide-black/5",
                  )}
                >
                  {menu.children.map((child) => (
                    <li key={child.href} className={manyChildren ? "min-w-0" : undefined}>
                      <Link
                        href={child.href}
                        className={cn(
                          "flex h-7 items-center px-2.5 text-xs leading-none text-primary hover:bg-white/45 sm:px-3 sm:text-[13px]",
                          manyChildren && "rounded-sm md:h-6",
                        )}
                      >
                        <span className="truncate">{t(locale, child.i18n)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
