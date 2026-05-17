import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("supplierOrders.trackPackage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when tracking code is empty", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    try {
      await caller.supplierOrders.trackPackage({ trackingCode: "" });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });

  it("returns error structure when API call fails", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Mock fetch to return error response
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    global.fetch = mockFetch;

    const result = await caller.supplierOrders.trackPackage({
      trackingCode: "INVALID123",
    });

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("error");
    expect(result.trackingCode).toBe("INVALID123");
  });

  it("handles network errors gracefully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Mock fetch to throw error
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));

    global.fetch = mockFetch;

    const result = await caller.supplierOrders.trackPackage({
      trackingCode: "AA123456789BR",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network error");
    expect(result.trackingCode).toBe("AA123456789BR");
  });

  it("returns success structure when API responds", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Mock fetch to return success response
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "Em Trânsito",
        lastUpdate: new Date().toISOString(),
        events: [
          { description: "Objeto saiu para entrega", status: "em_transito" },
        ],
      }),
    });

    global.fetch = mockFetch;

    const result = await caller.supplierOrders.trackPackage({
      trackingCode: "AA123456789BR",
    });

    expect(result.success).toBe(true);
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("trackingCode");
    expect(result.trackingCode).toBe("AA123456789BR");
  });
});
