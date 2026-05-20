import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getAuditLogs, getUserAuditLogs, logAuditAction } from "../_core/audit";

export const auditRouter = router({
  /**
   * Busca logs de auditoria do tenant
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(1000).default(50),
        offset: z.number().min(0).default(0),
        userId: z.string().optional(),
        action: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = (ctx.user as any)?.tenantId;
      if (!tenantId) {
        return { logs: [], total: 0 };
      }

      // Se filtrar por usuário específico
      if (input.userId) {
        const logs = await getUserAuditLogs(input.userId, tenantId, input.limit);
        return {
          logs: logs.filter((log) => {
            if (input.action && log.action !== input.action) return false;
            if (input.dateFrom && log.timestamp < input.dateFrom) return false;
            if (input.dateTo && log.timestamp > input.dateTo) return false;
            return true;
          }),
          total: logs.length,
        };
      }

      // Buscar todos os logs do tenant
      const logs = await getAuditLogs(tenantId, input.limit, input.offset);
      return {
        logs: logs.filter((log) => {
          if (input.action && log.action !== input.action) return false;
          if (input.dateFrom && log.timestamp < input.dateFrom) return false;
          if (input.dateTo && log.timestamp > input.dateTo) return false;
          return true;
        }),
        total: logs.length,
      };
    }),

  /**
   * Busca logs de um usuário específico
   */
  getUserLogs: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = (ctx.user as any)?.tenantId;
      if (!tenantId) return { logs: [] };

      const logs = await getUserAuditLogs(input.userId, tenantId, input.limit);
      return { logs };
    }),

  /**
   * Busca logs por ação específica
   */
  getByAction: protectedProcedure
    .input(
      z.object({
        action: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = (ctx.user as any)?.tenantId;
      if (!tenantId) return { logs: [] };

      const logs = await getAuditLogs(tenantId, input.limit, 0);
      return {
        logs: logs.filter((log) => log.action === input.action),
      };
    }),

  /**
   * Busca logs por período
   */
  getByDateRange: protectedProcedure
    .input(
      z.object({
        dateFrom: z.date(),
        dateTo: z.date(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const tenantId = (ctx.user as any)?.tenantId;
      if (!tenantId) return { logs: [] };

      const logs = await getAuditLogs(tenantId, input.limit, 0);
      return {
        logs: logs.filter(
          (log) =>
            log.timestamp >= input.dateFrom && log.timestamp <= input.dateTo
        ),
      };
    }),

  /**
   * Busca detalhes de um log específico
   */
  getDetails: protectedProcedure
    .input(z.object({ resourceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tenantId = (ctx.user as any)?.tenantId;
      if (!tenantId) return { log: null };

      const logs = await getAuditLogs(tenantId, 100, 0);
      const log = logs.find((l) => l.resourceId === Number(input.resourceId));
      return { log: log || null };
    }),
});
