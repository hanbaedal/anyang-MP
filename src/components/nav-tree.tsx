"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, ChevronRight, FileText, Folder, FolderOpen, Home, LayoutTemplate, Map, Shield } from "lucide-react";
import { NAV, NAV_TONE_SURFACE, type NavTone } from "@/lib/site";
import { WORK_NAV } from "@/lib/work-nav";
import { EXEC_NAV } from "@/lib/exec-nav";
import { manageNavItems } from "@/lib/manage-nav";
import { SUPERVISOR_NAV } from "@/lib/supervisor-nav";
import { cn } from "@/lib/utils";
import { useT } from "@/components/locale-provider";
import { tKo } from "@/lib/i18n";
import { isCmsStaff, isStatusStaff, isStaffRole, type Role } from "@/lib/auth-types";

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/account")) return pathname === "/account" || pathname.startsWith("/account/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupOpen(pathname: string, href: string, children?: { href: string }[]) {
  if (children?.some((child) => isNavActive(pathname, child.href))) return true;
  return isNavActive(pathname, href);
}

/** 사이트맵과 같은 파스텔 톤으로 1차 메뉴 구분 */
function toneGroup(tone: NavTone) {
  return cn("mb-1.5 overflow-hidden rounded-md border select-none", NAV_TONE_SURFACE[tone]);
}

const currentRow = "bg-white/55 font-medium text-primary";

