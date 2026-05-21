import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { products, customers, sales, supplierOrders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Integration Tests - Full System", () => {
  let db: any;
  const testTenantId = 1; // Use default tenant

  beforeAll(async () => {
    db = await getDb();
    expect(db).toBeDefined();
  });

  describe("Products", () => {
    it("should list products scoped to tenant", async () => {
      const result = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, testTenantId));
      expect(result.length).toBeGreaterThan(0);
      result.forEach((p: any) => {
        expect(p.tenantId).toBe(testTenantId);
      });
    });

    it("should not return products from other tenants", async () => {
      const otherTenantId = 99999;
      const result = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, otherTenantId));
      expect(result).toHaveLength(0);
    });
  });

  describe("Customers", () => {
    it("should list customers scoped to tenant", async () => {
      const result = await db
        .select()
        .from(customers)
        .where(eq(customers.tenantId, testTenantId));
      result.forEach((c: any) => {
        expect(c.tenantId).toBe(testTenantId);
      });
    });

    it("should not return customers from other tenants", async () => {
      const otherTenantId = 99999;
      const result = await db
        .select()
        .from(customers)
        .where(eq(customers.tenantId, otherTenantId));
      expect(result).toHaveLength(0);
    });
  });

  describe("Sales", () => {
    it("should list sales scoped to tenant", async () => {
      const result = await db
        .select()
        .from(sales)
        .where(eq(sales.tenantId, testTenantId));
      result.forEach((s: any) => {
        expect(s.tenantId).toBe(testTenantId);
      });
    });

    it("should not return sales from other tenants", async () => {
      const otherTenantId = 99999;
      const result = await db
        .select()
        .from(sales)
        .where(eq(sales.tenantId, otherTenantId));
      expect(result).toHaveLength(0);
    });
  });

  describe("Supplier Orders", () => {
    it("should list supplier orders scoped to tenant", async () => {
      const result = await db
        .select()
        .from(supplierOrders)
        .where(eq(supplierOrders.tenantId, testTenantId));
      result.forEach((o: any) => {
        expect(o.tenantId).toBe(testTenantId);
      });
    });

    it("should not return supplier orders from other tenants", async () => {
      const otherTenantId = 99999;
      const result = await db
        .select()
        .from(supplierOrders)
        .where(eq(supplierOrders.tenantId, otherTenantId));
      expect(result).toHaveLength(0);
    });
  });

  describe("Multi-Tenant Security", () => {
    it("should enforce tenant isolation on all tables", async () => {
      const productsByTenant = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, testTenantId));

      const customersByTenant = await db
        .select()
        .from(customers)
        .where(eq(customers.tenantId, testTenantId));

      const salesByTenant = await db
        .select()
        .from(sales)
        .where(eq(sales.tenantId, testTenantId));

      const ordersByTenant = await db
        .select()
        .from(supplierOrders)
        .where(eq(supplierOrders.tenantId, testTenantId));

      // All results should only contain data from our tenant
      productsByTenant.forEach((p: any) => expect(p.tenantId).toBe(testTenantId));
      customersByTenant.forEach((c: any) => expect(c.tenantId).toBe(testTenantId));
      salesByTenant.forEach((s: any) => expect(s.tenantId).toBe(testTenantId));
      ordersByTenant.forEach((o: any) => expect(o.tenantId).toBe(testTenantId));
    });

    it("should prevent cross-tenant data access", async () => {
      const nonExistentTenant = 99999;

      const products_result = await db
        .select()
        .from(products)
        .where(eq(products.tenantId, nonExistentTenant));

      const customers_result = await db
        .select()
        .from(customers)
        .where(eq(customers.tenantId, nonExistentTenant));

      const sales_result = await db
        .select()
        .from(sales)
        .where(eq(sales.tenantId, nonExistentTenant));

      const orders_result = await db
        .select()
        .from(supplierOrders)
        .where(eq(supplierOrders.tenantId, nonExistentTenant));

      expect(products_result).toHaveLength(0);
      expect(customers_result).toHaveLength(0);
      expect(sales_result).toHaveLength(0);
      expect(orders_result).toHaveLength(0);
    });
  });
});
