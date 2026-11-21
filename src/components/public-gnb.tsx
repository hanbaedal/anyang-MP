"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
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
  compact = false,
}: {
  className?: string;
  role?: Role | null;
  username?: string | null;
  /** AMP-150: 스태프 로그인 시 역할 메뉴를 헤더에 작게 */
  compact?: boolean;
}) {
  const t = useT();
  const pathname = usePathname();
  const chrome = isGuestLocalePath(pathname) ? t : tKo;
  const items = publicGnbItemsForRole(role, username);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | undefined>();
  const [portalReady, setPortalReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseId = useId();

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenKey(null), 120);
  };

  const openMenu = (key: string) => {
    cancelClose();
    setOpenKey(key);
  };

  useEffect(() => {
    setPortalReady(true);
    return () => cancelClose();
  }, []);

  useEffect(() => {
    cancelClose();
    setOpenKey(null);
  }, [pathname]);

  useLayoutEffect(() => {
    if (!openKey) {
      setPanelStyle(undefined);
      return;
    }
    const trigger = triggerRefs.current.get(openKey);
    if (!trigger) return;
    const place = () => {
      const rect = trigger.getBoundingClientRect();
      setPanelStyle({
        position: "fixed",
        top: rect.bottom,
        left: Math.min(Math.max(rect.left + rect.width / 2, 96), window.innerWidth - 96),
        transform: "translateX(-50%)",
        /* AMP-165: 헤더 isolation·본문 z-0 위 — 포털 서브메뉴 항상 최상단 */
        zIndex: 500,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [openKey]);

  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenKey(null);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      const inRoot = rootRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inRoot && !inPanel) setOpenKey(null);
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

  const openItem = openKey ? items.find((item) => item.i18n === openKey) : undefined;
  const openChildren = openItem?.children ?? [];

  return (
    <nav
      ref={rootRef}
      aria-label={chrome("menu")}
      /* AMP-151: overflow-x-auto는 overflow-y도 auto로 계산되어 서브메뉴를 자름 → visible 유지 */
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

          return (
            <li
              key={item.i18n}
              ref={(el) => {
                if (el) triggerRefs.current.set(item.i18n, el);
                else triggerRefs.current.delete(item.i18n);
              }}
              className={cn(
                "relative flex h-full shrink-0 overflow-visible",
                "after:absolute after:top-1/2 after:right-0 after:z-0 after:h-4 after:w-px after:-translate-y-1/2 after:bg-[color:var(--pastel-chrome-border)] last:after:hidden",
              )}
              onMouseEnter={() => hasChildren && openMenu(item.i18n)}
              onMouseLeave={() => hasChildren && scheduleClose()}
            >
              <Link
                href={item.href}
                className={cn(
                  "relative z-[1] flex h-full items-center justify-center font-medium whitespace-nowrap transition-colors",
                  "text-[color:var(--pastel-chrome-fg)] hover:bg-primary/8",
                  compact
                    ? "min-w-0 px-1.5 text-[0.75rem] xl:px-2 xl:text-[0.8125rem]"
                    : "min-w-[4.25rem] px-2 text-[0.9375rem] xl:min-w-[5rem] xl:px-2.5 xl:text-base",
                  (open || parentActive) && "bg-primary/12",
                )}
                aria-expanded={hasChildren ? open : undefined}
                aria-controls={hasChildren ? panelId : undefined}
                aria-haspopup={hasChildren ? "menu" : undefined}
                onFocus={() => hasChildren && openMenu(item.i18n)}
              >
                {chrome(item.i18n)}
              </Link>
            </li>
          );
        })}
      </ul>

      {portalReady && openItem && openChildren.length > 0 && panelStyle
        ? createPortal(
            <div
              ref={panelRef}
              id={`${baseId}-${openItem.i18n}`}
              role="presentation"
              style={panelStyle}
              className="w-max min-w-[9.5rem] pt-1"
              onMouseEnter={() => openMenu(openItem.i18n)}
              onMouseLeave={scheduleClose}
            >
              <div className="overflow-visible border border-white/35 bg-primary text-primary-foreground shadow-lg">
                <p
                  id={`${baseId}-${openItem.i18n}-label`}
                  className="border-b border-white/40 bg-[#001a33] px-3.5 py-2.5 font-serif text-sm font-medium tracking-[0.06em] text-[#f7f4ee] xl:text-[0.9375rem]"
                >
                  {chrome(openItem.i18n)}
                </p>
                <ul role="menu" aria-labelledby={`${baseId}-${openItem.i18n}-label`}>
                  {openChildren.map((child) => {
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
            </div>,
            document.body,
          )
        : null}
    </nav>
  );
}
