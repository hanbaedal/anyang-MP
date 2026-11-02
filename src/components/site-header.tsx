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
import type { Role } from "@/lib/auth-types";

export function SiteHeader({ signedIn, role }: { signedIn: boolean; role?: Role | null }) {
  const t = useT();
  const pathname = usePathname();
  const guestPath = isGuestLocalePath(pathname);
  const chrome = guestPath ? t : tKo;

  return (
    <header className="relative z-40 h-12 shrink-0 border-b border-[color:var(--chrome-border)] bg-[color:var(--chrome)] text-[color:var(--chrome-foreground)] backdrop-blur lg:h-14">
      <div className="flex h-full min-w-0 items-center gap-1 px-1 sm:gap-2 sm:px-3">
        <PublicNavSheet role={role} />

        <Link href="/" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Image
            src="/images/logo-512.png"
            alt=""
            width={512}
            height={512}
            priority
            className="size-7 object-contain lg:size-9"
            aria-hidden
          />
          <p className="whitespace-nowrap font-serif text-[0.6875rem] leading-none text-[color:var(--chrome-foreground)] lg:text-lg">
            {chrome("site.legalName")}
          </p>
        </Link>

        <PublicGnb role={role} />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/sitemap"
            className="whitespace-nowrap rounded-md px-1 py-1 text-[0.625rem] text-[color:var(--chrome-muted)] underline-offset-4 hover:bg-white/15 hover:underline sm:px-1.5 sm:text-xs"
          >
            {chrome("nav.sitemap")}
          </Link>
          {guestPath ? <FlagSwitcher /> : null}
          {signedIn ? (
            <Link
              href="/account"
              aria-label={tKo("account.myTitle")}
              title={tKo("account.myTitle")}
              className="inline-flex size-7 items-center justify-center rounded-md text-[color:var(--chrome-foreground)] hover:bg-white/15 lg:size-9"
            >
              <CircleUserRound className="size-4 lg:size-5" aria-hidden />
            </Link>
          ) : (
            <LoginModal />
          )}
        </div>
      </div>
    </header>
  );
}
