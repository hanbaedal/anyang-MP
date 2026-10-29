"use client";

import { NavTree } from "@/components/nav-tree";
import { useT } from "@/components/locale-provider";
import { isStaffRole, type Role } from "@/lib/auth-types";

/** lg+ 탐색기 — 스태프(로그인)만. 게스트는 헤더 GNB가 주경로. */
export function SiteSidebar({ role }: { role?: Role | null }) {
  const t = useT();
  if (!isStaffRole(role)) return null;

  return (
    <aside className="hidden h-full w-36 shrink-0 overflow-y-auto overflow-x-hidden overscroll-y-contain border-r bg-card lg:block">
      <p className="sticky top-0 z-10 border-b border-border bg-card px-1 py-1 text-[10px] font-medium leading-tight text-muted-foreground">
        {t("explorer")}
      </p>
      <NavTree role={role} />
    </aside>
  );
}
