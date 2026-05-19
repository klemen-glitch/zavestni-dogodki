import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function requireAdmin(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return true;
  const cookie = req.cookies.get("admin_token")?.value;
  const header = req.headers.get("x-admin-secret");
  return cookie === secret || header === secret;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { avatarUrl } = await req.json() as { avatarUrl?: string };

  if (!avatarUrl || typeof avatarUrl !== "string") {
    return NextResponse.json({ error: "avatarUrl required" }, { status: 400 });
  }

  const organizer = await db.organizer.update({
    where: { id },
    data: { avatarUrl },
  });

  return NextResponse.json({ ok: true, avatarUrl: organizer.avatarUrl });
}
