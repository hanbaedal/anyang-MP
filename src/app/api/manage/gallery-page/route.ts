import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getGalleryPageSettings, saveGalleryPageSettings } from "@/lib/gallery-page";
import { requireStaffApi } from "@/lib/manage-guard";

export async function GET() {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  return NextResponse.json({ ok: true, settings: await getGalleryPageSettings() });
}

export async function PUT(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  const body = (await request.json()) as { heroImage?: string };
  try {
    const settings = await saveGalleryPageSettings({ heroImage: body.heroImage });
    revalidatePath("/gallery");
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "저장에 실패했습니다." },
      { status: 500 },
    );
  }
}