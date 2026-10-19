import { resolveUploadRequest } from "@/lib/upload-store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const file = await resolveUploadRequest(segments ?? []);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400, immutable",
    },
  });
}
