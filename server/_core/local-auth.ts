import crypto from "crypto";
import { getDb } from "../db";
import { localUsers, sessionTokens, passwordResetTokens } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Hash de senha usando bcrypt-like (simples, sem dependências)
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt_camisa_manager").digest("hex");
}

/**
 * Verificar se a senha está correta
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Gerar token de sessão
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Registrar novo usuário local
 */
export async function registerLocalUser(
  tenantId: number,
  email: string,
  password: string,
  name: string,
  role: "admin" | "manager" | "seller" | "viewer" = "viewer"
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Verificar se email já existe
  const existing = await db
    .select()
    .from(localUsers)
    .where(and(eq(localUsers.email, email), eq(localUsers.tenantId, tenantId)))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (existing) {
    throw new Error("Email já cadastrado");
  }

  const passwordHash = hashPassword(password);

  await db.insert(localUsers).values({
    tenantId,
    email,
    passwordHash,
    name,
    role,
    isActive: true,
  });

  return {
    email,
    name,
    role,
  };
}

/**
 * Fazer login com email e senha
 */
export async function loginLocalUser(email: string, password: string, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const user = await db
    .select()
    .from(localUsers)
    .where(and(eq(localUsers.email, email), eq(localUsers.tenantId, tenantId)))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!user) {
    throw new Error("Email ou senha incorretos");
  }

  if (!user.isActive) {
    throw new Error("Usuário desativado");
  }

  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error("Email ou senha incorretos");
  }

  // Atualizar lastLoginAt
  await db.update(localUsers).set({ lastLoginAt: new Date() }).where(eq(localUsers.id, user.id));

  // Criar session token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

  await db.insert(sessionTokens).values({
    userId: user.id,
    token,
    expiresAt,
    ipAddress: "0.0.0.0", // Será preenchido pelo middleware
    userAgent: "unknown", // Será preenchido pelo middleware
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    token,
    expiresAt,
  };
}

/**
 * Verificar se um session token é válido
 */
export async function verifySessionToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const session = await db
    .select()
    .from(sessionTokens)
    .where(eq(sessionTokens.token, token))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!session) {
    throw new Error("Token inválido");
  }

  if (new Date() > session.expiresAt) {
    throw new Error("Token expirado");
  }

  // Buscar usuário
  const user = await db
    .select()
    .from(localUsers)
    .where(eq(localUsers.id, session.userId))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!user || !user.isActive) {
    throw new Error("Usuário não encontrado ou desativado");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
  };
}

/**
 * Fazer logout (deletar session token)
 */
export async function logoutLocalUser(token: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.delete(sessionTokens).where(eq(sessionTokens.token, token));
}

/**
 * Gerar token para reset de senha
 */
export async function generatePasswordResetToken(email: string, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const user = await db
    .select()
    .from(localUsers)
    .where(and(eq(localUsers.email, email), eq(localUsers.tenantId, tenantId)))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!user) {
    // Não revelar se email existe ou não
    return { success: true };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  return {
    success: true,
    token, // Em produção, enviar via email
  };
}

/**
 * Reset de senha com token
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const resetToken = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!resetToken) {
    throw new Error("Token inválido");
  }

  if (new Date() > resetToken.expiresAt) {
    throw new Error("Token expirado");
  }

  const passwordHash = hashPassword(newPassword);

  await db.update(localUsers).set({ passwordHash }).where(eq(localUsers.id, resetToken.userId));

  // Deletar token usado
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

  return { success: true };
}

/**
 * Atualizar perfil do usuário
 */
export async function updateLocalUserProfile(userId: number, name: string, email: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.update(localUsers).set({ name, email }).where(eq(localUsers.id, userId));

  return { success: true };
}

/**
 * Alterar senha
 */
export async function changePassword(userId: number, oldPassword: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const user = await db
    .select()
    .from(localUsers)
    .where(eq(localUsers.id, userId))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  if (!verifyPassword(oldPassword, user.passwordHash)) {
    throw new Error("Senha atual incorreta");
  }

  const passwordHash = hashPassword(newPassword);

  await db.update(localUsers).set({ passwordHash }).where(eq(localUsers.id, userId));

  return { success: true };
}

/**
 * Listar usuários de um tenant
 */
export async function listLocalUsers(tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const users = await db
    .select({
      id: localUsers.id,
      email: localUsers.email,
      name: localUsers.name,
      role: localUsers.role,
      isActive: localUsers.isActive,
      lastLoginAt: localUsers.lastLoginAt,
      createdAt: localUsers.createdAt,
    })
    .from(localUsers)
    .where(eq(localUsers.tenantId, tenantId));

  return users;
}

/**
 * Atualizar role de um usuário
 */
export async function updateUserRole(userId: number, role: "admin" | "manager" | "seller" | "viewer") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.update(localUsers).set({ role }).where(eq(localUsers.id, userId));

  return { success: true };
}

/**
 * Desativar/ativar usuário
 */
export async function toggleUserActive(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.update(localUsers).set({ isActive }).where(eq(localUsers.id, userId));

  return { success: true };
}

/**
 * Deletar usuário
 */
export async function deleteLocalUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.delete(localUsers).where(eq(localUsers.id, userId));

  return { success: true };
}
