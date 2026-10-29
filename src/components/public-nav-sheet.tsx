"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { publicGnbItems } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useT } from "@/components/locale-provider";
import { isGuestLocalePath, tKo } from "@/lib/i18n";
import { isNavActive } from "@/components/nav-tree";

const triggerClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-primary hover:bg-accent lg:hidden";

/** 모바일 햄버거 → 공개 NAV 아코디언 오버레이 (폴더 트리 크롬 없음) */
export function PublicNavSheet() {
  const t = useT();
  const pathname = usePathname();
  const chrome = isGuestLocalePath(pathname) ? t : tKo;
  const items = publicGnbItems();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    setExpanded((prev) => {
      const next = { ...prev };
      for (const item of publicGnbItems()) {
        if (
          item.children?.some((child) => isNavActive(pathname, child.href)) ||
          isNavActive(pathname, item.href)
        ) {
          next[item.i18n] = true;
        }
      }
      return next;
    });
  }, [open, pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className={triggerClass} aria-label={chrome("menu")}>
          <Menu className="size-5" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent
        side="top"
        showCloseButton={false}
        className="inset-0 z-50 flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 border-0 bg-[color:var(--chrome)] p-0 text-[color:var(--chrome-foreground)] data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top"
      >
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-[color:var(--chrome-border)] px-3 py-2">
          <SheetTitle className="font-serif text-base text-primary">{chrome("site.legalName")}</SheetTitle>
          <SheetClose asChild>
            <Button size="icon" variant="ghost" className="shrink-0 text-primary" aria-label={chrome("close")}>
              <X />
            </Button>
          </SheetClose>
        </SheetHeader>
        <nav aria-label={chrome("menu")} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <ul>
            {items.map((item) => {
              const children = item.children ?? [];
              const hasChildren = children.length > 0;
              const isOpen = expanded[item.i18n] ?? false;
              const parentActive =
                isNavActive(pathname, item.href) ||
                children.some((child) => isNavActive(pathname, child.href));

              if (!hasChildren) {
                return (
                  <li key={item.i18n} className="border-b border-[color:var(--chrome-border)]">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-h-12 items-center px-4 text-[15px] font-medium",
                        parentActive && "bg-primary/15",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {chrome(item.i18n)}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.i18n} className="border-b border-[color:var(--chrome-border)]">
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-[15px] font-medium",
                      (isOpen || parentActive) && "bg-primary/10",
                    )}
                    aria-expanded={isOpen}
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [item.i18n]: !isOpen }))
                    }
                  >
                    <span>{chrome(item.i18n)}</span>
                    {isOpen ? (
                      <Minus className="size-4 shrink-0 opacity-80" aria-hidden />
                    ) : (
                      <Plus className="size-4 shrink-0 opacity-80" aria-hidden />
                    )}
                  </button>
                  {isOpen ? (
                    <ul className="border-t border-[color:var(--chrome-border)] bg-primary text-primary-foreground">
                      {children.map((child) => {
                        const active = isNavActive(pathname, child.href);
                        return (
                          <li key={child.href} className="border-b border-white/15 last:border-b-0">
                            <Link
                              href={child.href}
                              className={cn(
                                "block px-5 py-3 text-[14px] hover:bg-white/10",
                                active && "bg-white/15 font-medium",
                              )}
                              onClick={() => setOpen(false)}
                            >
                              {chrome(child.i18n)}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
