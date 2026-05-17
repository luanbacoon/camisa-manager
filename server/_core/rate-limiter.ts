import { getDb } from "../db";
import { loginAttempts } from "../../drizzle/schema";
import { eq, and, gt, desc } from "drizzle-orm";

const RATE_LIMIT_CONFIG = {
  // Login attempts
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_WINDOW_MINUTES: 15,
  LOGIN_LOCKOUT_MINUTES: 30,

  // API requests
  API_REQUESTS_PER_MINUTE: 60,
  API_REQUESTS_PER_HOUR: 1000,

  // 2FA attempts
  TOTP_MAX_ATTEMPTS: 5,
  TOTP_WINDOW_MINUTES: 10,
};

/**
 * Registrar tentativa de login
 */
export async function recordLoginAttempt(email: string, success: boolean, ipAddress?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  await db.insert(loginAttempts).values({
    email,
    success,
    ipAddress: ipAddress || "unknown",
  });
}

/**
 * Verificar se o usuário está bloqueado por rate limiting
 */
export async function isLoginRateLimited(email: string): Promise<{
  limited: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
}> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.LOGIN_WINDOW_MINUTES * 60 * 1000);
  const lockoutStart = new Date(now.getTime() - RATE_LIMIT_CONFIG.LOGIN_LOCKOUT_MINUTES * 60 * 1000);

  // Buscar tentativas falhadas recentes
  const failedAttempts = await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email),
        eq(loginAttempts.success, false),
        gt(loginAttempts.createdAt, windowStart)
      )
    );

  // Se há muitas tentativas falhadas recentes, verificar se está em lockout
  if (failedAttempts.length >= RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS) {
    const lastFailedAttempt = failedAttempts[failedAttempts.length - 1];

    if (lastFailedAttempt && lastFailedAttempt.createdAt > lockoutStart) {
      const lockedUntil = new Date(lastFailedAttempt.createdAt.getTime() + RATE_LIMIT_CONFIG.LOGIN_LOCKOUT_MINUTES * 60 * 1000);
      return {
        limited: true,
        remainingAttempts: 0,
        lockedUntil,
      };
    }
  }

  const remainingAttempts = Math.max(0, RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS - failedAttempts.length);

  return {
    limited: false,
    remainingAttempts,
  };
}

/**
 * Limpar tentativas de login antigas
 */
export async function cleanupOldLoginAttempts() {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás

  await db.delete(loginAttempts).where(gt(loginAttempts.createdAt, cutoffDate));
}

/**
 * Obter histórico de tentativas de login para um email
 */
export async function getLoginAttemptHistory(email: string, hours: number = 24) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  return db
    .select()
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, email), gt(loginAttempts.createdAt, startTime)))
    .orderBy(desc(loginAttempts.createdAt));
}

/**
 * Verificar se um IP está fazendo muitas requisições
 */
export async function checkIPRateLimit(ipAddress: string): Promise<{
  limited: boolean;
  requestsInWindow: number;
  resetTime?: Date;
}> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recentAttempts = await db
    .select()
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ipAddress, ipAddress), gt(loginAttempts.createdAt, oneHourAgo)));

  const limited = recentAttempts.length > RATE_LIMIT_CONFIG.API_REQUESTS_PER_HOUR;

  return {
    limited,
    requestsInWindow: recentAttempts.length,
    resetTime: limited ? new Date(now.getTime() + 60 * 60 * 1000) : undefined,
  };
}

/**
 * Obter estatísticas de segurança
 */
export async function getSecurityStats(hours: number = 24) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const allAttempts = await db
    .select()
    .from(loginAttempts)
    .where(gt(loginAttempts.createdAt, startTime));

  const successfulAttempts = allAttempts.filter((a) => a.success);
  const failedAttempts = allAttempts.filter((a) => !a.success);

  const uniqueEmails = new Set(allAttempts.map((a) => a.email)).size;
  const uniqueIPs = new Set(allAttempts.map((a) => a.ipAddress)).size;

  return {
    totalAttempts: allAttempts.length,
    successfulAttempts: successfulAttempts.length,
    failedAttempts: failedAttempts.length,
    successRate: allAttempts.length > 0 ? (successfulAttempts.length / allAttempts.length) * 100 : 0,
    uniqueEmails,
    uniqueIPs,
    suspiciousIPs: await getSuspiciousIPs(),
  };
}

/**
 * Obter IPs suspeitos (com muitas tentativas falhadas)
 */
export async function getSuspiciousIPs() {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const allAttempts = await db
    .select()
    .from(loginAttempts)
    .where(and(eq(loginAttempts.success, false), gt(loginAttempts.createdAt, oneHourAgo)));

  const ipCounts: Record<string, number> = {};

  for (const attempt of allAttempts) {
    const ip = attempt.ipAddress || "unknown";
    ipCounts[ip] = (ipCounts[ip] || 0) + 1;
  }

  return Object.entries(ipCounts)
    .filter(([_, count]) => count >= 5)
    .map(([ip, count]) => ({ ip, failedAttempts: count }));
}
