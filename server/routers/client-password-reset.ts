import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";

// In-memory store for password reset tokens (in production, use database)
const resetTokens = new Map<string, { userId: number; expiresAt: Date }>();

export const clientPasswordResetRouter = router({
  // Request password reset
  requestReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      const foundUser = user[0];

      if (!foundUser) {
        // Don't reveal if email exists
        return { success: true, message: "Se o email existir, você receberá um link de recuperação" };
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      resetTokens.set(token, { userId: foundUser.id, expiresAt });

      // In production, send email with reset link
      console.log(`Password reset token for ${input.email}: ${token}`);
      console.log(`Reset link: /client-reset-password?token=${token}`);

      return { success: true, message: "Se o email existir, você receberá um link de recuperação" };
    }),

  // Verify reset token
  verifyToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(({ input }) => {
      const resetData = resetTokens.get(input.token);

      if (!resetData) {
        return { valid: false, message: "Token inválido ou expirado" };
      }

      if (resetData.expiresAt < new Date()) {
        resetTokens.delete(input.token);
        return { valid: false, message: "Token expirado" };
      }

      return { valid: true, userId: resetData.userId };
    }),

  // Reset password with token
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const resetData = resetTokens.get(input.token);

      if (!resetData) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token inválido ou expirado" });
      }

      if (resetData.expiresAt < new Date()) {
        resetTokens.delete(input.token);
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token expirado" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Hash new password
      const passwordHash = await bcrypt.hash(input.newPassword, 10);

      // Update user password
      await db.update(users).set({ passwordHash }).where(eq(users.id, resetData.userId));

      // Delete token
      resetTokens.delete(input.token);

      return { success: true, message: "Senha alterada com sucesso" };
    }),
});
