"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FlagSwitcher } from "@/components/flag-switcher";
import { NavTree } from "@/components/nav-tree";
import { LoginModal } from "@/components/login-modal";
import { useT } from "@/components/locale-provider";
import { isGuestLocalePath, tKo } from "@/lib/i18n";
import type { Role } from "@/lib/auth-types";

export function SiteHeader({ signedIn, role }: { signedIn: boolean; role?: Role | null }) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const guestPath = isGuestLocalePath(pathname);
  const chrome = guestPath ? t : tKo;

  return (
    <header className="relative z-40 h-12 shrink-0 border-b border-[color:var(--chrome-border)] bg-[color:var(--chrome)] text-[color:var(--chrome-foreground)] backdrop-blur">
      <div className="flex h-full min-w-0 items-center gap-1 px-1 sm:gap-2 sm:px-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon-xs" variant="outline" className="lg:hidden" aria-label={chrome("menu")}>
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="flex h-full w-max max-w-[90vw] flex-col gap-0 bg-card p-0 sm:max-w-[90vw]"
          >
            <SheetHeader className="w-max flex-row items-center gap-0.5 space-y-0 border-b p-1">
              <SheetTitle className="font-serif text-left text-xs leading-tight whitespace-nowrap">{chrome("explorer")}</SheetTitle>
              <SheetClose asChild>
                <Button size="icon-xs" variant="ghost" className="shrink-0" aria-label={chrome("close")}>
                  <X />
                </Button>
              </SheetClose>
            </SheetHeader>
            <div className="min-h-0 w-max flex-1 overflow-y-auto overscroll-y-contain">
              <NavTree fit role={role} onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Image
            src="/images/logo-512.png"
            alt=""
            width={512}
            height={512}
            priority
            className="size-7 object-contain lg:size-8"
            aria-hidden
          />
          <p className="whitespace-nowrap font-serif text-[11px] leading-none text-primary lg:text-lg">
            {chrome("site.legalName")}
          </p>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/sitemap"
            className="whitespace-nowrap rounded-md px-1.5 py-1 text-[11px] text-primary underline-offset-4 hover:bg-accent hover:underline sm:px-2 sm:text-sm"
          >
            {chrome("nav.sitemap")}
          </Link>
          {guestPath ? <FlagSwitcher /> : null}
          {signedIn ? (
            <Link
              href="/account"
              aria-label={tKo("account.myTitle")}
              title={tKo("account.myTitle")}
              className="inline-flex size-7 items-center justify-center rounded-md text-primary hover:bg-accent lg:size-9"
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
