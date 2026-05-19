import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { tenantsRouter } from "./routers/tenants";
import { backupsRouter } from "./routers/backups";
import { localAuthRouter } from "./routers/local-auth";
import { reportsRouter } from "./routers/reports";
import { suppliersRouter } from "./routers/suppliers";

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
  createSupplierOrderWithItems,
  updateSupplierOrder,
  markSupplierOrderReceived,
  listCatalogOrders,
  createCatalogOrder,
  updateCatalogOrderStatus,
  updateCatalogOrderStatusWithNotification,
  deleteCatalogOrder,
  listPublicProducts,
  listWhatsAppTemplates,
  getWhatsAppTemplate,
  updateWhatsAppTemplate,
  initializeDefaultTemplates,
  getWhatsAppHistory,
  getWhatsAppMessageStats,
  getWhatsAppHistoryByPhone,
  clearWhatsAppHistory,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  tenants: tenantsRouter,
  backups: backupsRouter,
  localAuth: localAuthRouter,
  reports: reportsRouter,
  suppliers: suppliersRouter,

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
      .query(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        return listProducts(input?.activeOnly, tenantId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        return getProductWithSizes(input.id, tenantId);
      }),

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
      .mutation(({ input, ctx }) => {
        const { sizes, ...productData } = input;
        const tenantId = (ctx.user as any)?.tenantId;
        if (!tenantId) throw new Error("Tenant ID não encontrado");
        return createProduct(
          {
            ...productData,
            tenantId,
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
    list: protectedProcedure.query(({ ctx }) => {
      const tenantId = (ctx.user as any)?.tenantId;
      return listCustomers(tenantId);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        return getCustomer(input.id, tenantId);
      }),

    history: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        return getCustomerSales(input.id, tenantId);
      }),

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
      .mutation(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        if (!tenantId) throw new Error("Tenant ID não encontrado");
        return createCustomer({ ...input, tenantId });
      }),

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
      .query(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        return listSales(input?.from, input?.to, tenantId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        return getSaleWithItems(input.id, tenantId);
      }),

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
      .mutation(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        if (!tenantId) throw new Error("Tenant ID não encontrado");
        const subtotal = input.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
        const discount = input.discountValue ? input.discountValue : (subtotal * (input.discountPercent || 0)) / 100;
        const total = Math.max(0, subtotal - discount);
        const profit = input.items.reduce(
          (acc, i) => acc + (i.unitPrice - i.unitCost) * i.quantity,
          0
        ) - discount;
        return createSale(
          {
            tenantId,
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
      .query(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        return getDashboardMetrics(input.from, input.to, tenantId);
      }),

    chartData: protectedProcedure
      .input(z.object({ from: z.date(), to: z.date() }))
      .query(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        return getChartData(input.from, input.to, tenantId);
      }),
  }),

  // ─── Stock ─────────────────────────────────────────────────────────────────
  stock: router({
    list: protectedProcedure.query(({ ctx }) => {
      const tenantId = (ctx.user as any)?.tenantId;
      return listStockWithProducts(tenantId);
    }),

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
    list: protectedProcedure.query(({ ctx }) => {
      const tenantId = (ctx.user as any)?.tenantId;
      return listSupplierOrders(tenantId);
    }),

    create: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          size: z.string(),
          quantity: z.number().int().min(1),
          unitCost: z.number().min(0),
          supplier: z.string().optional(),
          orderType: z.string().optional(),
          currency: z.string().optional(),
          discount: z.number().min(0).optional(),
          freight: z.number().min(0).optional(),
          orderDate: z.date().optional(),
          deliveryDate: z.date().optional(),
          notes: z.string().optional(),
          trackingCode: z.string().optional(),
        })
      )
      .mutation(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        if (!tenantId) throw new Error("Tenant ID não encontrado");
        const totalCost = input.quantity * input.unitCost;
        return createSupplierOrder({
          tenantId,
          productId: input.productId,
          size: input.size,
          quantity: input.quantity,
          unitCost: String(input.unitCost),
          totalCost: String(totalCost),
          supplier: input.supplier,
          orderType: input.orderType,
          currency: input.currency,
          discount: input.discount ? String(input.discount) : "0",
          freight: input.freight ? String(input.freight) : "0",
          orderedAt: input.orderDate || new Date(),
          deliveryDate: input.deliveryDate,
          notes: input.notes,
          trackingCode: input.trackingCode,
        });
      }),

    createBatch: protectedProcedure
      .input(
        z.object({
          supplier: z.string().optional(),
          orderType: z.string().optional(),
          currency: z.string().optional(),
          discount: z.number().min(0).optional(),
          freight: z.number().min(0).optional(),
          orderDate: z.date().optional(),
          deliveryDate: z.date().optional(),
          notes: z.string().optional(),
          trackingCode: z.string().optional(),
          items: z.array(
            z.object({
              productId: z.number(),
              size: z.string(),
              quantity: z.number().int().min(1),
              unitCost: z.number().min(0),
            })
          ),
        })
      )
      .mutation(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        if (!tenantId) throw new Error("Tenant ID não encontrado");
        return createSupplierOrderWithItems(
          {
            tenantId,
            supplier: input.supplier,
            orderType: input.orderType,
            currency: input.currency,
            discount: input.discount ? String(input.discount) : "0",
            freight: input.freight ? String(input.freight) : "0",
            orderedAt: input.orderDate || new Date(),
            deliveryDate: input.deliveryDate,
            notes: input.notes,
            trackingCode: input.trackingCode,
            status: "pendente",
          },
          input.items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
            unitCost: item.unitCost,
          }))
        );
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

    trackPackage: protectedProcedure
      .input(z.object({ trackingCode: z.string().min(1) }))
      .query(async ({ input }) => {
        try {
          const response = await fetch(
            `https://www.correios.com.br/rastreamento/api/v1/rastreamento?codigo=${input.trackingCode}`,
            {
              headers: {
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0",
              },
            }
          );

          if (!response.ok) {
            return {
              success: false,
              error: "Nao foi possivel rastrear o pacote",
              trackingCode: input.trackingCode,
            };
          }

          const data = await response.json();
          return {
            success: true,
            trackingCode: input.trackingCode,
            status: data.status || "Desconhecido",
            lastUpdate: data.lastUpdate || null,
            events: data.events || [],
            data,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Erro ao rastrear pacote",
            trackingCode: input.trackingCode,
          };
        }
      }),
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
      .mutation(({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId || 1;
        return createCatalogOrder({
          tenantId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          items: input.items.map((i) => ({ ...i, price: i.unitPrice })),
          notes: input.notes,
        });
      }),

    // Protected endpoints
    orders: protectedProcedure.query(({ ctx }) => {
      const tenantId = (ctx.user as any)?.tenantId;
      return listCatalogOrders(tenantId);
    }),

    orderDetail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const tenantId = (ctx.user as any)?.tenantId;
        const orders = await listCatalogOrders(tenantId);
        return orders.find((o) => o.id === input.id) ?? null;
      }),

    updateOrderStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["novo", "em_analise", "confirmado", "cancelado", "entregue"]),
          notifyCustomer: z.boolean().optional().default(true),
        })
      )
      .mutation(({ input }) =>
        updateCatalogOrderStatusWithNotification(
          input.id,
          input.status as any,
          input.notifyCustomer
        )
      ),

    deleteOrder: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteCatalogOrder(input.id)),

    templates: protectedProcedure.query(() => listWhatsAppTemplates()),

    updateTemplate: protectedProcedure
      .input(
        z.object({
          status: z.enum(["novo", "em_analise", "confirmado", "cancelado", "entregue"]),
          messageText: z.string().min(1),
          emoji: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        updateWhatsAppTemplate(input.status, input.messageText, input.emoji)
      ),

    initializeTemplates: protectedProcedure.mutation(() => initializeDefaultTemplates()),

    history: protectedProcedure
      .input(z.object({ orderId: z.number().optional(), limit: z.number().optional() }))
      .query(({ input }) => getWhatsAppHistory(input.orderId, input.limit || 100)),

    stats: protectedProcedure.query(() => getWhatsAppMessageStats()),

    historyByPhone: protectedProcedure
      .input(z.object({ phone: z.string() }))
      .query(({ input }) => getWhatsAppHistoryByPhone(input.phone)),

    clearHistory: protectedProcedure
      .input(z.object({ olderThanDays: z.number().optional().default(0) }))
      .mutation(({ input }) => clearWhatsAppHistory(input.olderThanDays)),
  }),
});

export type AppRouter = typeof appRouter;
