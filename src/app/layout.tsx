import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { ANON_VISITOR_COOKIE, isValidVisitorId } from "@/lib/analytics-cookie";
import { PageViewTracker } from "@/components/page-view-tracker";
import { StaffActivityBeacon } from "@/components/staff-activity-beacon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteSidebar } from "@/components/site-sidebar";
import { LocaleProvider } from "@/components/locale-provider";
import { NavSwipe } from "@/components/nav-swipe";
import { SITE, metadataBase } from "@/lib/site";
import { LOCALE_HTML, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { readSession } from "@/lib/auth";
import { clientIp } from "@/lib/ip-place";
import { trackPageView } from "@/lib/site-analytics";
import "./globals.css";

export const dynamic = "force-dynamic";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Noto+Serif+KR:wght@500;600;700&display=swap";

export const metadata: Metadata = {
  metadataBase: metadataBase(),
  title: {
    default: SITE.legalName,
    template: `%s | ${SITE.legalName}`,
  },
  description: SITE.description,
  formatDetection: { telephone: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await readLocale();
  const session = await readSession();
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const userAgent = h.get("user-agent");
  const ip = clientIp(h) || null;
  let visitorId = h.get("x-visitor-id");
  if (!isValidVisitorId(visitorId)) {
    visitorId = (await cookies()).get(ANON_VISITOR_COOKIE)?.value ?? null;
  }
  after(async () => {
    await trackPageView({
      pathname,
      session,
      visitorId: session ? null : visitorId,
      userAgent,
      ip,
    });
  });
  return (
    <html lang={LOCALE_HTML[locale]} className="h-full overflow-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_HREF} />
      </head>
      <body className="flex h-dvh flex-col overflow-hidden antialiased">
        <LocaleProvider locale={locale}>
          <PageViewTracker />
          {session ? <StaffActivityBeacon limited={false} /> : null}
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
          >
            {t(locale, "skip")}
          </a>
          <SiteHeader signedIn={Boolean(session)} role={session?.role ?? null} />
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <SiteSidebar role={session?.role ?? null} />
            {/* All breakpoints: header/footer chrome fixed; only main content scrolls between them. */}
            <div
              id="content"
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
                <div className="flex min-h-full flex-col">
                  <NavSwipe>
                    <div className="flex flex-1 flex-col">{children}</div>
                  </NavSwipe>
                </div>
              </div>
              <SiteFooter />
            </div>
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
