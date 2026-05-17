import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  registerLocalUser,
  loginLocalUser,
  logoutLocalUser,
  generatePasswordResetToken,
  resetPasswordWithToken,
  updateLocalUserProfile,
  changePassword,
  listLocalUsers,
  updateUserRole,
  toggleUserActive,
  deleteLocalUser,
  completeTwoFactorLogin,
} from "../_core/local-auth";
import { verifyTwoFactorToken, verifyBackupCode } from "../_core/two-factor-auth";

export const localAuthRouter = router({
  /**
   * Registrar novo usuário local
   */
  register: publicProcedure
    .input(
      z.object({
        tenantId: z.number(),
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const user = await registerLocalUser(input.tenantId, input.email, input.password, input.name);
        return { success: true, user };
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Erro ao registrar usuário",
        });
      }
    }),

  /**
   * Login com email e senha
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
        tenantId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await loginLocalUser(input.email, input.password, input.tenantId);
        return { success: true, ...result };
      } catch (error: any) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message || "Erro ao fazer login",
        });
      }
    }),

  /**
   * Logout
   */
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Aqui você teria que passar o token, mas como estamos usando context,
      // apenas retornamos sucesso. O cliente deve limpar o token.
      return { success: true };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Erro ao fazer logout",
      });
    }
  }),

  /**
   * Solicitar reset de senha
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        tenantId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await generatePasswordResetToken(input.email, input.tenantId);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao solicitar reset de senha",
        });
      }
    }),

  /**
   * Reset de senha com token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await resetPasswordWithToken(input.token, input.newPassword);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Erro ao resetar senha",
        });
      }
    }),

  /**
   * Atualizar perfil do usuário
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await updateLocalUserProfile(ctx.user.id, input.name, input.email);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao atualizar perfil",
        });
      }
    }),

  /**
   * Alterar senha
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await changePassword(ctx.user.id, input.oldPassword, input.newPassword);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message || "Erro ao alterar senha",
        });
      }
    }),

  /**
   * Listar usuários do tenant (admin only)
   */
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas admins podem listar usuários",
        });
      }

      const users = await listLocalUsers(1); // TODO: obter tenantId do contexto
      return users;
    } catch (error: any) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Erro ao listar usuários",
      });
    }
  }),

  /**
   * Atualizar role de um usuário (admin only)
   */
  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "manager", "seller", "viewer"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas admins podem atualizar roles",
          });
        }

        const result = await updateUserRole(input.userId, input.role);
        return result;
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao atualizar role",
        });
      }
    }),

  /**
   * Desativar/ativar usuário (admin only)
   */
  toggleUserActive: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas admins podem desativar usuários",
          });
        }

        const result = await toggleUserActive(input.userId, input.isActive);
        return result;
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao desativar usuário",
        });
      }
    }),

  /**
   * Deletar usuário (admin only)
   */
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas admins podem deletar usuários",
          });
        }

        const result = await deleteLocalUser(input.userId);
        return result;
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao deletar usuário",
        });
      }
    }),

  /**
   * Verificar 2FA token após login
   */
  verifyTwoFactor: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        token: z.string(),
        useBackupCode: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { getTwoFactorConfig } = await import("../_core/two-factor-auth");
        const twoFactorConfig = await getTwoFactorConfig(input.userId);

        if (!twoFactorConfig?.enabled) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "2FA nao esta ativado para este usuario",
          });
        }

        let isValid = false;
        if (input.useBackupCode) {
          isValid = await verifyBackupCode(input.userId, input.token);
        } else {
          // Buscar secret do usuario
          const { getDb } = await import("../db");
          const dbInstance = await getDb();
          if (!dbInstance) throw new Error("DB not available");

          const { twoFactorSecrets } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          
          const config = await dbInstance
            .select()
            .from(twoFactorSecrets)
            .where(eq(twoFactorSecrets.userId, input.userId))
            .limit(1)
            .then((rows: any) => rows[0] || null);

          if (config?.secret) {
            isValid = await verifyTwoFactorToken(config.secret, input.token);
          }
        }

        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token 2FA invalido",
          });
        }

        // Completar login
        const result = await completeTwoFactorLogin(input.userId, "");
        return { success: true, ...result };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao verificar 2FA",
        });
      }
    }),
});
