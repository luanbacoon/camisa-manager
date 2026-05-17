import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { tenants, userTenants } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export type TenantContext = {
  tenantId: number;
  tenantSlug: string;
  userId: number;
  role: "admin" | "gerente" | "vendedor" | "visualizador";
};

/**
 * Obter tenant pelo slug (subdomínio)
 * Exemplo: "loja1.camisamanager.com" -> slug = "loja1"
 */
export async function getTenantBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const tenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!tenant) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Loja não encontrada",
    });
  }

  if (tenant.status !== "ativo") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Loja não está ativa",
    });
  }

  return tenant;
}

/**
 * Obter tenant do usuário (primeira loja associada)
 */
export async function getUserTenant(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const userTenant = await db
    .select()
    .from(userTenants)
    .where(eq(userTenants.userId, userId))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!userTenant) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Usuário não tem acesso a nenhuma loja",
    });
  }

  return userTenant;
}

/**
 * Obter todas as lojas de um usuário
 */
export async function getUserTenants(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  return db.select().from(userTenants).where(eq(userTenants.userId, userId));
}

/**
 * Verificar acesso do usuário a um tenant específico
 */
export async function verifyUserTenantAccess(userId: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const access = await db
    .select()
    .from(userTenants)
    .where(and(eq(userTenants.userId, userId), eq(userTenants.tenantId, tenantId)))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!access) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem acesso a esta loja",
    });
  }

  return access;
}

/**
 * Criar novo tenant
 */
export async function createTenant(data: {
  slug: string;
  name: string;
  email: string;
  phone?: string;
  plan?: "basico" | "profissional" | "premium" | "enterprise";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Validar slug único
  const existing = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, data.slug))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (existing) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Este slug já está em uso",
    });
  }

  // Validar slug format (apenas letras, números e hífen)
  if (!/^[a-z0-9-]+$/.test(data.slug)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Slug deve conter apenas letras minúsculas, números e hífen",
    });
  }

  await db.insert(tenants).values({
    slug: data.slug,
    name: data.name,
    email: data.email,
    phone: data.phone,
    plan: data.plan || "basico",
    status: "ativo",
    maxProducts: 100,
    maxUsers: 1,
  });

  return db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, data.slug))
    .limit(1)
    .then((rows) => rows[0]);
}

/**
 * Atualizar tenant
 */
export async function updateTenant(
  tenantId: number,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    logo?: string;
    plan?: "basico" | "profissional" | "premium" | "enterprise";
    status?: "ativo" | "suspenso" | "cancelado";
    maxProducts?: number;
    maxUsers?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.update(tenants).set(data).where(eq(tenants.id, tenantId));

  return db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1)
    .then((rows) => rows[0] || null);
}

/**
 * Adicionar usuário a um tenant
 */
export async function addUserToTenant(
  userId: number,
  tenantId: number,
  role: "admin" | "gerente" | "vendedor" | "visualizador" = "vendedor"
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Verificar se já existe
  const existing = await db
    .select()
    .from(userTenants)
    .where(and(eq(userTenants.userId, userId), eq(userTenants.tenantId, tenantId)))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (existing) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Usuário já tem acesso a esta loja",
    });
  }

  await db.insert(userTenants).values({
    userId,
    tenantId,
    role,
  });

  return { userId, tenantId, role };
}

/**
 * Remover usuário de um tenant
 */
export async function removeUserFromTenant(userId: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db
    .delete(userTenants)
    .where(and(eq(userTenants.userId, userId), eq(userTenants.tenantId, tenantId)));
}

/**
 * Atualizar role do usuário em um tenant
 */
export async function updateUserTenantRole(
  userId: number,
  tenantId: number,
  role: "admin" | "gerente" | "vendedor" | "visualizador"
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db
    .update(userTenants)
    .set({ role })
    .where(and(eq(userTenants.userId, userId), eq(userTenants.tenantId, tenantId)));

  return { userId, tenantId, role };
}

/**
 * Obter todos os usuários de um tenant
 */
export async function getTenantUsers(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  return db.select().from(userTenants).where(eq(userTenants.tenantId, tenantId));
}
