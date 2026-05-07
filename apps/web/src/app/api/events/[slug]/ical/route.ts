import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function pad(n: number) { return String(n).padStart(2, "0"); }

function toIcalDate(d: Date): string {
  return [
    d.getUTCFullYear(),
    pad(d.getUTCMonth() + 1),
    pad(d.getUTCDate()),
    "T",
    pad(d.getUTCHours()),
    pad(d.getUTCMinutes()),
    "00Z",
  ].join("");
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.event.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: { venue: true, organizer: true },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const location = event.venue
    ? `${event.venue.name}${event.venue.address ? `, ${event.venue.address}` : ""}`
    : event.venueName ?? "";

  const dtEnd = event.endDate ?? new Date(event.date.getTime() + 2 * 3600000);

  const ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zavestni Dogodki//SI",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@zavestnidogodki.si`,
    `DTSTAMP:${toIcalDate(new Date())}`,
    `DTSTART:${toIcalDate(event.date)}`,
    `DTEND:${toIcalDate(dtEnd)}`,
    `SUMMARY:${event.titleEn}`,
    `DESCRIPTION:${(event.shortDescEn ?? event.descriptionEn).replace(/\n/g, "\\n")}`,
    location ? `LOCATION:${location}` : "",
    `URL:${appUrl}/events/${event.slug ?? event.id}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug ?? event.id}.ics"`,
    },
  });
}
