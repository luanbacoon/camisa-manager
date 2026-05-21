/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import {
  stripeSubscriptions,
  stripePayments,
  stripeInvoices,
  stripeCustomers,
} from "../../drizzle/stripe-schema";
import { eq, and } from "drizzle-orm";
import { verifyWebhookSignature } from "../_core/stripe-helpers";

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(400).json({ error: "Missing signature or webhook secret" });
  }

  // Get raw body for signature verification
  const rawBody = (req as any).rawBody || req.body;

  // Verify webhook signature
  const event = verifyWebhookSignature(
    typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody),
    signature,
    webhookSecret
  );

  if (!event) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Processing event: ${event.type} (${event.id})`);

  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection not available");

    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event as Stripe.CheckoutSessionCompletedEvent, db);
        break;
      }

      case "customer.subscription.created": {
        await handleSubscriptionCreated(event as Stripe.CustomerSubscriptionCreatedEvent, db);
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(event as Stripe.CustomerSubscriptionUpdatedEvent, db);
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event as Stripe.CustomerSubscriptionDeletedEvent, db);
        break;
      }

      case "invoice.payment_succeeded": {
        await handleInvoicePaymentSucceeded(event as Stripe.InvoicePaymentSucceededEvent, db);
        break;
      }

      case "invoice.payment_failed": {
        await handleInvoicePaymentFailed(event as Stripe.InvoicePaymentFailedEvent, db);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

async function handleCheckoutSessionCompleted(
  event: Stripe.CheckoutSessionCompletedEvent,
  db: any
) {
  const session = event.data.object;

  console.log(`[Webhook] Checkout session completed: ${session.id}`);

  // Get user ID from metadata
  const userId = parseInt(session.client_reference_id || "0");
  if (!userId) {
    console.error("[Webhook] No user ID in checkout session");
    return;
  }

  // For subscription mode, subscription will be created separately
  // For payment mode, create payment record
  if (session.mode === "payment" && session.payment_intent) {
    const paymentIntentId = typeof session.payment_intent === "string" 
      ? session.payment_intent 
      : session.payment_intent.id;

    // Store payment record (subscription payments are handled by invoice.payment_succeeded)
    await db.insert(stripePayments).values({
      tenantId: 1, // Default tenant - should be passed in metadata
      userId,
      stripePaymentIntentId: paymentIntentId,
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || "USD",
      status: "succeeded",
      createdAt: new Date(),
      paidAt: new Date(),
    });
  }
}

async function handleSubscriptionCreated(
  event: Stripe.CustomerSubscriptionCreatedEvent,
  db: any
) {
  const subscription = event.data.object;

  console.log(`[Webhook] Subscription created: ${subscription.id}`);

  // Get user ID from metadata
  const userId = parseInt(subscription.metadata?.user_id || "0");
  if (!userId) {
    console.error("[Webhook] No user ID in subscription metadata");
    return;
  }

  // Get plan name
  const planName = subscription.metadata?.plan_name || "unknown";

  // Get price ID
  const stripePriceId = subscription.items.data[0]?.price.id || "";

  // Store subscription
  await db.insert(stripeSubscriptions).values({
    tenantId: 1, // Default tenant
    userId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    stripePriceId,
    planName,
    status: subscription.status as "active" | "past_due" | "canceled" | "unpaid",
    createdAt: new Date(subscription.created * 1000),
  });
}

async function handleSubscriptionUpdated(
  event: Stripe.CustomerSubscriptionUpdatedEvent,
  db: any
) {
  const subscription = event.data.object;

  console.log(`[Webhook] Subscription updated: ${subscription.id}`);

  // Update subscription status
  await db
    .update(stripeSubscriptions)
    .set({
      status: subscription.status as "active" | "past_due" | "canceled" | "unpaid",
      updatedAt: new Date(),
    })
    .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id));
}

async function handleSubscriptionDeleted(
  event: Stripe.CustomerSubscriptionDeletedEvent,
  db: any
) {
  const subscription = event.data.object;

  console.log(`[Webhook] Subscription deleted: ${subscription.id}`);

  // Update subscription status
  await db
    .update(stripeSubscriptions)
    .set({
      status: "canceled",
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(stripeSubscriptions.stripeSubscriptionId, subscription.id));
}

async function handleInvoicePaymentSucceeded(
  event: Stripe.InvoicePaymentSucceededEvent,
  db: any
) {
  const invoice = event.data.object;

  console.log(`[Webhook] Invoice payment succeeded: ${invoice.id}`);

  // Get subscription ID
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) {
    console.error("[Webhook] No subscription ID in invoice");
    return;
  }

  // Get subscription record
  const subscription = await db
    .select()
    .from(stripeSubscriptions)
    .where(eq(stripeSubscriptions.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (subscription.length === 0) {
    console.error(`[Webhook] Subscription not found: ${subscriptionId}`);
    return;
  }

  // Store invoice
  await db.insert(stripeInvoices).values({
    tenantId: subscription[0].tenantId,
    userId: subscription[0].userId,
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: subscriptionId,
    amount: (invoice.amount_paid || 0) / 100,
    currency: invoice.currency || "USD",
    status: invoice.status || "paid",
    createdAt: new Date(invoice.created * 1000),
    paidAt: new Date(),
    invoiceNumber: invoice.number,
  });

  // Also store as payment
  if (invoice.payment_intent) {
    const paymentIntentId = typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : invoice.payment_intent.id;

    await db.insert(stripePayments).values({
      tenantId: subscription[0].tenantId,
      userId: subscription[0].userId,
      stripePaymentIntentId: paymentIntentId,
      stripeInvoiceId: invoice.id,
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency || "USD",
      status: "succeeded",
      createdAt: new Date(invoice.created * 1000),
      paidAt: new Date(),
      description: `Invoice ${invoice.number}`,
    });
  }
}

async function handleInvoicePaymentFailed(
  event: Stripe.InvoicePaymentFailedEvent,
  db: any
) {
  const invoice = event.data.object;

  console.log(`[Webhook] Invoice payment failed: ${invoice.id}`);

  // Get subscription ID
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) {
    console.error("[Webhook] No subscription ID in invoice");
    return;
  }

  // Get subscription record
  const subscription = await db
    .select()
    .from(stripeSubscriptions)
    .where(eq(stripeSubscriptions.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (subscription.length === 0) {
    console.error(`[Webhook] Subscription not found: ${subscriptionId}`);
    return;
  }

  // Update subscription status to past_due
  await db
    .update(stripeSubscriptions)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(stripeSubscriptions.stripeSubscriptionId, subscriptionId));

  console.log(`[Webhook] Subscription ${subscriptionId} marked as past_due`);
}
