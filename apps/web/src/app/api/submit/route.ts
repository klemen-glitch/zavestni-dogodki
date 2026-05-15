import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const PRICES: Record<string, number> = { basic: 1500, featured: 3500 }; // in cents

// 🎉 Launch promo: skip payment entirely. Set to false to re-enable Stripe.
const LAUNCH_PROMO = true;

export async function POST(req: Request) {
  const body = await req.json();
  const { email, tier = "basic", title, date, category } = body;

  if (!email || !title || !date || !category) {
    return NextResponse.json({ error: "Manjkajo obvezna polja." }, { status: 400 });
  }

  // Save submission to DB (marked paid=true during promo)
  const submission = await db.submission.create({
    data: {
      email,
      formData: body,
      paid: LAUNCH_PROMO,
      status: "pending",
    },
  });

  // During launch promo: skip Stripe, go straight to success
  if (LAUNCH_PROMO) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      redirect: `${appUrl}/submit/success?submission_id=${submission.id}&promo=true`,
    });
  }

  // Create Stripe checkout session (if Stripe is configured)
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "line_items[0][price_data][currency]": "eur",
        "line_items[0][price_data][product_data][name]": `${tier === "featured" ? "Izpostavljena" : "Osnovna"} objava · ${title}`,
        "line_items[0][price_data][unit_amount]": String(PRICES[tier] ?? 1500),
        "line_items[0][quantity]": "1",
        mode: "payment",
        success_url: `${appUrl}/submit/success?session_id={CHECKOUT_SESSION_ID}&submission_id=${submission.id}`,
        cancel_url: `${appUrl}/submit?cancelled=true`,
        customer_email: email,
        "metadata[submission_id]": submission.id,
        "metadata[tier]": tier,
      }),
    });

    if (res.ok) {
      const session = (await res.json()) as { url: string; id: string };
      await db.submission.update({ where: { id: submission.id }, data: { stripeSessionId: session.id } });
      return NextResponse.json({ checkoutUrl: session.url });
    }
  }

  // Fallback: no Stripe configured, just save submission
  return NextResponse.json({ ok: true, submissionId: submission.id });
}
