"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicGnbItemsForRole } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useT } from "@/components/locale-provider";
import { isGuestLocalePath, tKo } from "@/lib/i18n";
import { isNavActive } from "@/components/nav-tree";
import type { Role } from "@/lib/auth-types";

/** PC 헤더 가로 GNB + 좁은 세로 드롭다운 (시안형 · AMP-83 그룹 제목) */
export function PublicGnb({
  className,
  role,
  username,
}: {
  className?: string;
  role?: Role | null;
  username?: string | null;
}) {
  const t = useT();
  const pathname = usePathname();
  const chrome = isGuestLocalePath(pathname) ? t : tKo;
  const items = publicGnbItemsForRole(role, username);
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
      className={cn("hidden h-full min-w-0 flex-1 items-stretch justify-center overflow-visible lg:flex", className)}
    >
      <ul className="flex h-full min-w-0 items-stretch overflow-visible">
        {items.map((item) => {
          const children = item.children ?? [];
          const hasChildren = children.length > 0;
          const open = openKey === item.i18n;
          const parentActive =
            isNavActive(pathname, item.href) ||
            children.some((child) => isNavActive(pathname, child.href));
          const panelId = `${baseId}-${item.i18n}`;
          const labelId = `${panelId}-label`;

          return (
            <li
              key={item.i18n}
              className={cn(
                "relative flex h-full overflow-visible",
                "after:absolute after:top-1/2 after:right-0 after:h-4 after:w-px after:-translate-y-1/2 after:bg-[color:var(--chrome-border)] last:after:hidden",
              )}
              onMouseEnter={() => hasChildren && setOpenKey(item.i18n)}
              onMouseLeave={() => hasChildren && setOpenKey(null)}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex h-full min-w-[4.5rem] items-center justify-center px-2.5 text-[0.9375rem] font-medium whitespace-nowrap transition-colors xl:min-w-[5.5rem] xl:px-3 xl:text-base",
                  "text-[color:var(--chrome-foreground)] hover:bg-white/15",
                  (open || parentActive) && "bg-white/20",
                )}
                aria-expanded={hasChildren ? open : undefined}
                aria-controls={hasChildren ? panelId : undefined}
                aria-haspopup={hasChildren ? "menu" : undefined}
                onFocus={() => hasChildren && setOpenKey(item.i18n)}
              >
                {chrome(item.i18n)}
              </Link>

              {hasChildren ? (
                <div
                  id={panelId}
                  hidden={!open}
                  className={cn(
                    "absolute top-full left-1/2 z-[100] w-max min-w-[9.5rem] -translate-x-1/2 overflow-visible border border-white/35 bg-primary text-primary-foreground shadow-lg",
                    "motion-safe:origin-top motion-safe:transition motion-safe:duration-150",
                    open
                      ? "motion-safe:scale-y-100 motion-safe:opacity-100"
                      : "pointer-events-none motion-safe:scale-y-95 motion-safe:opacity-0",
                  )}
                >
                  {/* AMP-83/87: 비링크 부모 그룹 제목 — 대비·계층 강화 */}
                  <p
                    id={labelId}
                    className="border-b border-white/40 bg-[#001a33] px-3.5 py-2.5 font-serif text-sm font-medium tracking-[0.06em] text-[#f7f4ee] xl:text-[0.9375rem]"
                  >
                    {chrome(item.i18n)}
                  </p>
                  <ul role="menu" aria-labelledby={labelId}>
                    {children.map((child) => {
                      const active = isNavActive(pathname, child.href);
                      return (
                        <li key={child.href} role="none" className="border-b border-white/25 last:border-b-0">
                          <Link
                            role="menuitem"
                            href={child.href}
                            className={cn(
                              "block px-3.5 py-3 text-left text-[0.9375rem] leading-snug whitespace-nowrap text-primary-foreground transition-colors hover:bg-white/15 xl:text-base",
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
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
