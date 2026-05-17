import { generateSecret, verify } from "otplib";

import { getDb } from "../db";
import { twoFactorSecrets } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Gerar novo secret TOTP para um usuário
 */
export function generateTwoFactorSecret(email: string): { secret: string; keyUri: string } {
  const secret = generateSecret() as any;

  const secretStr = typeof secret === "string" ? secret : (secret.secret as string);
  const keyUriStr = typeof secret === "string" ? secret : (secret.keyUri as string);

  return {
    secret: secretStr || "",
    keyUri: keyUriStr || "",
  };
}

/**
 * Verificar se um token TOTP é válido
 */
export async function verifyTwoFactorToken(secret: string, token: string): Promise<boolean> {
  try {
    const result = await verify({ secret, token });
    return (result as unknown as { valid: boolean }).valid === true;
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
