import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateSalesReportData, generateStockReportData } from "../_core/reports";
import { exportSalesReportToPDF, exportSalesReportToExcel, exportStockReportToExcel } from "../_core/export";

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
   * Exportar relatório de vendas como PDF (DOCX)
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
        const buffer = await exportSalesReportToPDF(tenantId, input.from, input.to);
        return {
          success: true,
          buffer: buffer.toString('base64'),
          filename: `relatorio-vendas-${new Date().toISOString().split('T')[0]}.docx`,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao exportar relatório",
        });
      }
    }),

  /**
   * Exportar relatório de vendas como Excel
   */
  exportSalesExcel: protectedProcedure
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
        const buffer = await exportSalesReportToExcel(tenantId, input.from, input.to);
        return {
          success: true,
          buffer: buffer.toString('base64'),
          filename: `relatorio-vendas-${new Date().toISOString().split('T')[0]}.xlsx`,
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
      const buffer = await exportStockReportToExcel(tenantId);
      return {
        success: true,
        buffer: buffer.toString('base64'),
        filename: `relatorio-estoque-${new Date().toISOString().split('T')[0]}.xlsx`,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Erro ao exportar relatório",
      });
    }
  }),
});
