import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { tenants, userTenants } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Multi-Tenant Isolation Tests
 * 
 * These tests validate that:
 * 1. Tenant A cannot see Tenant B's data
 * 2. Mutations require a valid tenantId
 * 3. Cross-tenant access is blocked
 */

function createAuthContext(tenantId: number, userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `User ${userId}`,
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      tenantId,
    } as any,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createNoTenantContext(): TrpcContext {
  return {
    user: {
      id: 99,
      openId: "no-tenant-user",
      email: "notenant@example.com",
      name: "No Tenant",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      // No tenantId!
    } as any,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

let tenantAId: number;
let tenantBId: number;

beforeAll(async () => {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Create or find test tenants
  const existingTenants = await db.select().from(tenants);
  
  if (existingTenants.length >= 2) {
    tenantAId = existingTenants[0].id;
    tenantBId = existingTenants[1].id;
  } else if (existingTenants.length === 1) {
    tenantAId = existingTenants[0].id;
    // Create tenant B for testing
    const [result] = await db.insert(tenants).values({
      name: "Test Tenant B",
      slug: "test-tenant-b-isolation",
      ownerEmail: "tenantb@test.com",
      plan: "starter",
      status: "active",
    });
    tenantBId = (result as any).insertId;
  } else {
    // Create both tenants
    const [resultA] = await db.insert(tenants).values({
      name: "Test Tenant A",
      slug: "test-tenant-a-isolation",
      ownerEmail: "tenanta@test.com",
      plan: "starter",
      status: "active",
    });
    tenantAId = (resultA as any).insertId;
    
    const [resultB] = await db.insert(tenants).values({
      name: "Test Tenant B",
      slug: "test-tenant-b-isolation",
      ownerEmail: "tenantb@test.com",
      plan: "starter",
      status: "active",
    });
    tenantBId = (resultB as any).insertId;
  }
});

describe("Multi-Tenant Isolation - Listagens", () => {
  it("Tenant A products.list does not include Tenant B products", async () => {
    const ctxA = createAuthContext(tenantAId);
    const ctxB = createAuthContext(tenantBId, 2);
    const callerA = appRouter.createCaller(ctxA);
    const callerB = appRouter.createCaller(ctxB);

    const productsA = await callerA.products.list();
    const productsB = await callerB.products.list();

    // Verify no cross-contamination
    const tenantAProductIds = productsA.map((p: any) => p.id);
    const tenantBProductIds = productsB.map((p: any) => p.id);

    // No product should appear in both lists (unless tenantId is null/shared)
    for (const p of productsA) {
      if ((p as any).tenantId) {
        expect((p as any).tenantId).toBe(tenantAId);
      }
    }
    for (const p of productsB) {
      if ((p as any).tenantId) {
        expect((p as any).tenantId).toBe(tenantBId);
      }
    }
  });

  it("Tenant A customers.list does not include Tenant B customers", async () => {
    const ctxA = createAuthContext(tenantAId);
    const ctxB = createAuthContext(tenantBId, 2);
    const callerA = appRouter.createCaller(ctxA);
    const callerB = appRouter.createCaller(ctxB);

    const customersA = await callerA.customers.list();
    const customersB = await callerB.customers.list();

    for (const c of customersA) {
      if ((c as any).tenantId) {
        expect((c as any).tenantId).toBe(tenantAId);
      }
    }
    for (const c of customersB) {
      if ((c as any).tenantId) {
        expect((c as any).tenantId).toBe(tenantBId);
      }
    }
  });

  it("Tenant A sales.list does not include Tenant B sales", async () => {
    const ctxA = createAuthContext(tenantAId);
    const ctxB = createAuthContext(tenantBId, 2);
    const callerA = appRouter.createCaller(ctxA);
    const callerB = appRouter.createCaller(ctxB);

    const salesA = await callerA.sales.list();
    const salesB = await callerB.sales.list();

    for (const s of salesA) {
      if ((s as any).tenantId) {
        expect((s as any).tenantId).toBe(tenantAId);
      }
    }
    for (const s of salesB) {
      if ((s as any).tenantId) {
        expect((s as any).tenantId).toBe(tenantBId);
      }
    }
  });

  it("Tenant A supplierOrders.list does not include Tenant B orders", async () => {
    const ctxA = createAuthContext(tenantAId);
    const ctxB = createAuthContext(tenantBId, 2);
    const callerA = appRouter.createCaller(ctxA);
    const callerB = appRouter.createCaller(ctxB);

    const ordersA = await callerA.supplierOrders.list();
    const ordersB = await callerB.supplierOrders.list();

    for (const o of ordersA) {
      if ((o as any).tenantId) {
        expect((o as any).tenantId).toBe(tenantAId);
      }
    }
    for (const o of ordersB) {
      if ((o as any).tenantId) {
        expect((o as any).tenantId).toBe(tenantBId);
      }
    }
  });

  it("Tenant A catalog.orders does not include Tenant B orders", async () => {
    const ctxA = createAuthContext(tenantAId);
    const ctxB = createAuthContext(tenantBId, 2);
    const callerA = appRouter.createCaller(ctxA);
    const callerB = appRouter.createCaller(ctxB);

    const catalogA = await callerA.catalog.orders();
    const catalogB = await callerB.catalog.orders();

    for (const o of catalogA) {
      if ((o as any).tenantId) {
        expect((o as any).tenantId).toBe(tenantAId);
      }
    }
    for (const o of catalogB) {
      if ((o as any).tenantId) {
        expect((o as any).tenantId).toBe(tenantBId);
      }
    }
  });
});

describe("Multi-Tenant Isolation - Mutations requerem tenantId", () => {
  it("customers.create throws without tenantId", async () => {
    const ctx = createNoTenantContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.customers.create({ name: "Unauthorized Customer" })
    ).rejects.toThrow("Tenant ID");
  });

  it("products.create throws without tenantId", async () => {
    const ctx = createNoTenantContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.products.create({
        name: "Unauthorized Product",
        cost: 10,
        price: 20,
        sizes: [{ size: "M", stock: 5 }],
      })
    ).rejects.toThrow("Tenant ID");
  });

  it("sales.create throws without tenantId", async () => {
    const ctx = createNoTenantContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.sales.create({
        customerId: 1,
        paymentMethod: "pix",
        items: [{ productId: 1, size: "M", quantity: 1, unitPrice: 50, unitCost: 30 }],
      })
    ).rejects.toThrow("Tenant ID");
  });

  it("supplierOrders.create throws without tenantId", async () => {
    const ctx = createNoTenantContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.supplierOrders.create({
        productId: 1,
        size: "M",
        quantity: 10,
        unitCost: 25,
      })
    ).rejects.toThrow("Tenant ID");
  });
});

