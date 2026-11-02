import Link from "next/link";
import { CMS_SLUGS } from "@/lib/cms-types";
import { manageNavItems } from "@/lib/manage-nav";
import { SUPERVISOR_NAV } from "@/lib/supervisor-nav";
import type { SessionUser } from "@/lib/auth-types";

const LABELS: Record<string, string> = {
  "manage.homeHero": "메인 영상·음악",
  "manage.announcements": "메인 이벤트·팝업",
  "manage.gallery": "갤러리",
  "manage.galleryAdmin": "갤러리 관리",
  "manage.servicesPage": "이용 서비스",
  "manage.notices": "공지",
  "manage.noticesPage": "공지사항",
  "manage.inquiries": "문의",
  "manage.admins": "관리자 계정",
  "work.dbUpdate": "DB 업데이트",
  "supervisor.stats": "방문 통계",
  ...Object.fromEntries(CMS_SLUGS.map((item) => [item.i18n, item.label])),
};

export function ManageNav({ session }: { session: SessionUser }) {
  const links = [
    ...manageNavItems(),
    ...(session.role === "supervisor" ? SUPERVISOR_NAV : []),
  ];
  return (
    <nav className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              link.i18n === "manage.admins" || link.i18n === "work.dbUpdate"
                ? "font-medium text-primary underline-offset-4 hover:underline"
                : link.i18n.startsWith("manage.") || link.href.startsWith("/manage/pages/")
                  ? "text-primary underline-offset-4 hover:underline"
                  : "text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            }
          >
            {LABELS[link.i18n] ?? link.i18n}
          </Link>
        ))}
      </div>
    </nav>
  );
}
