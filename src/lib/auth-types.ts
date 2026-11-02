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

/** 홈페이지 관리 GNB — admin·ceo·supervisor */
export function canAccessHomepageManage(role?: Role | string | null) {
  return isCmsStaff(role);
}

/**
 * 업무프로그램 GNB.
 * - ceo·supervisor: 항상
 * - admin: WORK_PROGRAM_ADMINS(기본 anyang005)에 포함된 아이디만 (anyang001은 홈페이지만)
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

export function afterLoginPath(_user?: SessionUser) {
  return "/sitemap";
}
