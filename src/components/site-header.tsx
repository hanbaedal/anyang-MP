"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound } from "lucide-react";
import { FlagSwitcher } from "@/components/flag-switcher";
import { PublicGnb } from "@/components/public-gnb";
import { PublicNavSheet } from "@/components/public-nav-sheet";
import { LoginModal } from "@/components/login-modal";
import { useT } from "@/components/locale-provider";
import { isGuestLocalePath, tKo } from "@/lib/i18n";
import { isStaffRole, type Role } from "@/lib/auth-types";

export function SiteHeader({
  signedIn,
  role,
  username,
}: {
  signedIn: boolean;
  role?: Role | null;
  username?: string | null;
}) {
  const t = useT();
  const pathname = usePathname();
  const guestPath = isGuestLocalePath(pathname);
  const chrome = guestPath ? t : tKo;
  const staff = signedIn && isStaffRole(role);
  /** AMP-150: 국기는 게스트만 — 스태프 로그인 시 숨김 */
  const showFlags = !signedIn;

  return (
    <header className="site-header-shell shrink-0 overflow-visible">
      <div className="site-chrome-shell site-header-bar flex h-12 min-w-0 items-center gap-1 overflow-visible sm:gap-2 lg:h-14">
        <PublicNavSheet role={role} username={username} />

        {/* AMP-152: 브랜드 홈 링크 — 탭 영역·레이어를 명시해 유틸/오버레이에 가리지 않게 */}
        <Link
          href="/"
          aria-label={chrome("site.legalName")}
          className="relative z-[1] flex shrink-0 items-center gap-1.5 sm:gap-2"
        >
          <Image
            src="/images/logo-512.png"
            alt=""
            width={512}
            height={512}
            priority
            className="pointer-events-none size-7 object-contain lg:size-9"
            aria-hidden
          />
          <span className="whitespace-nowrap font-serif text-[0.6875rem] leading-none text-[color:var(--pastel-chrome-fg)] lg:text-lg">
            {chrome("site.legalName")}
          </span>
        </Link>

        <PublicGnb role={role} username={username} compact={staff} />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          {showFlags ? <FlagSwitcher /> : null}
          {signedIn ? (
            <Link
              href="/account"
              aria-label={tKo("account.myTitle")}
              title={tKo("account.myTitle")}
              className="inline-flex size-7 items-center justify-center rounded-md text-[color:var(--pastel-chrome-fg)] hover:bg-primary/8 lg:size-9"
            >
              <CircleUserRound className="size-4 lg:size-5" aria-hidden />
            </Link>
          ) : (
            <LoginModal />
          )}
          {/* AMP-150: 사이트맵은 맨 오른쪽 */}
          <Link
            href="/sitemap"
            className="whitespace-nowrap rounded-md px-1 py-1 text-[0.625rem] text-[color:var(--pastel-chrome-fg)]/80 underline-offset-4 hover:bg-primary/8 hover:underline sm:px-1.5 sm:text-xs"
          >
            {chrome("nav.sitemap")}
          </Link>
        </div>
      </div>
    </header>
  );
}
