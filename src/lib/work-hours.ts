/** 사용시간 제한 없음. */
export function isStaffWorkHour(_d = new Date()) {
  return true;
}

/** 사용시간 제한 없음. */
export function msUntilStaffWorkEnd(_d = new Date()) {
  return 0;
}

/** 사용시간 제한 없음. */
export function isWorkHourLimitedRole(_role: string | null | undefined) {
  return false;
}

export function roleFromSessionToken(token: string | undefined | null) {
  const payload = token?.split(".")[0];
  if (!payload) return "";
  try {
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = JSON.parse(atob(b64 + pad)) as { role?: string };
    return json.role ?? "";
  } catch {
    return "";
  }
}
