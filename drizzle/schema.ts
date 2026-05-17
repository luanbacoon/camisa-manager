import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users (auth) ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Store Settings ───────────────────────────────────────────────────────────
export const storeSettings = mysqlTable("store_settings", {
  id: int("id").autoincrement().primaryKey(),
  storeName: varchar("storeName", { length: 255 }).notNull().default("Minha Loja"),
  ownerName: varchar("ownerName", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  logoUrl: text("logoUrl"),
  bannerUrl: text("bannerUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#1a472a"),
  instagram: varchar("instagram", { length: 255 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreSettings = typeof storeSettings.$inferSelect;

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  team: varchar("team", { length: 255 }),
  description: text("description"),
  imageUrl: text("imageUrl"),
  gender: varchar("gender", { length: 50 }),
  category: varchar("category", { length: 100 }),
  version: varchar("version", { length: 100 }),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  avgCost: decimal("avgCost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  active: boolean("active").notNull().default(true),
  showInCatalog: boolean("showInCatalog").notNull().default(true),
  totalUnitsReceived: int("totalUnitsReceived").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Product Sizes / Stock ────────────────────────────────────────────────────
export const productSizes = mysqlTable("product_sizes", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  stock: int("stock").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductSize = typeof productSizes.$inferSelect;
export type InsertProductSize = typeof productSizes.$inferInsert;

// ─── Product Gallery ──────────────────────────────────────────────────────────
export const productGallery = mysqlTable("product_gallery", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'frente', 'costas', 'detalhe', etc
  position: int("position").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductGalleryItem = typeof productGallery.$inferSelect;
export type InsertProductGalleryItem = typeof productGallery.$inferInsert;

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  notes: text("notes"),
  isDefault: boolean("isDefault").notNull().default(false),
  totalSpent: decimal("totalSpent", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalOrders: int("totalOrders").notNull().default(0),
  lastPurchaseAt: timestamp("lastPurchaseAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── Sales ────────────────────────────────────────────────────────────────────
export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", [
    "dinheiro",
    "pix",
    "cartao_credito",
    "cartao_debito",
    "transferencia",
    "outro",
  ]).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  profit: decimal("profit", { precision: 12, scale: 2 }).notNull().default("0.00"),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull().default("0.00"),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).notNull().default("0.00"),
  status: mysqlEnum("status", [
    "aguardando_pagamento",
    "pago",
    "aguardando_envio",
    "em_transito",
    "finalizado",
    "pago_50",
    "fazer_pedido_fornecedor",
    "pedido_feito_fornecedor",
  ]).notNull().default("aguardando_pagamento"),
  notes: text("notes"),
  saleDate: timestamp("saleDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

// ─── Sale Items ───────────────────────────────────────────────────────────────
export const saleItems = mysqlTable("sale_items", {
  id: int("id").autoincrement().primaryKey(),
  saleId: int("saleId").notNull(),
  productId: int("productId").notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }).notNull().default("0.00"),
});

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = typeof saleItems.$inferInsert;

// ─── Supplier Orders ──────────────────────────────────────────────────────────
export const supplierOrders = mysqlTable("supplier_orders", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  quantity: int("quantity").notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("totalCost", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pendente", "em_transito", "recebido", "cancelado"])
    .notNull()
    .default("pendente"),
  supplier: varchar("supplier", { length: 255 }),
  orderType: varchar("orderType", { length: 50 }).default("Nacional"),
  currency: varchar("currency", { length: 20 }).default("BRL"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  freight: decimal("freight", { precision: 10, scale: 2 }).default("0"),
  trackingCode: varchar("trackingCode", { length: 50 }),
  trackingStatus: varchar("trackingStatus", { length: 100 }),
  lastTrackingUpdate: timestamp("lastTrackingUpdate"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }).unique(),
  notes: text("notes"),
  orderedAt: timestamp("orderedAt").defaultNow().notNull(),
  deliveryDate: timestamp("deliveryDate"),
  receivedAt: timestamp("receivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierOrder = typeof supplierOrders.$inferSelect;
export type InsertSupplierOrder = typeof supplierOrders.$inferInsert;

// ─── Supplier Order Items ─────────────────────────────────────────────────────
export const supplierOrderItems = mysqlTable("supplier_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  quantity: int("quantity").notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("totalCost", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupplierOrderItem = typeof supplierOrderItems.$inferSelect;
export type InsertSupplierOrderItem = typeof supplierOrderItems.$inferInsert;

// ─── Tracking History ─────────────────────────────────────────────────────────
export const trackingHistory = mysqlTable("tracking_history", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  trackingCode: varchar("trackingCode", { length: 50 }).notNull(),
  status: varchar("status", { length: 100 }).notNull(),
  description: text("description"),
  events: json("events"),
  lastUpdate: timestamp("lastUpdate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrackingHistory = typeof trackingHistory.$inferSelect;
export type InsertTrackingHistory = typeof trackingHistory.$inferInsert;

// ─── Stock Adjustments ────────────────────────────────────────────────────────
export const stockAdjustments = mysqlTable("stock_adjustments", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  size: varchar("size", { length: 20 }).notNull(),
  quantityBefore: int("quantityBefore").notNull(),
  quantityAfter: int("quantityAfter").notNull(),
  delta: int("delta").notNull(),
  reason: text("reason").notNull(),
  type: mysqlEnum("type", ["venda", "pedido_recebido", "ajuste_manual", "devolucao"]).notNull(),
  referenceId: int("referenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockAdjustment = typeof stockAdjustments.$inferSelect;

// ─── Catalog Orders (public) ──────────────────────────────────────────────────
export const catalogOrders = mysqlTable("catalog_orders", {
  id: int("id").autoincrement().primaryKey(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  items: json("items").notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["novo", "em_analise", "confirmado", "cancelado"])
    .notNull()
    .default("novo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CatalogOrder = typeof catalogOrders.$inferSelect;

// ─── WhatsApp Message Templates ────────────────────────────────────────────────
export const whatsappTemplates = mysqlTable("whatsapp_templates", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["novo", "em_analise", "confirmado", "cancelado", "entregue"])
    .notNull()
    .unique(),
  messageText: text("messageText").notNull(),
  emoji: varchar("emoji", { length: 10 }).default("📦"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsAppTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsAppTemplate = typeof whatsappTemplates.$inferInsert;

// ─── WhatsApp Message History ─────────────────────────────────────────────────
export const whatsappHistory = mysqlTable("whatsapp_history", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId"),
  customerPhone: varchar("customerPhone", { length: 30 }).notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  messageText: text("messageText").notNull(),
  status: mysqlEnum("status", ["enviado", "entregue", "lido", "falha"]).notNull().default("enviado"),
  messageId: varchar("messageId", { length: 255 }),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsAppHistory = typeof whatsappHistory.$inferSelect;
export type InsertWhatsAppHistory = typeof whatsappHistory.$inferInsert;

// ─── Tenants (Multi-Loja) ─────────────────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 63 }).notNull().unique(), // subdomain: slug.camisamanager.com
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  logo: text("logo"),
  plan: mysqlEnum("plan", ["basico", "profissional", "premium", "enterprise"])
    .default("basico")
    .notNull(),
  status: mysqlEnum("status", ["ativo", "suspenso", "cancelado"]).default("ativo").notNull(),
  maxProducts: int("maxProducts").default(100).notNull(),
  maxUsers: int("maxUsers").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ─── User Tenants (Relação entre usuários e tenants) ──────────────────────────
export const userTenants = mysqlTable("user_tenants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tenantId: int("tenantId").notNull(),
  role: mysqlEnum("role", ["admin", "gerente", "vendedor", "visualizador"])
    .default("vendedor")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserTenant = typeof userTenants.$inferSelect;
export type InsertUserTenant = typeof userTenants.$inferInsert;

// ─── Roles e Permissões ────────────────────────────────────────────────────────
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(), // ex: "products.create"
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// ─── Role Permissions (Relação entre roles e permissões) ──────────────────────
export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  role: mysqlEnum("role", ["admin", "gerente", "vendedor", "visualizador"]).notNull(),
  permissionId: int("permissionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

// ─── Auditoria (Logs de ações) ─────────────────────────────────────────────────
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 255 }).notNull(), // ex: "products.create", "sales.update"
  resource: varchar("resource", { length: 255 }).notNull(), // ex: "product", "sale"
  resourceId: int("resourceId"),
  changes: json("changes"), // JSON com antes/depois
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

// ─── Subscriptions (Stripe) ────────────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().unique(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).notNull().unique(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  plan: mysqlEnum("plan", ["basico", "profissional", "premium", "enterprise"])
    .default("basico")
    .notNull(),
  status: mysqlEnum("status", ["ativo", "cancelado", "suspenso", "expirado"])
    .default("ativo")
    .notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  canceledAt: timestamp("canceledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Invoices (Faturas) ────────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  status: mysqlEnum("status", ["rascunho", "aberto", "pago", "falha", "cancelado"])
    .default("aberto")
    .notNull(),
  paidAt: timestamp("paidAt"),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── 2FA Secrets (Autenticação de Dois Fatores) ────────────────────────────────
export const twoFactorSecrets = mysqlTable("two_factor_secrets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  secret: varchar("secret", { length: 255 }).notNull(), // Base32 encoded secret
  enabled: boolean("enabled").default(false).notNull(),
  backupCodes: json("backupCodes"), // Array de códigos de backup
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TwoFactorSecret = typeof twoFactorSecrets.$inferSelect;
export type InsertTwoFactorSecret = typeof twoFactorSecrets.$inferInsert;

// ─── Login Attempts (Rastreamento de tentativas de login) ──────────────────────
export const loginAttempts = mysqlTable("login_attempts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  success: boolean("success").default(false).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertLoginAttempt = typeof loginAttempts.$inferInsert;

// ─── Backups ──────────────────────────────────────────────────────────────────
export const backups = mysqlTable("backups", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  description: text("description"),
  size: varchar("size", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  restoredAt: timestamp("restoredAt"),
});

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = typeof backups.$inferInsert;


// ─── Local Authentication (Email/Password) ──────────────────────────────────
export const localUsers = mysqlTable("local_users", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "manager", "seller", "viewer"]).default("viewer").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

// ─── Password Reset Tokens ──────────────────────────────────────────────────
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => localUsers.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// ─── Session Tokens (Local Auth) ────────────────────────────────────────────
export const sessionTokens = mysqlTable("session_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => localUsers.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionToken = typeof sessionTokens.$inferSelect;
export type InsertSessionToken = typeof sessionTokens.$inferInsert;