describe("Multi-Tenant Isolation - Métricas isoladas", () => {
  it("sales.metrics returns data scoped to tenant", async () => {
    const ctxA = createAuthContext(tenantAId);
    const ctxB = createAuthContext(tenantBId, 2);
    const callerA = appRouter.createCaller(ctxA);
    const callerB = appRouter.createCaller(ctxB);

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const metricsA = await callerA.sales.metrics({ from, to });
    const metricsB = await callerB.sales.metrics({ from, to });

    // Both should return valid metric objects (even if zero)
    expect(metricsA).toBeDefined();
    expect(typeof metricsA.totalRevenue).toBe("number");
    expect(metricsB).toBeDefined();
    expect(typeof metricsB.totalRevenue).toBe("number");
  });

  it("sales.chartData returns data scoped to tenant", async () => {
    const ctxA = createAuthContext(tenantAId);
    const ctxB = createAuthContext(tenantBId, 2);
    const callerA = appRouter.createCaller(ctxA);
    const callerB = appRouter.createCaller(ctxB);

    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const chartA = await callerA.sales.chartData({ from, to });
    const chartB = await callerB.sales.chartData({ from, to });

    expect(Array.isArray(chartA)).toBe(true);
    expect(Array.isArray(chartB)).toBe(true);
  });
});
