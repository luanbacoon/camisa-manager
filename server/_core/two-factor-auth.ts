const otplib = require("otplib");
const { generateSecret, verify } = otplib.authenticator;

import { getDb } from "../db";
import { twoFactorSecrets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Gerar novo secret TOTP para um usuário
 */
export function generateTwoFactorSecret(email: string) {
  const secret = generateSecret({
    name: `CamisaManager (${email})`,
    issuer: "CamisaManager",
  });

  return {
    secret,
    keyUri: secret, // otplib já retorna o keyUri
  };
}

/**
 * Verificar se um token TOTP é válido
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  try {
    return verify({ secret, encoding: "base32", token });
  } catch (error) {
    return false;
  }
}

/**
 * Ativar 2FA para um usuário
 */
export async function enableTwoFactor(userId: number, secret: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Gerar backup codes
  const backupCodes = generateBackupCodes();

  await db.insert(twoFactorSecrets).values({
    userId,
    secret,
    backupCodes: JSON.stringify(backupCodes),
    enabled: true,
    createdAt: new Date(),
  });

  return {
    secret,
    backupCodes,
  };
}

/**
 * Desativar 2FA para um usuário
 */
export async function disableTwoFactor(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.delete(twoFactorSecrets).where(eq(twoFactorSecrets.userId, userId));
}

/**
 * Obter configuração 2FA de um usuário
 */
export async function getTwoFactorConfig(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const config = await db
    .select()
    .from(twoFactorSecrets)
    .where(eq(twoFactorSecrets.userId, userId))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!config) {
    return null;
  }

  const backupCodes: string[] = config.backupCodes ? JSON.parse(config.backupCodes as string) : [];

  return {
    enabled: config.enabled,
    backupCodesRemaining: backupCodes.length,
    createdAt: config.createdAt,
  };
}

/**
 * Verificar e usar backup code
 */
export async function verifyBackupCode(userId: number, code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const config = await db
    .select()
    .from(twoFactorSecrets)
    .where(eq(twoFactorSecrets.userId, userId))
    .limit(1)
    .then((rows) => rows[0] || null);

  if (!config || !config.backupCodes) {
    return false;
  }

  const backupCodes: string[] = JSON.parse(config.backupCodes as string);
  const codeIndex = backupCodes.indexOf(code);

  if (codeIndex === -1) {
    return false;
  }

  // Remover o código usado
  backupCodes.splice(codeIndex, 1);

  await db
    .update(twoFactorSecrets)
    .set({ backupCodes: JSON.stringify(backupCodes) })
    .where(eq(twoFactorSecrets.userId, userId));

  return true;
}

/**
 * Gerar backup codes (8 códigos de 8 caracteres)
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (let i = 0; i < 8; i++) {
    let code = "";
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(code);
  }

  return codes;
}

/**
 * Regenerar backup codes
 */
export async function regenerateBackupCodes(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const backupCodes = generateBackupCodes();

  await db
    .update(twoFactorSecrets)
    .set({ backupCodes: JSON.stringify(backupCodes) })
    .where(eq(twoFactorSecrets.userId, userId));

  return backupCodes;
}
