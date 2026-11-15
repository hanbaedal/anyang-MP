import { requireCmsStaff } from "@/lib/auth";
import { ensureAuthSeed } from "@/lib/staff";

export const dynamic = "force-dynamic";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  await ensureAuthSeed();
  await requireCmsStaff();
  return <div className="min-h-full">{children}</div>;
}
