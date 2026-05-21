/**
 * Stripe Router - tRPC procedures for Stripe integration
 */

import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  stripeSubscriptions,
  stripePayments,
  stripeInvoices,
  stripeCustomers,
} from "../../drizzle/stripe-schema";
import { eq, and } from "drizzle-orm";
import {
  createCheckoutSession,
  createPaymentCheckoutSession,
  getSubscription,
  cancelSubscription,
  getPaymentIntent,
  getInvoice,
  getCustomer,
  createOrGetCustomer,
  listSubscriptionInvoices,
} from "../_core/stripe-helpers";

// Stripe price IDs (configure these in your Stripe dashboard)
const STRIPE_PRICES = {
  basic: process.env.STRIPE_PRICE_BASIC || "price_1234567890",
  pro: process.env.STRIPE_PRICE_PRO || "price_0987654321",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || "price_1111111111",
};

export const stripeRouter = router({
  /**
   * Create subscription checkout session
   */
  createSubscriptionCheckout: protectedProcedure
    .input(
      z.object({
        planName: z.enum(["basic", "pro", "enterprise"]),
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const user = ctx.user;
      if (!user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email is required",
        });
      }

      try {
        // Get or create Stripe customer
        const customer = await createOrGetCustomer({
          email: user.email,
          name: user.name,
          metadata: {
            user_id: user.id.toString(),
          },
        });

        // Create checkout session
        const stripePriceId = STRIPE_PRICES[input.planName];
        const checkoutUrl = await createCheckoutSession({
          userId: user.id,
          userEmail: user.email,
          userName: user.name || "Customer",
          stripePriceId,
          planName: input.planName,
          successUrl: `${input.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: input.returnUrl,
        });

        // Store customer reference
        const existingCustomer = await db
          .select()
          .from(stripeCustomers)
          .where(and(
            eq(stripeCustomers.userId, user.id),
            eq(stripeCustomers.tenantId, 1)
          ))
          .limit(1);

        if (existingCustomer.length === 0) {
          await db.insert(stripeCustomers).values({
            tenantId: 1,
            userId: user.id,
            stripeCustomerId: customer.id,
            email: user.email,
            name: user.name,
          });
        }

        return {
          success: true,
          checkoutUrl,
        };
      } catch (error) {
        console.error("[Stripe] Error creating checkout session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  /**
   * Create one-time payment checkout session
   */
  createPaymentCheckout: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        description: z.string(),
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email is required",
        });
      }

      try {
        const checkoutUrl = await createPaymentCheckoutSession({
          userId: user.id,
          userEmail: user.email,
          userName: user.name || "Customer",
          amount: Math.round(input.amount * 100), // Convert to cents
          currency: "USD",
          description: input.description,
          successUrl: `${input.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: input.returnUrl,
        });

        return {
          success: true,
          checkoutUrl,
        };
      } catch (error) {
        console.error("[Stripe] Error creating payment checkout:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment session",
        });
      }
    }),

  /**
   * Get current subscription
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const subscription = await db
      .select()
      .from(stripeSubscriptions)
      .where(and(
        eq(stripeSubscriptions.userId, ctx.user.id),
        eq(stripeSubscriptions.tenantId, 1),
        eq(stripeSubscriptions.status, "active")
      ))
      .limit(1);

    if (subscription.length === 0) {
      return null;
    }

    // Fetch latest details from Stripe
    const stripeSubscription = await getSubscription(subscription[0].stripeSubscriptionId);

    return {
      ...subscription[0],
      stripeData: stripeSubscription,
    };
  }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const subscription = await db
      .select()
      .from(stripeSubscriptions)
      .where(and(
        eq(stripeSubscriptions.userId, ctx.user.id),
        eq(stripeSubscriptions.tenantId, 1),
        eq(stripeSubscriptions.status, "active")
      ))
      .limit(1);

    if (subscription.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active subscription found",
      });
    }

    try {
      const success = await cancelSubscription(subscription[0].stripeSubscriptionId);

      if (success) {
        await db
          .update(stripeSubscriptions)
          .set({
            status: "canceled",
            canceledAt: new Date(),
          })
          .where(eq(stripeSubscriptions.id, subscription[0].id));

        return {
          success: true,
          message: "Subscription canceled successfully",
        };
      } else {
        throw new Error("Failed to cancel subscription on Stripe");
      }
    } catch (error) {
      console.error("[Stripe] Error canceling subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),

  /**
   * Get payment history
   */
  getPaymentHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const payments = await db
        .select()
        .from(stripePayments)
        .where(and(
          eq(stripePayments.userId, ctx.user.id),
          eq(stripePayments.tenantId, 1)
        ))
        .limit(input.limit)
        .offset(input.offset);

      return {
        payments,
        total: payments.length,
      };
    }),

  /**
   * Get subscription invoices
   */
  getInvoices: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const subscription = await db
        .select()
        .from(stripeSubscriptions)
        .where(and(
          eq(stripeSubscriptions.userId, ctx.user.id),
          eq(stripeSubscriptions.tenantId, 1)
        ))
        .limit(1);

      if (subscription.length === 0) {
        return { invoices: [] };
      }

      const invoices = await listSubscriptionInvoices(
        subscription[0].stripeSubscriptionId,
        input.limit
      );

      return {
        invoices: invoices.map((inv) => ({
          id: inv.id,
          number: inv.number,
          amount: inv.amount_paid,
          currency: inv.currency,
          status: inv.status,
          created: inv.created,
          paid: inv.paid,
          url: inv.hosted_invoice_url,
        })),
      };
    }),
});
