import { getDb } from "../db";
import { auditLog } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export type AuditAction = 
  | "CREATE_PRODUCT"
  | "UPDATE_PRODUCT"
  | "DELETE_PRODUCT"
  | "CREATE_CUSTOMER"
  | "UPDATE_CUSTOMER"
  | "DELETE_CUSTOMER"
  | "CREATE_SALE"
  | "UPDATE_SALE"
  | "DELETE_SALE"
  | "CREATE_SUPPLIER_ORDER"
  | "UPDATE_SUPPLIER_ORDER"
  | "DELETE_SUPPLIER_ORDER"
  | "CREATE_CATALOG_ORDER"
  | "UPDATE_CATALOG_ORDER"
  | "DELETE_CATALOG_ORDER"
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_USER"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "CHANGE_SETTINGS"
  | "EXPORT_REPORT"
  | "OTHER";

/**
 * Registra uma ação de auditoria
 */
export async function logAuditAction(
  userId: string,
  tenantId: number,
  action: AuditAction,
  details: Record<string, any> = {},
  resourceId?: string
) {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Audit] Database not available");
      return;
    }

    await db.insert(auditLog).values({
      userId,
      tenantId,
      action,
      details: JSON.stringify(details),
      resourceId,
      timestamp: new Date(),
      ipAddress: process.env.CLIENT_IP || "unknown",
    });
  } catch (error) {
    console.error("[Audit] Failed to log action:", error);
    // Não falhar a operação se o log falhar
  }
}

/**
 * Busca logs de auditoria de um tenant
 */
export async function getAuditLogs(
  tenantId: number,
  limit = 100,
  offset = 0
) {
  try {
    const db = await getDb();
    if (!db) return [];

    const logs = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.tenantId, tenantId))
      .orderBy(auditLog.timestamp)
      .limit(limit)
      .offset(offset);

    return logs.map((log) => ({
      ...log,
      details: typeof log.details === "string" ? JSON.parse(log.details) : log.details,
    }));
  } catch (error) {
    console.error("[Audit] Failed to fetch logs:", error);
    return [];
  }
}

/**
 * Busca logs de um usuário específico
 */
export async function getUserAuditLogs(
  userId: string,
  tenantId: number,
  limit = 50
) {
  try {
    const db = await getDb();
    if (!db) return [];

    const logs = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.userId, userId), eq(auditLog.tenantId, tenantId)))
      .orderBy(auditLog.timestamp)
      .limit(limit);

    return logs.map((log) => ({
      ...log,
      details: typeof log.details === "string" ? JSON.parse(log.details) : log.details,
    }));
  } catch (error) {
    console.error("[Audit] Failed to fetch user logs:", error);
    return [];
  }
}
