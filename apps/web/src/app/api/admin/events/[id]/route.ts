import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, approvalEmailHtml } from "@/lib/email";
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
    include: { organizer: true },
  });

  // Send approval email to organizer
  if ((status === "APPROVED" || status === "FEATURED") && event.organizer?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
    const eventUrl = `${appUrl}/events/${event.slug ?? event.id}`;
    sendEmail({
      to: event.organizer.email,
      subject: `Vaš dogodek je odobren! 🌿 — ${event.titleEn}`,
      html: approvalEmailHtml(event.titleEn, eventUrl),
    }).catch(console.error);
  }

  return NextResponse.json({ event });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
