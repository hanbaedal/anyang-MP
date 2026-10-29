"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicGnbItems } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useT } from "@/components/locale-provider";
import { isGuestLocalePath, tKo } from "@/lib/i18n";
import { isNavActive } from "@/components/nav-tree";

/** PC 헤더 가로 GNB + 좁은 세로 드롭다운 (시안형 패턴, 안양 브랜드 토큰) */
export function PublicGnb({ className }: { className?: string }) {
  const t = useT();
  const pathname = usePathname();
  const chrome = isGuestLocalePath(pathname) ? t : tKo;
  const items = publicGnbItems();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const baseId = useId();

  useEffect(() => {
    setOpenKey(null);
  }, [pathname]);

  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenKey(null);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setOpenKey(null);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [openKey]);

  return (
    <nav
      ref={rootRef}
      aria-label={chrome("menu")}
      className={cn("hidden h-full min-w-0 flex-1 items-stretch justify-center lg:flex", className)}
    >
      <ul className="flex h-full min-w-0 items-stretch">
        {items.map((item) => {
          const children = item.children ?? [];
          const hasChildren = children.length > 0;
          const open = openKey === item.i18n;
          const parentActive =
            isNavActive(pathname, item.href) ||
            children.some((child) => isNavActive(pathname, child.href));
          const panelId = `${baseId}-${item.i18n}`;

          return (
            <li
              key={item.i18n}
              className="relative flex h-full"
              onMouseEnter={() => hasChildren && setOpenKey(item.i18n)}
              onMouseLeave={() => hasChildren && setOpenKey(null)}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className={cn(
                    "flex h-full min-w-[4.5rem] items-center justify-center px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors xl:min-w-[5.5rem] xl:px-3 xl:text-sm",
                    "text-[color:var(--chrome-foreground)] hover:bg-primary/15",
                    (open || parentActive) && "bg-primary/20",
                  )}
                  aria-expanded={open}
                  aria-controls={panelId}
                  aria-haspopup="menu"
                  onClick={() => setOpenKey(open ? null : item.i18n)}
                  onFocus={() => setOpenKey(item.i18n)}
                >
                  {chrome(item.i18n)}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-full min-w-[4.5rem] items-center justify-center px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors xl:min-w-[5.5rem] xl:px-3 xl:text-sm",
                    "text-[color:var(--chrome-foreground)] hover:bg-primary/15",
                    parentActive && "bg-primary/20",
                  )}
                >
                  {chrome(item.i18n)}
                </Link>
              )}

              {hasChildren ? (
                <ul
                  id={panelId}
                  role="menu"
                  hidden={!open}
                  className={cn(
                    "absolute top-full left-1/2 z-50 w-max min-w-full -translate-x-1/2 border border-[color:var(--chrome-border)] bg-primary text-primary-foreground shadow-md",
                    "motion-safe:origin-top motion-safe:transition motion-safe:duration-150",
                    open ? "motion-safe:scale-y-100 motion-safe:opacity-100" : "pointer-events-none",
                  )}
                >
                  {children.map((child) => {
                    const active = isNavActive(pathname, child.href);
                    return (
                      <li key={child.href} role="none" className="border-b border-white/15 last:border-b-0">
                        <Link
                          role="menuitem"
                          href={child.href}
                          className={cn(
                            "block px-3 py-2.5 text-center text-[12px] whitespace-nowrap transition-colors hover:bg-white/15 xl:text-[13px]",
                            active && "bg-white/20 font-medium",
                          )}
                          onClick={() => setOpenKey(null)}
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
  );
}
