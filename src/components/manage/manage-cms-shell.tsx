"use client";

import { ManageHomeCms } from "@/components/manage/manage-home-cms";
import type { HomeIntroSlidesSettings } from "@/lib/home-intro-slides-types";

export function ManageCmsShell({ homeInitial }: { homeInitial: HomeIntroSlidesSettings }) {
  return <ManageHomeCms initial={homeInitial} />;
}