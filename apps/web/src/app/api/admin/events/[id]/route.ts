import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { EventStatus } from "@conscious-slovenia/database";

function isAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const cookie = req.headers.get("cookie") ?? "";
  const cookieMatch = cookie.match(/admin_token=([^;]+)/);
  return cookieMatch?.[1] === secret || req.headers.get("x-admin-secret") === secret;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, featured } = body as { status?: EventStatus; featured?: boolean };

  const event = await db.event.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(featured !== undefined && { featured }),
    },
  });

  return NextResponse.json({ event });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
