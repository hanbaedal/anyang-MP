import { readSession } from "@/lib/auth";
import { isCmsStaff } from "@/lib/auth-types";

/** 공개 페이지 ?cmsEdit=1 — 직원 세션 있을 때만 슬롯 클릭 편집 */
export async function readCmsEditEnabled(searchParams: Promise<{ cmsEdit?: string } | undefined>) {
  const sp = (await searchParams) ?? {};
  const session = await readSession();
  return sp.cmsEdit === "1" && Boolean(session && isCmsStaff(session.role));
}