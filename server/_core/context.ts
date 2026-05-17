import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifySessionToken } from "./local-auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null | { id: number; email: string; name: string; role: string; tenantId: number };
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null | { id: number; email: string; name: string; role: string; tenantId: number } = null;

  try {
    // Tentar autenticação Manus OAuth primeiro
    user = await sdk.authenticateRequest(opts.req);
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
