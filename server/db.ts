import { and, desc, eq, gte, lte, sql, sum, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  products,
  productSizes,
  productGallery,
  customers,
  sales,
  saleItems,
  supplierOrders,
  stockAdjustments,
  storeSettings,
  catalogOrders,
  type InsertProduct,
  type InsertProductSize,
  type InsertProductGalleryItem,
  type InsertCustomer,
  type InsertSale,
  type InsertSaleItem,
  type InsertSupplierOrder,
  type CatalogOrder,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Store Settings ───────────────────────────────────────────────────────────
export async function getStoreSettings() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(storeSettings).limit(1);
  return result[0] ?? null;
}

export async function updateStoreSettings(data: Partial<typeof storeSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(storeSettings).limit(1);
  if (existing.length === 0) {
    await db.insert(storeSettings).values({ storeName: "Minha Loja", ...data });
  } else {
    await db.update(storeSettings).set(data).where(eq(storeSettings.id, existing[0].id));
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function listProducts(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(products);
  if (activeOnly) {
    return db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.createdAt));
  }
  return query.orderBy(desc(products.createdAt));
}

export async function getProductWithSizes(productId: number) {
  const db = await getDb();
  if (!db) return null;
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return null;
  const sizes = await db.select().from(productSizes).where(eq(productSizes.productId, productId));
  return { ...product, sizes };
}

export async function createProduct(data: InsertProduct, sizes: { size: string; stock: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(products).values(data);
  const productId = (result as any).insertId as number;
  if (sizes.length > 0) {
    await db.insert(productSizes).values(sizes.map((s) => ({ productId, size: s.size, stock: s.stock })));
  }
  return productId;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function upsertProductSizes(productId: number, sizes: { size: string; stock: number }[]) {
  const db = await getDb();
  if (!db) return;
  for (const s of sizes) {
    const existing = await db
      .select()
      .from(productSizes)
      .where(and(eq(productSizes.productId, productId), eq(productSizes.size, s.size)))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(productSizes)
        .set({ stock: s.stock })
        .where(and(eq(productSizes.productId, productId), eq(productSizes.size, s.size)));
    } else {
      await db.insert(productSizes).values({ productId, size: s.size, stock: s.stock });
    }
  }
}

// ─── Customers ────────────────────────────────────────────────────────────────
export async function listCustomers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function getCustomer(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return customer ?? null;
}

export async function createCustomer(data: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(customers).values(data);
  return (result as any).insertId as number;
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) return;
  await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function getCustomerSales(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  const salesList = await db
    .select()
    .from(sales)
    .where(eq(sales.customerId, customerId))
    .orderBy(desc(sales.createdAt));
  const result = [];
  for (const sale of salesList) {
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
    const itemsWithProduct = [];
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      itemsWithProduct.push({ ...item, product: product ?? null });
    }
    result.push({ ...sale, items: itemsWithProduct });
  }
  return result;
}

// ─── Sales ────────────────────────────────────────────────────────────────────
export async function listSales(from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(sales);
  const conditions = [];
  if (from) conditions.push(gte(sales.createdAt, from));
  if (to) conditions.push(lte(sales.createdAt, to));
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  return query.orderBy(desc(sales.createdAt));
}

export async function getSaleWithItems(saleId: number) {
  const db = await getDb();
  if (!db) return null;
  const [sale] = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
  if (!sale) return null;
  const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
  const itemsWithProduct = [];
  for (const item of items) {
    const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    itemsWithProduct.push({ ...item, product: product ?? null });
  }
  const [customer] = await db.select().from(customers).where(eq(customers.id, sale.customerId)).limit(1);
  return { ...sale, items: itemsWithProduct, customer: customer ?? null };
}

