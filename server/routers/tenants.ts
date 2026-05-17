import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createTenant,
  updateTenant,
  getTenantBySlug,
  getUserTenant,
  getUserTenants,
  addUserToTenant,
  removeUserFromTenant,
  updateUserTenantRole,
  getTenantUsers,
} from "../_core/tenant-middleware";
import { TRPCError } from "@trpc/server";

export const tenantsRouter = router({
  /**
   * Obter tenant atual do usuário
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userTenant = await getUserTenant(ctx.user.id);
      return userTenant;
    } catch (error) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Usuário não tem acesso a nenhuma loja",
      });
    }
  }),

  /**
   * Listar todas as lojas do usuário
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getUserTenants(ctx.user.id);
    } catch (error) {
      console.error("Erro ao listar tenants:", error);
      return [];
    }
  }),

  /**
   * Obter tenant pelo slug
   */
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const tenant = await getTenantBySlug(input.slug);
        // Verificar se o usuário tem acesso
        const userTenants = await getUserTenants(ctx.user.id);
        const hasAccess = userTenants.some((ut) => ut.tenantId === tenant.id);

        if (!hasAccess && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você não tem acesso a esta loja",
          });
        }

        return tenant;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Loja não encontrada",
        });
      }
    }),

  /**
   * Criar novo tenant (apenas admin)
   */
  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/),
        name: z.string().min(1).max(255),
        email: z.string().email(),
        phone: z.string().optional(),
        plan: z.enum(["basico", "profissional", "premium", "enterprise"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode criar tenants
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar lojas",
        });
      }

      try {
        const tenant = await createTenant(input);
        // Adicionar criador como admin do tenant
        await addUserToTenant(ctx.user.id, tenant.id, "admin");
        return tenant;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar loja",
        });
      }
    }),

  /**
   * Atualizar tenant (apenas admin do tenant)
   */
  update: protectedProcedure
    .input(
      z.object({
        tenantId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        logo: z.string().optional(),
        plan: z.enum(["basico", "profissional", "premium", "enterprise"]).optional(),
        status: z.enum(["ativo", "suspenso", "cancelado"]).optional(),
        maxProducts: z.number().optional(),
        maxUsers: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { tenantId, ...data } = input;

      // Verificar acesso
      const userTenants = await getUserTenants(ctx.user.id);
      const userTenant = userTenants.find((ut) => ut.tenantId === tenantId);

      if (!userTenant && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a esta loja",
        });
      }

      if (userTenant && userTenant.role !== "admin" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem editar a loja",
        });
      }

      try {
        return await updateTenant(tenantId, data);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar loja",
        });
      }
    }),

  /**
   * Listar usuários de um tenant
   */
  listUsers: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Verificar acesso
      const userTenants = await getUserTenants(ctx.user.id);
      const userTenant = userTenants.find((ut) => ut.tenantId === input.tenantId);

      if (!userTenant && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a esta loja",
        });
      }

      try {
        return await getTenantUsers(input.tenantId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar usuários",
        });
      }
    }),

  /**
   * Adicionar usuário a um tenant
   */
  addUser: protectedProcedure
    .input(
      z.object({
        tenantId: z.number(),
        userId: z.number(),
        role: z.enum(["admin", "gerente", "vendedor", "visualizador"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar acesso
      const userTenants = await getUserTenants(ctx.user.id);
      const userTenant = userTenants.find((ut) => ut.tenantId === input.tenantId);

      if (!userTenant && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a esta loja",
        });
      }

      if (userTenant && userTenant.role !== "admin" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem adicionar usuários",
        });
      }

      try {
        return await addUserToTenant(input.userId, input.tenantId, input.role);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao adicionar usuário",
        });
      }
    }),

  /**
   * Remover usuário de um tenant
   */
  removeUser: protectedProcedure
    .input(
      z.object({
        tenantId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar acesso
      const userTenants = await getUserTenants(ctx.user.id);
      const userTenant = userTenants.find((ut) => ut.tenantId === input.tenantId);

      if (!userTenant && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a esta loja",
        });
      }

      if (userTenant && userTenant.role !== "admin" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem remover usuários",
        });
      }

      try {
        await removeUserFromTenant(input.userId, input.tenantId);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao remover usuário",
        });
      }
    }),

  /**
   * Atualizar role de um usuário em um tenant
   */
  updateUserRole: protectedProcedure
    .input(
      z.object({
        tenantId: z.number(),
        userId: z.number(),
        role: z.enum(["admin", "gerente", "vendedor", "visualizador"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar acesso
      const userTenants = await getUserTenants(ctx.user.id);
      const userTenant = userTenants.find((ut) => ut.tenantId === input.tenantId);

      if (!userTenant && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não tem acesso a esta loja",
        });
      }

      if (userTenant && userTenant.role !== "admin" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem alterar roles",
        });
      }

      try {
        return await updateUserTenantRole(input.userId, input.tenantId, input.role);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar role",
        });
      }
    }),
});
