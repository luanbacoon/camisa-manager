import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateSalesReportData, generateStockReportData } from "../_core/reports";

export const reportsRouter = router({
  /**
   * Gerar relatório de vendas
   */
  sales: protectedProcedure
    .input(
      z.object({
        from: z.date(),
        to: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const tenantId = (ctx.user as any)?.tenantId;
        if (!tenantId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Tenant ID não encontrado no contexto",
          });
        }
        const reportData = await generateSalesReportData(tenantId, input.from, input.to);
        return { success: true, data: reportData };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao gerar relatório de vendas",
        });
      }
    }),

  /**
   * Gerar relatório de estoque
   */
  stock: protectedProcedure.query(async ({ ctx }) => {
    try {
      const tenantId = (ctx.user as any)?.tenantId;
      if (!tenantId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Tenant ID não encontrado no contexto",
        });
      }
      const reportData = await generateStockReportData(tenantId);
      return { success: true, data: reportData };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Erro ao gerar relatório de estoque",
      });
    }
  }),

  /**
   * Exportar relatório de vendas como PDF
   */
  exportSalesPDF: protectedProcedure
    .input(
      z.object({
        from: z.date(),
        to: z.date(),
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
        const reportData = await generateSalesReportData(tenantId, input.from, input.to);

        // Aqui você integraria com uma biblioteca de PDF
        // Por enquanto, retornamos os dados para o cliente gerar o PDF
        return {
          success: true,
          message: "Relatório pronto para exportação",
          data: reportData,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao exportar relatório",
        });
      }
    }),

  /**
   * Exportar relatório de estoque como Excel
   */
  exportStockExcel: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const tenantId = (ctx.user as any)?.tenantId;
      if (!tenantId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Tenant ID não encontrado no contexto",
        });
      }
      const reportData = await generateStockReportData(tenantId);

      // Aqui você integraria com uma biblioteca de Excel
      // Por enquanto, retornamos os dados para o cliente gerar o Excel
      return {
        success: true,
        message: "Relatório pronto para exportação",
        data: reportData,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Erro ao exportar relatório",
      });
    }
  }),
});
