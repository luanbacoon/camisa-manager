import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifySessionToken } from "./local-auth";
import { getDb } from "../db";
import { tenants, userTenants } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null | { id: number; email: string; name: string; role: string; tenantId: number };
};

/**
 * Obter ou criar tenant padrão para usuários OAuth
 */
async function getOrCreateDefaultTenant(userId: number, userName: string, userEmail: string): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    // Procurar por tenant existente do usuário
    const existingUserTenant = await db
      .select({ tenantId: userTenants.tenantId })
      .from(userTenants)
      .where(eq(userTenants.userId, userId))
      .limit(1);

    if (existingUserTenant.length > 0) {
      return existingUserTenant[0].tenantId;
    }

    // Procurar por tenant padrão com slug baseado no email
    const slug = userEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
    const existingTenant = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    let tenantId: number;

    if (existingTenant.length > 0) {
      tenantId = existingTenant[0].id;
    } else {
      // Criar novo tenant padrão
      const result = await db.insert(tenants).values({
        name: userName || userEmail,
        slug: slug,
        email: userEmail,
        phone: "",
        logo: null,
        plan: "basico",
        status: "ativo",
        maxProducts: 1000,
        maxUsers: 10,
      });
      tenantId = (result as any).insertId || 1;
    }

    // Associar usuário ao tenant
    await db.insert(userTenants).values({
      userId,
      tenantId,
      role: "admin",
    }).catch(() => {
      // Ignorar erro se já existe
    });

    return tenantId;
  } catch (error) {
    console.error("Error getting or creating default tenant:", error);
    return 1; // Fallback para tenant ID 1
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null | { id: number; email: string; name: string; role: string; tenantId: number } = null;

  try {
    // Tentar autenticação Manus OAuth primeiro
    user = await sdk.authenticateRequest(opts.req);
    
    // Se usuário OAuth não tem tenantId, criar/obter tenant padrão
    if (user && !(user as any).tenantId) {
      const tenantId = await getOrCreateDefaultTenant(
        (user as any).id,
        (user as any).name,
        (user as any).email
      );
      (user as any).tenantId = tenantId;
    }
  } catch (error) {
    // Se falhar, tentar autenticação local via session token
    try {
      const token = opts.req.headers.authorization?.replace("Bearer ", "") || 
                    (opts.req.cookies as any)?.localAuthToken || 
                    (opts.req.query as any)?.token as string;
      
      if (token) {
        user = await verifySessionToken(token);
      }
    } catch (localAuthError) {
      // Ambas as autenticações falharam - usuário não autenticado
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
