import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { tenants, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminTenantsRouter = router({
  /**
   * Listar todos os tenants (apenas admin)
   */
  listTenants: protectedProcedure.query(async ({ ctx }) => {
    // Apenas admin pode fazer isso
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas administradores podem listar tenants",
      });
    }

    try {
      const db = await getDb();
      const allTenants = await db.select().from(tenants);
      return allTenants;
    } catch (error) {
      console.error("Erro ao listar tenants:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar tenants",
      });
    }
  }),

  /**
   * Obter detalhes de um tenant
   */
  getTenant: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Apenas admin ou usuário do tenant podem fazer isso
      if (ctx.user.role !== "admin" && ctx.user.tenantId !== input.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      try {
        const db = await getDb();
        const tenant = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, input.tenantId))
          .limit(1);

        if (!tenant || tenant.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tenant não encontrado",
          });
        }

        return tenant[0];
      } catch (error) {
        console.error("Erro ao obter tenant:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter tenant",
        });
      }
    }),

  /**
   * Criar novo tenant
   */
  createTenant: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode fazer isso
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar tenants",
        });
      }

      try {
        const db = await getDb();

        const result = await db.insert(tenants).values({
          name: input.name,
          email: input.email,
          phone: input.phone,
          address: input.address,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
        });

        return {
          success: true,
          tenantId: result.insertId,
          message: "Tenant criado com sucesso",
        };
      } catch (error) {
        console.error("Erro ao criar tenant:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar tenant",
        });
      }
    }),

  /**
   * Atualizar tenant
   */
  updateTenant: protectedProcedure
    .input(
      z.object({
        tenantId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admin ou gerente do tenant podem fazer isso
      if (ctx.user.role !== "admin" && ctx.user.tenantId !== input.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      try {
        const db = await getDb();

        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.email) updateData.email = input.email;
        if (input.phone) updateData.phone = input.phone;
        if (input.address) updateData.address = input.address;
        if (input.city) updateData.city = input.city;
        if (input.state) updateData.state = input.state;
        if (input.zipCode) updateData.zipCode = input.zipCode;

        await db
          .update(tenants)
          .set(updateData)
          .where(eq(tenants.id, input.tenantId));

        return {
          success: true,
          message: "Tenant atualizado com sucesso",
        };
      } catch (error) {
        console.error("Erro ao atualizar tenant:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar tenant",
        });
      }
    }),

  /**
   * Deletar tenant
   */
  deleteTenant: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode fazer isso
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem deletar tenants",
        });
      }

      try {
        const db = await getDb();

        // Verificar se há usuários associados
        const usersCount = await db
          .select()
          .from(users)
          .where(eq(users.tenantId, input.tenantId));

        if (usersCount && usersCount.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível deletar um tenant com usuários associados",
          });
        }

        await db.delete(tenants).where(eq(tenants.id, input.tenantId));

        return {
          success: true,
          message: "Tenant deletado com sucesso",
        };
      } catch (error) {
        console.error("Erro ao deletar tenant:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar tenant",
        });
      }
    }),

  /**
   * Listar usuários de um tenant
   */
  listTenantUsers: protectedProcedure
    .input(z.object({ tenantId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Apenas admin ou usuário do tenant podem fazer isso
      if (ctx.user.role !== "admin" && ctx.user.tenantId !== input.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      try {
        const db = await getDb();
        const tenantUsers = await db
          .select()
          .from(users)
          .where(eq(users.tenantId, input.tenantId));

        return tenantUsers;
      } catch (error) {
        console.error("Erro ao listar usuários do tenant:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar usuários",
        });
      }
    }),

  /**
   * Adicionar usuário a um tenant
   */
  addUserToTenant: protectedProcedure
    .input(
      z.object({
        tenantId: z.number(),
        userId: z.number(),
        role: z.enum(["admin", "gerente", "vendedor", "visualizador"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode fazer isso
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem adicionar usuários",
        });
      }

      try {
        const db = await getDb();

        // Verificar se o usuário existe
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1);

        if (!user || user.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Usuário não encontrado",
          });
        }

        // Atualizar usuário com novo tenant e role
        await db
          .update(users)
          .set({
            tenantId: input.tenantId,
            role: input.role,
          })
          .where(eq(users.id, input.userId));

        return {
          success: true,
          message: "Usuário adicionado ao tenant com sucesso",
        };
      } catch (error) {
        console.error("Erro ao adicionar usuário ao tenant:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao adicionar usuário",
        });
      }
    }),

  /**
   * Remover usuário de um tenant
   */
  removeUserFromTenant: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode fazer isso
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem remover usuários",
        });
      }

      try {
        const db = await getDb();

        // Remover usuário do tenant (set tenantId to null)
        await db
          .update(users)
          .set({
            tenantId: null,
            role: "visualizador", // Role padrão
          })
          .where(eq(users.id, input.userId));

        return {
          success: true,
          message: "Usuário removido do tenant com sucesso",
        };
      } catch (error) {
        console.error("Erro ao remover usuário do tenant:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao remover usuário",
        });
      }
    }),
});
