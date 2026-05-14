import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { products } from "../drizzle/schema";
import {
  getStoreSettings,
  updateStoreSettings,
  listProducts,
  getProductWithSizes,
  createProduct,
  updateProduct,
  upsertProductSizes,
  getProductGallery,
  addGalleryImage,
  deleteGalleryImage,
  updateGalleryImageOrder,
  deleteProductSafe,
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  getCustomerSales,
  listSales,
  getSaleWithItems,
  createSale,
  getDashboardMetrics,
  getChartData,
  listStockWithProducts,
  manualStockAdjust,
  getStockHistory,
  listSupplierOrders,
  createSupplierOrder,
  updateSupplierOrder,
  markSupplierOrderReceived,
  listCatalogOrders,
  createCatalogOrder,
  updateCatalogOrderStatus,
  listPublicProducts,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Settings ──────────────────────────────────────────────────────────────
  settings: router({
    get: protectedProcedure.query(() => getStoreSettings()),
    update: protectedProcedure
      .input(
        z.object({
          storeName: z.string().optional(),
          ownerName: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
          logoUrl: z.string().nullable().optional(),
          bannerUrl: z.string().nullable().optional(),
          primaryColor: z.string().optional(),
          instagram: z.string().optional(),
          whatsapp: z.string().optional(),
        })
      )
      .mutation(({ input }) => updateStoreSettings(input)),
  }),

  // ─── Products ──────────────────────────────────────────────────────────────
  products: router({
    list: protectedProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(({ input }) => listProducts(input?.activeOnly)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getProductWithSizes(input.id)),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          team: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          gender: z.string().optional(),
          category: z.string().optional(),
          version: z.string().optional(),
          cost: z.number().min(0),
          price: z.number().min(0),
          showInCatalog: z.boolean().optional(),
          sizes: z.array(z.object({ size: z.string(), stock: z.number().int().min(0) })),
        })
      )
      .mutation(({ input }) => {
        const { sizes, ...productData } = input;
        return createProduct(
          {
            ...productData,
            cost: String(productData.cost),
            avgCost: String(productData.cost),
            price: String(productData.price),
          },
          sizes
        );
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          team: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          gender: z.string().optional(),
          category: z.string().optional(),
          version: z.string().optional(),
          cost: z.number().optional(),
          price: z.number().optional(),
          active: z.boolean().optional(),
          showInCatalog: z.boolean().optional(),
          sizes: z
            .array(z.object({ size: z.string(), stock: z.number().int().min(0) }))
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, sizes, cost, price, ...rest } = input;
        const updateData: Record<string, unknown> = { ...rest };
        if (cost !== undefined) updateData.cost = String(cost);
        if (price !== undefined) updateData.price = String(price);
        await updateProduct(id, updateData as any);
        if (sizes) await upsertProductSizes(id, sizes);
      }),

    gallery: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(({ input }) => getProductGallery(input.productId)),

    addGalleryImage: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          imageUrl: z.string(),
          type: z.string(),
          position: z.number().optional(),
        })
      )
      .mutation(({ input }) => addGalleryImage(input.productId, input.imageUrl, input.type, input.position)),

    deleteGalleryImage: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(({ input }) => deleteGalleryImage(input.imageId)),

    updateGalleryOrder: protectedProcedure
      .input(z.object({ imageId: z.number(), position: z.number() }))
      .mutation(({ input }) => updateGalleryImageOrder(input.imageId, input.position)),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProductSafe(input.id);
        return { success: true };
      }),
  }),

  // ─── Customers ─────────────────────────────────────────────────────────────
  customers: router({
    list: protectedProcedure.query(() => listCustomers()),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getCustomer(input.id)),

    history: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getCustomerSales(input.id)),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          phone: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => createCustomer(input)),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateCustomer(id, data);
      }),
  }),

  // ─── Sales ─────────────────────────────────────────────────────────────────
  sales: router({
    list: protectedProcedure
      .input(
        z.object({
          from: z.date().optional(),
          to: z.date().optional(),
        }).optional()
      )
      .query(({ input }) => listSales(input?.from, input?.to)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getSaleWithItems(input.id)),

    create: protectedProcedure
      .input(
        z.object({
          customerId: z.number(),
          paymentMethod: z.enum([
            "dinheiro",
            "pix",
            "cartao_credito",
            "cartao_debito",
            "transferencia",
            "outro",
          ]),
          saleDate: z.date().optional(),
          discountValue: z.number().min(0).optional(),
          discountPercent: z.number().min(0).max(100).optional(),
          status: z.enum([
            "aguardando_pagamento",
            "pago",
            "aguardando_envio",
            "em_transito",
            "finalizado",
            "pago_50",
            "fazer_pedido_fornecedor",
            "pedido_feito_fornecedor",
          ]).optional(),
          notes: z.string().optional(),
          items: z.array(
            z.object({
              productId: z.number(),
              size: z.string(),
              quantity: z.number().int().min(1),
              unitPrice: z.number().min(0),
              unitCost: z.number().min(0),
            })
          ),
        })
      )
      .mutation(({ input }) => {
        const subtotal = input.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
        const discount = input.discountValue ? input.discountValue : (subtotal * (input.discountPercent || 0)) / 100;
        const total = Math.max(0, subtotal - discount);
        const profit = input.items.reduce(
          (acc, i) => acc + (i.unitPrice - i.unitCost) * i.quantity,
          0
        ) - discount;
        return createSale(
          {
            customerId: input.customerId,
            paymentMethod: input.paymentMethod,
            total: String(total),
            profit: String(Math.max(0, profit)),
            discountValue: String(input.discountValue || 0),
            discountPercent: String(input.discountPercent || 0),
            status: input.status || "aguardando_pagamento",
            saleDate: input.saleDate,
            notes: input.notes,
          },
          input.items
        );
      }),

    metrics: protectedProcedure
      .input(z.object({ from: z.date(), to: z.date() }))
      .query(({ input }) => getDashboardMetrics(input.from, input.to)),

    chartData: protectedProcedure
      .input(z.object({ from: z.date(), to: z.date() }))
      .query(({ input }) => getChartData(input.from, input.to)),
  }),

  // ─── Stock ─────────────────────────────────────────────────────────────────
  stock: router({
    list: protectedProcedure.query(() => listStockWithProducts()),

    adjust: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          size: z.string(),
          newQuantity: z.number().int().min(0),
          reason: z.string().min(5, "Justificativa deve ter pelo menos 5 caracteres"),
        })
      )
      .mutation(({ input }) =>
        manualStockAdjust(input.productId, input.size, input.newQuantity, input.reason)
      ),

    history: protectedProcedure
      .input(z.object({ productId: z.number().optional() }).optional())
      .query(({ input }) => getStockHistory(input?.productId)),
  }),

  // ─── Supplier Orders ────────────────────────────────────────────────────────
  supplierOrders: router({
    list: protectedProcedure.query(() => listSupplierOrders()),

    create: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          size: z.string(),
          quantity: z.number().int().min(1),
          unitCost: z.number().min(0),
          notes: z.string().optional(),
          trackingCode: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const totalCost = input.quantity * input.unitCost;
        return createSupplierOrder({
          productId: input.productId,
          size: input.size,
          quantity: input.quantity,
          unitCost: String(input.unitCost),
          totalCost: String(totalCost),
          notes: input.notes,
          trackingCode: input.trackingCode,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          trackingCode: z.string().optional(),
          status: z.enum(["pendente", "em_transito", "recebido", "cancelado"]).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateSupplierOrder(id, data as any);
      }),

    markReceived: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => markSupplierOrderReceived(input.id)),
  }),

  // ─── Simulator ─────────────────────────────────────────────────────────────
  simulator: router({
    calculate: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          newQuantity: z.number().int().min(1),
          newUnitCost: z.number().min(0),
        })
      )
      .query(async ({ input }) => {
        const product = await getProductWithSizes(input.productId);
        if (!product) throw new Error("Produto não encontrado");

        const currentAvgCost = parseFloat(String(product.avgCost));
        const currentTotal = product.totalUnitsReceived;
        const newAvgCost =
          currentTotal + input.newQuantity > 0
            ? (currentAvgCost * currentTotal + input.newUnitCost * input.newQuantity) /
              (currentTotal + input.newQuantity)
            : input.newUnitCost;

        const currentStock = product.sizes.reduce((acc, s) => acc + s.stock, 0);

        return {
          productName: product.name,
          currentAvgCost,
          currentTotal,
          currentStock,
          newAvgCost: parseFloat(newAvgCost.toFixed(2)),
          newTotal: currentTotal + input.newQuantity,
          newUnitCost: input.newUnitCost,
          newQuantity: input.newQuantity,
          priceSuggested: parseFloat((newAvgCost * 1.5).toFixed(2)),
        };
      }),
  }),

  // ─── Catalog (public) ──────────────────────────────────────────────────────
  catalog: router({
    // Public endpoints
    products: publicProcedure.query(() => listPublicProducts()),
    settings: publicProcedure.query(() => getStoreSettings()),

    submitOrder: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(1),
          customerPhone: z.string().min(1),
          items: z.array(
            z.object({
              productId: z.number(),
              productName: z.string(),
              size: z.string(),
              quantity: z.number().int().min(1),
              unitPrice: z.number(),
            })
          ),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        createCatalogOrder({
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          items: input.items.map((i) => ({ ...i, price: i.unitPrice })),
          notes: input.notes,
        })
      ),

    // Protected endpoints
    orders: protectedProcedure.query(() => listCatalogOrders()),

    orderDetail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const orders = await listCatalogOrders();
        return orders.find((o) => o.id === input.id) ?? null;
      }),

    updateOrderStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["novo", "em_analise", "confirmado", "cancelado", "entregue"]),
        })
      )
      .mutation(({ input }) => updateCatalogOrderStatus(input.id, input.status as any)),
  }),
});

export type AppRouter = typeof appRouter;
