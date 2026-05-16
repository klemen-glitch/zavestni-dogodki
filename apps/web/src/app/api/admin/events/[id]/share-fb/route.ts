import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postEventToFBGroup, buildFBPostPreview } from "@conscious-slovenia/publisher";

function isAuthorized(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return true;
  const fromHeader = req.headers.get("x-admin-secret");
  const fromAuth = req.headers.get("authorization")?.replace("Bearer ", "");
  return fromHeader === secret || fromAuth === secret;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    include: { organizer: true, venue: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const hasFbToken = !!process.env.FB_ACCESS_TOKEN;

  if (!hasFbToken) {
    // Return a preview of what would be posted instead
    const preview = buildFBPostPreview({
      event: {
        ...event,
        organizer: event.organizer ? {
          name: event.organizer.name,
          instagram: event.organizer.instagram,
          website: event.organizer.website,
        } : null,
        venue: event.venue ? { name: event.venue.name, city: event.venue.city } : null,
      },
    });
    return NextResponse.json({
      ok: false,
      error: "FB_ACCESS_TOKEN not set — here is a preview of the post",
      preview,
    });
  }

  const result = await postEventToFBGroup({
    event: {
      ...event,
      organizer: event.organizer ? {
        name: event.organizer.name,
        instagram: event.organizer.instagram,
        website: event.organizer.website,
      } : null,
      venue: event.venue ? { name: event.venue.name, city: event.venue.city } : null,
    },
  });

  return NextResponse.json(result);
}

/** GET: returns a preview of what would be posted */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    include: { organizer: true, venue: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const preview = buildFBPostPreview({
    event: {
      ...event,
      organizer: event.organizer ? {
        name: event.organizer.name,
        instagram: event.organizer.instagram,
        website: event.organizer.website,
      } : null,
      venue: event.venue ? { name: event.venue.name, city: event.venue.city } : null,
    },
  });

  return NextResponse.json({ preview });
}
