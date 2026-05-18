import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Neveljaven email" }, { status: 400 });
  }

  await db.subscriber.updateMany({
    where: { email },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
