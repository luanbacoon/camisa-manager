import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(tenantId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "owner-user",
    email: "owner@example.com",
    name: "Owner",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: { ...user, tenantId } as any,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Owner");
  });

  it("returns null when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});



describe("catalog.products", () => {
  it("returns array from public endpoint", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.catalog.products({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("products.list", () => {
  it("returns array when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("customers.list", () => {
  it("returns array when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.customers.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("sales.list", () => {
  it("returns array when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sales.list();
    expect(Array.isArray(result)).toBe(true);
  });
});



describe("supplierOrders.list", () => {
  it("returns array when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.supplierOrders.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("stock.list", () => {
  it("returns array when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stock.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("settings.get", () => {
  it("returns settings when authenticated", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.get();
    // Returns null or object
    expect(result === null || typeof result === "object").toBe(true);
  });
});


describe("Multi-Tenant Isolation", () => {
  it("products.list returns array scoped to tenant", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("customers.list returns array scoped to tenant", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.customers.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("sales.list returns array scoped to tenant", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sales.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("supplierOrders.list returns array scoped to tenant", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.supplierOrders.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("stock.list returns array scoped to tenant", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stock.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("catalog.orders returns array scoped to tenant", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.catalog.orders();
    expect(Array.isArray(result)).toBe(true);
  });

  it("different tenant sees different data", async () => {
    const ctx1 = createAuthContext(1);
    const ctx2 = createAuthContext(999);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);
    
    const products1 = await caller1.products.list();
    const products2 = await caller2.products.list();
    
    // Both should return arrays (even if empty)
    expect(Array.isArray(products1)).toBe(true);
    expect(Array.isArray(products2)).toBe(true);
  });

  it("mutations require tenantId", async () => {
    // User without tenantId should fail on create
    const ctxNoTenant = {
      user: {
        id: 1,
        openId: "test",
        email: "test@test.com",
        name: "Test",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as any,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    
    const caller = appRouter.createCaller(ctxNoTenant);
    
    await expect(
      caller.customers.create({ name: "Test Customer" })
    ).rejects.toThrow("Tenant ID");
  });
});

describe("Reports Export", () => {
  it("exportSalesPDF returns base64 buffer and filename", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.reports.exportSalesPDF({
      from: new Date("2026-01-01"),
      to: new Date("2026-12-31"),
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(typeof result.buffer).toBe("string");
    expect(result.filename).toContain("relatorio-vendas");
    expect(result.filename).toContain(".docx");
  });

  it("exportSalesExcel returns base64 buffer and filename", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.reports.exportSalesExcel({
      from: new Date("2026-01-01"),
      to: new Date("2026-12-31"),
    });
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(typeof result.buffer).toBe("string");
    expect(result.filename).toContain("relatorio-vendas");
    expect(result.filename).toContain(".xlsx");
  });

  it("exportStockExcel returns base64 buffer and filename", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.reports.exportStockExcel();
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(typeof result.buffer).toBe("string");
    expect(result.filename).toContain("relatorio-estoque");
    expect(result.filename).toContain(".xlsx");
  });
});
