import { NextResponse } from "next/server";
import { getNoticesPageSettings, saveNoticesPageSettings } from "@/lib/notices-page";
import { requireStaffApi } from "@/lib/manage-guard";

export async function GET() {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  return NextResponse.json({ ok: true, settings: await getNoticesPageSettings() });
}

export async function PUT(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  const body = (await request.json()) as { listImage?: string; galleryId?: string };
  try {
    const settings = await saveNoticesPageSettings({
      listImage: body.listImage,
      galleryId: body.galleryId,
    });
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
