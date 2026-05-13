import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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
    user,
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

describe("simulator.calculate", () => {
  it("throws when product not found", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.simulator.calculate({ productId: 999999, newQuantity: 10, newUnitCost: 50 })
    ).rejects.toThrow();
  });
});

describe("catalog.products", () => {
  it("returns array from public endpoint", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.catalog.products();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("catalog.settings", () => {
  it("returns settings from public endpoint", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.catalog.settings();
    // May be null if no settings row, but should not throw
    expect(result === null || typeof result === "object").toBe(true);
  });
});

describe("catalog.submitOrder", () => {
  it("rejects order with empty customer name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.catalog.submitOrder({
        customerName: "",
        customerPhone: "11999999999",
        items: [{ productId: 1, productName: "Camisa", size: "M", quantity: 1, unitPrice: 50 }],
      })
    ).rejects.toThrow();
  });

  it("rejects order with empty phone", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.catalog.submitOrder({
        customerName: "João",
        customerPhone: "",
        items: [{ productId: 1, productName: "Camisa", size: "M", quantity: 1, unitPrice: 50 }],
      })
    ).rejects.toThrow();
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
    const result = await caller.sales.list({});
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