export async function createSale(
  saleData: InsertSale,
  items: { productId: number; size: string; quantity: number; unitPrice: number; unitCost: number }[]
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const [result] = await db.insert(sales).values(saleData);
  const saleId = (result as any).insertId as number;

  for (const item of items) {
    await db.insert(saleItems).values({
      saleId,
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      unitCost: String(item.unitCost),
    });

    // Decrement stock
    const [ps] = await db
      .select()
      .from(productSizes)
      .where(and(eq(productSizes.productId, item.productId), eq(productSizes.size, item.size)))
      .limit(1);

    const before = ps?.stock ?? 0;
    const after = Math.max(0, before - item.quantity);

    if (ps) {
      await db
        .update(productSizes)
        .set({ stock: after })
        .where(and(eq(productSizes.productId, item.productId), eq(productSizes.size, item.size)));
    }

    await db.insert(stockAdjustments).values({
      productId: item.productId,
      size: item.size,
      quantityBefore: before,
      quantityAfter: after,
      delta: -(item.quantity),
      reason: `Venda #${saleId}`,
      type: "venda",
      referenceId: saleId,
    });
  }

  // Update customer stats
  await db
    .update(customers)
    .set({
      totalSpent: sql`totalSpent + ${saleData.total}`,
      totalOrders: sql`totalOrders + 1`,
      lastPurchaseAt: new Date(),
    })
    .where(eq(customers.id, saleData.customerId));

  return saleId;
}

export async function getDashboardMetrics(from: Date, to: Date) {
  const db = await getDb();
  if (!db) return null;

  const salesInPeriod = await db
    .select()
    .from(sales)
    .where(and(gte(sales.createdAt, from), lte(sales.createdAt, to)));

  const totalRevenue = salesInPeriod.reduce((acc, s) => acc + parseFloat(String(s.total)), 0);
  const totalProfit = salesInPeriod.reduce((acc, s) => acc + parseFloat(String(s.profit)), 0);
  const totalSales = salesInPeriod.length;
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const activeCustomers = new Set(salesInPeriod.map((s) => s.customerId)).size;

  return { totalRevenue, totalProfit, totalSales, avgTicket, margin, activeCustomers };
}

export async function getChartData(from: Date, to: Date) {
  const db = await getDb();
  if (!db) return [];

  const salesInPeriod = await db
    .select()
    .from(sales)
    .where(and(gte(sales.createdAt, from), lte(sales.createdAt, to)))
    .orderBy(sales.createdAt);

  // Group by day
  const grouped: Record<string, { revenue: number; profit: number; count: number }> = {};
  for (const s of salesInPeriod) {
    const day = s.createdAt.toISOString().split("T")[0];
    if (!grouped[day]) grouped[day] = { revenue: 0, profit: 0, count: 0 };
    grouped[day].revenue += parseFloat(String(s.total));
    grouped[day].profit += parseFloat(String(s.profit));
    grouped[day].count += 1;
  }

  return Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
}

// ─── Stock ────────────────────────────────────────────────────────────────────
export async function listStockWithProducts() {
  const db = await getDb();
  if (!db) return [];
  const sizes = await db.select().from(productSizes);
  const result = [];
  for (const ps of sizes) {
    const [product] = await db.select().from(products).where(eq(products.id, ps.productId)).limit(1);
    if (product) result.push({ ...ps, product });
  }
  return result;
}

export async function manualStockAdjust(
  productId: number,
  size: string,
  newQuantity: number,
  reason: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const [ps] = await db
    .select()
    .from(productSizes)
    .where(and(eq(productSizes.productId, productId), eq(productSizes.size, size)))
    .limit(1);

  const before = ps?.stock ?? 0;
  const delta = newQuantity - before;

  if (ps) {
    await db
      .update(productSizes)
      .set({ stock: newQuantity })
      .where(and(eq(productSizes.productId, productId), eq(productSizes.size, size)));
  } else {
    await db.insert(productSizes).values({ productId, size, stock: newQuantity });
  }

  await db.insert(stockAdjustments).values({
    productId,
    size,
    quantityBefore: before,
    quantityAfter: newQuantity,
    delta,
    reason,
    type: "ajuste_manual",
  });
}

export async function getStockHistory(productId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (productId) {
    return db
      .select()
      .from(stockAdjustments)
      .where(eq(stockAdjustments.productId, productId))
      .orderBy(desc(stockAdjustments.createdAt))
      .limit(100);
  }
  return db.select().from(stockAdjustments).orderBy(desc(stockAdjustments.createdAt)).limit(100);
}

// ─── Supplier Orders ──────────────────────────────────────────────────────────
export async function listSupplierOrders() {
  const db = await getDb();
  if (!db) return [];
  const orders = await db.select().from(supplierOrders).orderBy(desc(supplierOrders.createdAt));
  const result = [];
  for (const order of orders) {
    const [product] = await db.select().from(products).where(eq(products.id, order.productId)).limit(1);
    result.push({ ...order, product: product ?? null });
  }
  return result;
}

