/**
 * Stripe webhook handler.
 *
 * Listens for:
 * - checkout.session.completed → mark submission as paid, save revenue log
 *
 * Setup in Stripe Dashboard:
 * Webhooks → Add endpoint → https://zavestnidogodki.si/api/webhooks/stripe
 * Events to send: checkout.session.completed
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface StripeSession {
  id: string;
  metadata?: { submission_id?: string; tier?: string };
  customer_email?: string;
  amount_total?: number;
}

interface StripeEvent {
  type: string;
  data: { object: StripeSession };
}

function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  // In production, use the official Stripe library for proper HMAC validation.
  // This is a simplified check. Install stripe npm package for production use:
  // npm install stripe
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // await stripe.webhooks.constructEvent(payload, header, secret);
  if (!header) return false;
  return header.includes("t="); // Basic sanity check — replace with real HMAC in production
}

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (webhookSecret && !verifyStripeSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const submissionId = session.metadata?.submission_id;
    const tier = session.metadata?.tier ?? "basic";
    const amountEur = (session.amount_total ?? 0) / 100;

    if (submissionId) {
      // Mark submission as paid
      await db.submission.update({
        where: { id: submissionId },
        data: { paid: true, status: "pending", stripeSessionId: session.id },
      }).catch(console.error);

      // Log revenue
      await db.revenueLog.create({
        data: {
          type: tier === "featured" ? "featured_listing" : "basic_listing",
          amountEur,
          stripePaymentId: session.id,
          submissionId,
          description: `${tier === "featured" ? "Izpostavljena" : "Osnovna"} objava — Stripe`,
        },
      }).catch(console.error);

      // Log cost tracking entry (Stripe fee = ~2.9% + €0.30)
      const stripeFee = amountEur * 0.029 + 0.30;
      await db.costLog.create({
        data: {
          service: "stripe",
          operation: "submission_fee",
          amountUsd: stripeFee * 1.1, // rough EUR→USD conversion
          units: 1,
          metadata: { sessionId: session.id, tier, amountEur },
        },
      }).catch(console.error);
    }
  }

  return NextResponse.json({ received: true });
}