export function NavTree({
  onNavigate,
  fit,
  role,
}: {
  onNavigate?: () => void;
  fit?: boolean;
  role?: Role | null;
}) {
  const row = cn(
    "flex h-6 items-center gap-0.5 px-1 text-left hover:bg-white/45",
    fit ? "w-max max-w-full whitespace-nowrap" : "w-full",
  );
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const staff = isStaffRole(role);
  const cms = isCmsStaff(role);
  const workOpenDefault = staff;
  const execOpenDefault = isStatusStaff(role);
  const supervisor = role === "supervisor";
  const manageOpenDefault = cms;
  const supervisorOpenDefault = supervisor;

  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev };
      for (const item of NAV) {
        if (item.children?.length && groupOpen(pathname, item.href, item.children)) {
          next[item.i18n] = true;
        }
      }
      if (workOpenDefault) next.work = true;
      if (execOpenDefault) next.exec = true;
      if (manageOpenDefault) next.manage = true;
      if (supervisorOpenDefault) next.supervisor = true;
      if (supervisor && SUPERVISOR_NAV.some((item) => isNavActive(pathname, item.href))) {
        next.supervisor = true;
      }
      return next;
    });
  }, [pathname, workOpenDefault, execOpenDefault, manageOpenDefault, supervisorOpenDefault, supervisor]);

  const workExpanded = open.work ?? workOpenDefault;
  const execExpanded = open.exec ?? execOpenDefault;
  const manageExpanded = open.manage ?? manageOpenDefault;
  const supervisorExpanded = open.supervisor ?? supervisorOpenDefault;
  const manageLinks = cms ? manageNavItems() : [];
  const supervisorActive = supervisor && SUPERVISOR_NAV.some((item) => isNavActive(pathname, item.href));

  return (
    <nav aria-label={t("explorer")} className={cn("space-y-0 px-0.5 py-0.5 text-[12px] leading-none", fit && "w-max")}>
      <div className={toneGroup("home")}>
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(row, pathname === "/" && currentRow)}
        >
          <Home className="size-3 shrink-0 text-muted-foreground" aria-hidden />
          <span className={cn(!fit && "truncate")}>{t("home")}</span>
        </Link>
      </div>
      <ul className="space-y-0">
        {NAV.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const expanded = open[item.i18n] ?? groupOpen(pathname, item.href, item.children);
          const currentLeaf = !hasChildren && isNavActive(pathname, item.href);
          const parentExact = pathname === item.href;

          return (
            <li key={item.i18n} className={toneGroup(item.tone)}>
              {hasChildren ? (
                <div className={cn(row, (groupOpen(pathname, item.href, item.children) || parentExact) && "text-primary", parentExact && currentRow)}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={t(item.i18n)}
                    onClick={() => setOpen((prev) => ({ ...prev, [item.i18n]: !expanded }))}
                    className="flex size-6 shrink-0 items-center justify-center"
                  >
                    <ChevronRight
                      className={cn("size-3 text-muted-foreground transition-transform", expanded && "rotate-90")}
                      aria-hidden
                    />
                  </button>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={parentExact ? "page" : undefined}
                    className="flex min-w-0 flex-1 items-center gap-0.5"
                  >
                    {expanded ? (
                      <FolderOpen className="size-3 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <Folder className="size-3 shrink-0 text-primary/80" aria-hidden />
                    )}
                    <span className={cn("font-medium", !fit && "truncate")}>{t(item.i18n)}</span>
                  </Link>
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={currentLeaf ? "page" : undefined}
                  className={cn(row, currentLeaf && currentRow)}
                >
                  <Map className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                  <span className={cn("font-medium", !fit && "truncate")}>{t(item.i18n)}</span>
                </Link>
              )}
              {hasChildren && expanded ? (
                <ul className="divide-y divide-black/5 border-t border-black/10">
                  {item.children!.map((child) => {
                    const current = isNavActive(pathname, child.href);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onNavigate}
                          aria-current={current ? "page" : undefined}
                          className={cn(row, "pl-5", current && currentRow)}
                        >
                          <FileText className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                          <span className={cn(!fit && "truncate")}>{t(child.i18n)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
        {staff ? (
          <li className={toneGroup("guide")}>
            <button
              type="button"
              aria-expanded={workExpanded}
              onClick={() => setOpen((prev) => ({ ...prev, work: !workExpanded }))}
              className={cn(row, workOpenDefault && "text-primary")}
            >
              <ChevronRight
                className={cn("size-3 shrink-0 text-muted-foreground transition-transform", workExpanded && "rotate-90")}
                aria-hidden
              />
              {workExpanded ? (
                <FolderOpen className="size-3 shrink-0 text-primary" aria-hidden />
              ) : (
                <Briefcase className="size-3 shrink-0 text-primary/80" aria-hidden />
              )}
              <span className={cn("font-medium", !fit && "truncate")}>{tKo("work.program")}</span>
            </button>
            {workExpanded ? (
              <ul className="divide-y divide-black/5 border-t border-black/10">
                {WORK_NAV.map((child) => {
                  const current = isNavActive(pathname, child.href);
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={current ? "page" : undefined}
                        className={cn(row, "pl-5", current && currentRow)}
                      >
                        <FileText className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                        <span className={cn(!fit && "truncate")}>{tKo(child.i18n)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        ) : null}
        {isStatusStaff(role) ? (
          <li className={toneGroup("lots")}>
            <button
              type="button"
              aria-expanded={execExpanded}
              onClick={() => setOpen((prev) => ({ ...prev, exec: !execExpanded }))}
              className={cn(row, execOpenDefault && "text-primary")}
            >
              <ChevronRight
                className={cn("size-3 shrink-0 text-muted-foreground transition-transform", execExpanded && "rotate-90")}
                aria-hidden
              />
              {execExpanded ? (
                <FolderOpen className="size-3 shrink-0 text-primary" aria-hidden />
              ) : (
                <Folder className="size-3 shrink-0 text-primary/80" aria-hidden />
              )}
              <span className={cn("font-medium", !fit && "truncate")}>{tKo("work.overview")}</span>
            </button>
            {execExpanded ? (
              <ul className="divide-y divide-black/5 border-t border-black/10">
                {EXEC_NAV.map((child) => {
                  const current = isNavActive(pathname, child.href);
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={current ? "page" : undefined}
                        className={cn(row, "pl-5", current && currentRow)}
                      >
                        <FileText className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                        <span className={cn(!fit && "truncate")}>{tKo(child.i18n)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        ) : null}
        {cms ? (
          <li className={toneGroup("support")}>
            <button
              type="button"
              aria-expanded={manageExpanded}
              onClick={() => setOpen((prev) => ({ ...prev, manage: !manageExpanded }))}
              className={cn(row, manageOpenDefault && "text-primary")}
            >
              <ChevronRight
                className={cn("size-3 shrink-0 text-muted-foreground transition-transform", manageExpanded && "rotate-90")}
                aria-hidden
              />
              {manageExpanded ? (
                <FolderOpen className="size-3 shrink-0 text-primary" aria-hidden />
              ) : (
                <LayoutTemplate className="size-3 shrink-0 text-primary/80" aria-hidden />
              )}
              <span className={cn("font-medium", !fit && "truncate")}>{tKo("manage.homepage")}</span>
            </button>
            {manageExpanded ? (
              <ul className="divide-y divide-black/5 border-t border-black/10">
                {manageLinks.map((child) => {
                  const current = isNavActive(pathname, child.href);
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={current ? "page" : undefined}
                        className={cn(row, "pl-5", current && currentRow)}
                      >
                        <FileText className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                        <span className={cn(!fit && "truncate")}>{tKo(child.i18n)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        ) : null}
        {supervisor ? (
          <li className={toneGroup("more")}>
            <button
              type="button"
              aria-expanded={supervisorExpanded}
              onClick={() => setOpen((prev) => ({ ...prev, supervisor: !supervisorExpanded }))}
              className={cn(row, supervisorActive && "text-primary")}
            >
              <ChevronRight
                className={cn("size-3 shrink-0 text-muted-foreground transition-transform", supervisorExpanded && "rotate-90")}
                aria-hidden
              />
              {supervisorExpanded ? (
                <FolderOpen className="size-3 shrink-0 text-primary" aria-hidden />
              ) : (
                <Shield className="size-3 shrink-0 text-primary/80" aria-hidden />
              )}
              <span className={cn("font-medium", !fit && "truncate")}>{tKo("nav.supervisor")}</span>
            </button>
            {supervisorExpanded ? (
              <ul className="divide-y divide-black/5 border-t border-black/10">
                {SUPERVISOR_NAV.map((child) => {
                  const current = isNavActive(pathname, child.href);
                  return (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={current ? "page" : undefined}
                        className={cn(row, "pl-5", current && currentRow)}
                      >
                        <FileText className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                        <span className={cn(!fit && "truncate")}>{tKo(child.i18n)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
