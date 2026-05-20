import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, tenants } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const clientAuthRouter = router({
  clientSignUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        storeName: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if email already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email já cadastrado",
        });
      }

      // Create tenant
      const tenantResult = await db.insert(tenants).values({
        slug: input.storeName.toLowerCase().replace(/\s+/g, "-"),
        name: input.storeName,
        email: input.email,
      });

      const tenantId = (tenantResult as any).insertId || 1;

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const userResult = await db.insert(users).values({
        email: input.email,
        passwordHash: hashedPassword,
        name: input.storeName,
        role: "admin",
        tenantId,
        loginMethod: "email",
      });

      return {
        success: true,
        message: "Conta criada com sucesso",
        userId: (userResult as any).insertId,
        tenantId,
      };
    }),

  clientLogin: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Find user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (user.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos",
        });
      }

      const foundUser = user[0];

      // Check password
      if (!foundUser.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos",
        });
      }

      const passwordMatch = await bcrypt.compare(input.password, foundUser.passwordHash);

      if (!passwordMatch) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou senha incorretos",
        });
      }

      // Set session cookie
      const sessionToken = Buffer.from(
        JSON.stringify({
          userId: foundUser.id,
          email: foundUser.email,
          tenantId: foundUser.tenantId,
          role: foundUser.role,
        })
      ).toString("base64");

      ctx.res.setHeader(
        "Set-Cookie",
        `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
      );

      return {
        success: true,
        message: "Login realizado com sucesso",
        userId: foundUser.id,
        tenantId: foundUser.tenantId,
      };
    }),
});
