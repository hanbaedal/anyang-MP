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

export function afterLoginPath(_user?: SessionUser) {
  return "/sitemap";
}
