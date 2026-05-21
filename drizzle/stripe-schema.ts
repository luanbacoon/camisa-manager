/**
 * Stripe Integration Schema
 * 
 * Stores only essential Stripe identifiers and business-specific data.
 * All other Stripe data is fetched from the Stripe API as needed.
 */

import { mysqlTable, text, varchar, datetime, int, decimal, enum as mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * Subscriptions table - Stores subscription references and business metadata
 */
export const stripeSubscriptions = mysqlTable("stripe_subscriptions", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").notNull(),
  userId: int("user_id").notNull(),
  
  // Stripe identifiers (required for API calls)
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
  
  // Subscription metadata
  planName: varchar("plan_name", { length: 100 }).notNull(), // "basic", "pro", "enterprise"
  status: mysqlEnum("status", ["active", "past_due", "canceled", "unpaid"]).notNull().default("active"),
  
  // Dates
  createdAt: datetime("created_at").notNull().defaultFn(() => new Date()),
  updatedAt: datetime("updated_at").notNull().defaultFn(() => new Date()),
  canceledAt: datetime("canceled_at"),
  
  // Business metadata
  notes: text("notes"),
});

/**
 * Payments table - Stores payment references for audit and reporting
 */
export const stripePayments = mysqlTable("stripe_payments", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").notNull(),
  userId: int("user_id").notNull(),
  
  // Stripe identifiers
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).notNull().unique(),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }),
  
  // Payment details (cached for reporting, not source of truth)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: mysqlEnum("status", ["succeeded", "processing", "requires_payment_method", "requires_action"]).notNull(),
  
  // Dates
  createdAt: datetime("created_at").notNull().defaultFn(() => new Date()),
  paidAt: datetime("paid_at"),
  
  // Business metadata
  description: text("description"),
  notes: text("notes"),
});

/**
 * Invoices table - Stores invoice references for subscription billing
 */
export const stripeInvoices = mysqlTable("stripe_invoices", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").notNull(),
  userId: int("user_id").notNull(),
  
  // Stripe identifiers
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }).notNull().unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull(),
  
  // Invoice details (cached for reporting)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  status: mysqlEnum("status", ["draft", "open", "paid", "void", "uncollectible"]).notNull(),
  
  // Dates
  createdAt: datetime("created_at").notNull().defaultFn(() => new Date()),
  dueAt: datetime("due_at"),
  paidAt: datetime("paid_at"),
  
  // Business metadata
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  notes: text("notes"),
});

/**
 * Customers table - Stores Stripe customer references
 */
export const stripeCustomers = mysqlTable("stripe_customers", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").notNull(),
  userId: int("user_id").notNull(),
  
  // Stripe identifier
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull().unique(),
  
  // Local reference
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  
  // Dates
  createdAt: datetime("created_at").notNull().defaultFn(() => new Date()),
  updatedAt: datetime("updated_at").notNull().defaultFn(() => new Date()),
});

export type StripeSubscription = typeof stripeSubscriptions.$inferSelect;
export type InsertStripeSubscription = typeof stripeSubscriptions.$inferInsert;

export type StripePayment = typeof stripePayments.$inferSelect;
export type InsertStripePayment = typeof stripePayments.$inferInsert;

export type StripeInvoice = typeof stripeInvoices.$inferSelect;
export type InsertStripeInvoice = typeof stripeInvoices.$inferInsert;

export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type InsertStripeCustomer = typeof stripeCustomers.$inferInsert;
