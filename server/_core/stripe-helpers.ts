/**
 * Stripe Helpers - Utilities for Stripe integration
 */

import Stripe from "stripe";
import { ENV } from "./env";

let stripeInstance: Stripe | null = null;

/**
 * Get Stripe instance
 */
export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    stripeInstance = new Stripe(ENV.stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });
  }
  return stripeInstance;
}

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName: string;
  stripePriceId: string;
  planName: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: params.userEmail,
    line_items: [
      {
        price: params.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
    client_reference_id: params.userId.toString(),
    metadata: {
      user_id: params.userId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
      plan_name: params.planName,
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return session.url;
}

/**
 * Create checkout session for one-time payment
 */
export async function createPaymentCheckoutSession(params: {
  userId: number;
  userEmail: string;
  userName: string;
  amount: number; // in cents
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: params.userEmail,
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: params.description,
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
    client_reference_id: params.userId.toString(),
    metadata: {
      user_id: params.userId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName,
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return session.url;
}

/**
 * Get subscription details from Stripe
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error(`[Stripe] Error retrieving subscription ${subscriptionId}:`, error);
    return null;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  const stripe = getStripe();

  try {
    await stripe.subscriptions.del(subscriptionId);
    return true;
  } catch (error) {
    console.error(`[Stripe] Error canceling subscription ${subscriptionId}:`, error);
    return false;
  }
}

/**
 * Get payment intent details
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
  const stripe = getStripe();

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error(`[Stripe] Error retrieving payment intent ${paymentIntentId}:`, error);
    return null;
  }
}

/**
 * Get invoice details
 */
export async function getInvoice(invoiceId: string): Promise<Stripe.Invoice | null> {
  const stripe = getStripe();

  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice;
  } catch (error) {
    console.error(`[Stripe] Error retrieving invoice ${invoiceId}:`, error);
    return null;
  }
}

/**
 * Get customer details
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  const stripe = getStripe();

  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error(`[Stripe] Error retrieving customer ${customerId}:`, error);
    return null;
  }
}

/**
 * Create or retrieve Stripe customer
 */
export async function createOrGetCustomer(params: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const stripe = getStripe();

  // Try to find existing customer by email
  const customers = await stripe.customers.list({
    email: params.email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata,
  });

  return customer;
}

/**
 * List subscription invoices
 */
export async function listSubscriptionInvoices(
  subscriptionId: string,
  limit = 10
): Promise<Stripe.Invoice[]> {
  const stripe = getStripe();

  try {
    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      limit,
    });
    return invoices.data;
  } catch (error) {
    console.error(`[Stripe] Error listing invoices for subscription ${subscriptionId}:`, error);
    return [];
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event | null {
  const stripe = getStripe();

  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    return event;
  } catch (error) {
    console.error("[Stripe] Webhook signature verification failed:", error);
    return null;
  }
}
