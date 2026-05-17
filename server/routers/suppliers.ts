import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
  deleteSupplier,
} from "../db/suppliers";

export const suppliersRouter = router({
  /**
   * Listar fornecedores
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const tenantId = (ctx.user as any)?.tenantId;
      if (!tenantId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Tenant ID não encontrado no contexto",
        });
      }

      const suppliers = await listSuppliers(tenantId);
      return { success: true, data: suppliers };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Erro ao listar fornecedores",
      });
    }
  }),

  /**
   * Obter fornecedor por ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const tenantId = (ctx.user as any)?.tenantId;
        if (!tenantId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Tenant ID não encontrado no contexto",
          });
        }

        const supplier = await getSupplier(input.id, tenantId);
        if (!supplier) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fornecedor não encontrado",
          });
        }

        return { success: true, data: supplier };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao obter fornecedor",
        });
      }
    }),

  /**
   * Criar novo fornecedor
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        cnpj: z.string().optional(),
        contactPerson: z.string().optional(),
        paymentTerms: z.string().optional(),
        deliveryTime: z.string().optional(),
        minOrder: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const tenantId = (ctx.user as any)?.tenantId;
        if (!tenantId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Tenant ID não encontrado no contexto",
          });
        }

        const supplier = await createSupplier(tenantId, input);
        return { success: true, data: supplier };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao criar fornecedor",
        });
      }
    }),

  /**
   * Atualizar fornecedor
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        cnpj: z.string().optional(),
        contactPerson: z.string().optional(),
        paymentTerms: z.string().optional(),
        deliveryTime: z.string().optional(),
        minOrder: z.string().optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const tenantId = (ctx.user as any)?.tenantId;
        if (!tenantId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Tenant ID não encontrado no contexto",
          });
        }

        const supplier = await updateSupplier(input.id, tenantId, input);
        return { success: true, data: supplier };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao atualizar fornecedor",
        });
      }
    }),

  /**
   * Desativar fornecedor
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const tenantId = (ctx.user as any)?.tenantId;
        if (!tenantId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Tenant ID não encontrado no contexto",
          });
        }

        await deactivateSupplier(input.id, tenantId);
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao desativar fornecedor",
        });
      }
    }),

  /**
   * Deletar fornecedor
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const tenantId = (ctx.user as any)?.tenantId;
        if (!tenantId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Tenant ID não encontrado no contexto",
          });
        }

        await deleteSupplier(input.id, tenantId);
        return { success: true };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao deletar fornecedor",
        });
      }
    }),
});
