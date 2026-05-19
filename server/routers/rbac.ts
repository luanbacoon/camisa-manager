import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { rolePermissions, permissions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { hasPermission, initializeDefaultPermissions, initializeDefaultRolePermissions } from "../_core/rbac";

export const rbacRouter = router({
  /**
   * Inicializar permissões padrão do sistema
   */
  initializePermissions: protectedProcedure.mutation(async ({ ctx }) => {
    // Apenas admin pode fazer isso
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas administradores podem inicializar permissões",
      });
    }

    try {
      await initializeDefaultPermissions();
      await initializeDefaultRolePermissions();

      return {
        success: true,
        message: "Permissões inicializadas com sucesso",
      };
    } catch (error) {
      console.error("Erro ao inicializar permissões:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao inicializar permissões",
      });
    }
  }),

  /**
   * Listar todas as permissões
   */
  listPermissions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();

      const perms = await db.select().from(permissions);

      return perms;
    } catch (error) {
      console.error("Erro ao listar permissões:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar permissões",
      });
    }
  }),

  /**
   * Listar permissões de um role específico
   */
  listRolePermissions: protectedProcedure
    .input(
      z.object({
        role: z.enum(["admin", "gerente", "vendedor", "visualizador"]),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();

        // Admin tem todas as permissões
        if (input.role === "admin") {
          return await db.select().from(permissions);
        }

        // Buscar permissões do role
        const rolePerms = await db
          .select({
            id: permissions.id,
            name: permissions.name,
            description: permissions.description,
          })
          .from(rolePermissions)
          .innerJoin(
            permissions,
            eq(rolePermissions.permissionId, permissions.id)
          )
          .where(eq(rolePermissions.role, input.role));

        return rolePerms;
      } catch (error) {
        console.error("Erro ao listar permissões do role:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar permissões do role",
        });
      }
    }),

  /**
   * Verificar se um usuário tem uma permissão
   */
  checkPermission: protectedProcedure
    .input(
      z.object({
        permissionName: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const hasAccess = await hasPermission(
          ctx.user.role as "admin" | "gerente" | "vendedor" | "visualizador",
          input.permissionName
        );

        return {
          hasAccess,
          permission: input.permissionName,
          role: ctx.user.role,
        };
      } catch (error) {
        console.error("Erro ao verificar permissão:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao verificar permissão",
        });
      }
    }),

  /**
   * Atualizar permissões de um role
   */
  updateRolePermissions: protectedProcedure
    .input(
      z.object({
        role: z.enum(["admin", "gerente", "vendedor", "visualizador"]),
        permissionIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode fazer isso
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem atualizar permissões",
        });
      }

      try {
        const db = await getDb();

        // Admin não pode ter permissões alteradas
        if (input.role === "admin") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível alterar permissões do role admin",
          });
        }

        // Deletar permissões existentes
        await db
          .delete(rolePermissions)
          .where(eq(rolePermissions.role, input.role));

        // Inserir novas permissões
        for (const permId of input.permissionIds) {
          await db.insert(rolePermissions).values({
            role: input.role,
            permissionId: permId,
          });
        }

        return {
          success: true,
          message: `Permissões do role ${input.role} atualizadas com sucesso`,
        };
      } catch (error) {
        console.error("Erro ao atualizar permissões:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar permissões",
        });
      }
    }),
});
