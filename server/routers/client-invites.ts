import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { clientInvites, tenants, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { sendWelcomeEmail, sendInviteEmail } from "../_core/email";
import bcrypt from "bcrypt";

export const clientInvitesRouter = router({
  /**
   * Enviar convite para um cliente
   */
  sendInvite: protectedProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        storeName: z.string().min(1, "Nome da loja obrigatório"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Gerar token único
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      // Criar convite
      const invite = await db.insert(clientInvites).values({
        email: input.email,
        token,
        storeName: input.storeName,
        expiresAt,
        createdBy: ctx.user.id,
      });

      // Enviar email com link de convite
      const inviteUrl = `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/client-accept-invite?token=${token}`;
      await sendInviteEmail(input.email, input.storeName, inviteUrl, "7 dias");

      return {
        success: true,
        message: "Convite enviado com sucesso",
        inviteId: (invite as any).insertId || 0,
      };
    }),

  /**
   * Listar convites pendentes
   */
  listInvites: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "accepted", "expired"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      let query: any = db.select().from(clientInvites);

      if (input.status) {
        query = query.where(eq(clientInvites.status, input.status));
      }

      const invites = await query.limit(input.limit).offset(input.offset);

      return {
        invites,
        total: invites.length,
      };
    }),

  /**
   * Aceitar convite
   */
  acceptInvite: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar convite
      const invite = await db
        .select()
        .from(clientInvites)
        .where(
          and(
            eq(clientInvites.token, input.token),
            eq(clientInvites.email, input.email)
          )
        )
        .limit(1);

      if (!invite || invite.length === 0) {
        throw new Error("Convite não encontrado");
      }

      const inviteRecord = invite[0];

      // Verificar se expirou
      if (new Date() > inviteRecord.expiresAt) {
        await db
          .update(clientInvites)
          .set({ status: "expired" })
          .where(eq(clientInvites.id, inviteRecord.id));
        throw new Error("Convite expirado");
      }

      // Verificar se já foi aceito
      if (inviteRecord.status === "accepted") {
        throw new Error("Convite já foi aceito");
      }

      // Atualizar convite como aceito
      await db
        .update(clientInvites)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(clientInvites.id, inviteRecord.id));

      // TODO: Criar tenant e usuário automaticamente
      // const newTenant = await db.insert(tenants).values({
      //   name: inviteRecord.storeName,
      //   // ... outros campos
      // });
      //
      // const newUser = await db.insert(localUsers).values({
      //   tenantId: newTenant.insertId,
      //   email: inviteRecord.email,
      //   name: inviteRecord.storeName,
      //   passwordHash: "", // Será definido no próximo passo
      //   role: "admin",
      // });

      return {
        success: true,
        message: "Convite aceito com sucesso",
        inviteId: inviteRecord.id,
      };
    }),

  /**
   * Deletar convite
   */
  deleteInvite: protectedProcedure
    .input(z.object({ inviteId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(clientInvites).where(eq(clientInvites.id, input.inviteId));

      return {
        success: true,
        message: "Convite deletado com sucesso",
      };
    }),

  /**
   * Reenviar convite
   */
  resendInvite: protectedProcedure
    .input(z.object({ inviteId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar convite
      const invite = await db
        .select()
        .from(clientInvites)
        .where(eq(clientInvites.id, input.inviteId))
        .limit(1);

      if (!invite || invite.length === 0) {
        throw new Error("Convite não encontrado");
      }

      // TODO: Reenviar email

      return {
        success: true,
        message: "Convite reenviado com sucesso",
      };
    }),
});