export async function createSupplierOrder(data: InsertSupplierOrder) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(supplierOrders).values(data);
  return (result as any).insertId as number;
}

export async function updateSupplierOrder(id: number, data: Partial<InsertSupplierOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(supplierOrders).set(data).where(eq(supplierOrders.id, id));
}

export async function markSupplierOrderReceived(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const [order] = await db.select().from(supplierOrders).where(eq(supplierOrders.id, id)).limit(1);
  if (!order) throw new Error("Order not found");
  if (order.status === "recebido") throw new Error("Order already received");

  await db
    .update(supplierOrders)
    .set({ status: "recebido", receivedAt: new Date() })
    .where(eq(supplierOrders.id, id));

  // Update stock
  const [ps] = await db
    .select()
    .from(productSizes)
    .where(and(eq(productSizes.productId, order.productId), eq(productSizes.size, order.size)))
    .limit(1);

  const before = ps?.stock ?? 0;
  const after = before + order.quantity;

  if (ps) {
    await db
      .update(productSizes)
      .set({ stock: after })
      .where(and(eq(productSizes.productId, order.productId), eq(productSizes.size, order.size)));
  } else {
    await db.insert(productSizes).values({ productId: order.productId, size: order.size, stock: after });
  }

  await db.insert(stockAdjustments).values({
    productId: order.productId,
    size: order.size,
    quantityBefore: before,
    quantityAfter: after,
    delta: order.quantity,
    reason: `Pedido ao fornecedor #${id} recebido`,
    type: "pedido_recebido",
    referenceId: id,
  });

  // Recalculate avg cost
  const [product] = await db.select().from(products).where(eq(products.id, order.productId)).limit(1);
  if (product) {
    const currentAvgCost = parseFloat(String(product.avgCost));
    const currentTotal = product.totalUnitsReceived;
    const newUnitCost = parseFloat(String(order.unitCost));
    const newQty = order.quantity;
    const newAvgCost =
      currentTotal + newQty > 0
        ? (currentAvgCost * currentTotal + newUnitCost * newQty) / (currentTotal + newQty)
        : newUnitCost;

    await db
      .update(products)
      .set({
        avgCost: String(newAvgCost.toFixed(2)),
        totalUnitsReceived: currentTotal + newQty,
      })
      .where(eq(products.id, order.productId));
  }
}

// ─── Catalog Orders ───────────────────────────────────────────────────────────
export async function listCatalogOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(catalogOrders).orderBy(desc(catalogOrders.createdAt));
}

export async function createCatalogOrder(data: Omit<typeof catalogOrders.$inferInsert, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(catalogOrders).values(data as any);
  return (result as any).insertId as number;
}

export async function updateCatalogOrderStatus(
  id: number,
  status: "novo" | "em_analise" | "confirmado" | "cancelado"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(catalogOrders).set({ status }).where(eq(catalogOrders.id, id));
}

export async function listPublicProducts() {
  const db = await getDb();
  if (!db) return [];
  const prods = await db
    .select()
    .from(products)
    .where(and(eq(products.active, true), eq(products.showInCatalog, true)))
    .orderBy(products.name);
  const result = [];
  for (const p of prods) {
    const sizes = await db
      .select()
      .from(productSizes)
      .where(eq(productSizes.productId, p.id));
    const gallery = await db
      .select()
      .from(productGallery)
      .where(eq(productGallery.productId, p.id))
      .orderBy(productGallery.position);
    result.push({ ...p, sizes, gallery });
  }
  return result;
}

// ─── Product Gallery ──────────────────────────────────────────────────────────
export async function getProductGallery(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(productGallery)
    .where(eq(productGallery.productId, productId))
    .orderBy(productGallery.position);
}

export async function addGalleryImage(
  productId: number,
  imageUrl: string,
  type: string,
  position: number = 0
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(productGallery).values({ productId, imageUrl, type, position });
  return (result as any).insertId as number;
}

export async function deleteGalleryImage(imageId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(productGallery).where(eq(productGallery.id, imageId));
}

export async function updateGalleryImageOrder(imageId: number, position: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(productGallery).set({ position }).where(eq(productGallery.id, imageId));
}
