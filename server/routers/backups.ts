import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { createBackup, restoreBackup, listBackups, deleteBackup, getBackupStats } from "../_core/backup";
import { TRPCError } from "@trpc/server";

export const backupsRouter = router({
  /**
   * Criar novo backup
   */
  create: protectedProcedure
    .input(z.object({ description: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        const result = await createBackup(input.description);
        return {
          success: true,
          backup: result,
        };
      } catch (error) {
        console.error("Erro ao criar backup:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar backup",
        });
      }
    }),

  /**
   * Listar backups
   */
  list: protectedProcedure.query(async () => {
    try {
      const backups = await listBackups();
      return backups;
    } catch (error) {
      console.error("Erro ao listar backups:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar backups",
      });
    }
  }),

  /**
   * Obter estatísticas de backup
   */
  stats: protectedProcedure.query(async () => {
    try {
      const stats = await getBackupStats();
      return stats;
    } catch (error) {
      console.error("Erro ao obter estatísticas de backup:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao obter estatísticas de backup",
      });
    }
  }),

  /**
   * Restaurar backup
   */
  restore: protectedProcedure
    .input(z.object({ backupId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await restoreBackup(input.backupId);
        return {
          success: true,
          message: "Backup restaurado com sucesso",
        };
      } catch (error) {
        console.error("Erro ao restaurar backup:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao restaurar backup",
        });
      }
    }),

  /**
   * Deletar backup
   */
  delete: protectedProcedure
    .input(z.object({ backupId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteBackup(input.backupId);
        return {
          success: true,
          message: "Backup deletado com sucesso",
        };
      } catch (error) {
        console.error("Erro ao deletar backup:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar backup",
        });
      }
    }),
});
