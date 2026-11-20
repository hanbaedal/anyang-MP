export type Role = "supervisor" | "admin" | "ceo";

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: Role;
  phone?: string;
  email?: string;
  title?: string;
};

export function isStaffRole(role: Role | string | undefined | null): role is Role {
  return role === "supervisor" || role === "admin" || role === "ceo";
}

export function isCmsStaff(role: Role | string | undefined | null): role is "supervisor" | "admin" | "ceo" {
  return role === "supervisor" || role === "admin" || role === "ceo";
}

export function isCeo(role: Role | string | undefined | null): role is "ceo" {
  return role === "ceo";
}

export function isStatusStaff(role: Role | string | undefined | null): role is "supervisor" | "ceo" {
  return role === "supervisor" || role === "ceo";
}

/**
 * AMP-147 역할 메뉴 매트릭스 (게스트 홈 레이아웃과 무관 — GNB만)
 * - guest: 홈(공개) 메뉴만
 * - anyang001 admin: 홈 + 홈페이지관리
 * - anyang005 admin: 홈 + 관리 + 계약수납·거래처품목·주문재고
 * - ceo (ceoisme): 위 + 경영관리
 * - supervisor: 전부 + 슈퍼바이저
 */

/** 홈페이지 관리 GNB — admin·ceo·supervisor */
export function canAccessHomepageManage(role?: Role | string | null) {
  return isCmsStaff(role);
}

/**
 * 업무(계약수납·거래처품목·주문재고) GNB.
 * - ceo·supervisor: 항상
 * - admin: WORK_PROGRAM_ADMINS(기본 anyang005)만 (anyang001 제외)
 */
export function canAccessWorkProgram(role?: Role | string | null, username?: string | null) {
  if (role === "ceo" || role === "supervisor") return true;
  if (role !== "admin") return false;
  const allow = (process.env.WORK_PROGRAM_ADMINS || "anyang005")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(String(username || "").trim().toLowerCase());
}

/** 경영관리 GNB — ceo·supervisor */
export function canAccessExecOverview(role?: Role | string | null) {
  return isStatusStaff(role);
}

/** 슈퍼바이저 전용 GNB */
export function canAccessSupervisorNav(role?: Role | string | null) {
  return role === "supervisor";
}

export function afterLoginPath(_user?: SessionUser) {
  return "/sitemap";
}
