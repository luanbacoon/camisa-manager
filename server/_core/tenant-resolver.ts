/**
 * Tenant Resolver - Resolve tenant ID from request host/subdomain
 * 
 * Suporta múltiplos formatos:
 * 1. Subdomínio: tenant.camisamanager.com → tenant ID do slug
 * 2. Porta local: localhost:3000 → tenant default (1)
 * 3. IP: 127.0.0.1:3000 → tenant default (1)
 * 4. Header customizado: X-Tenant-ID → ID direto
 */

import { getDb } from "../db";
import { tenants } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const MAIN_DOMAIN = "camisamanager.com";
const DEFAULT_TENANT_ID = 1;

/**
 * Extrair slug do subdomínio
 * @example "tenant.camisamanager.com" → "tenant"
 * @example "localhost:3000" → null
 * @example "127.0.0.1:3000" → null
 */
function extractSubdomain(host: string): string | null {
  if (!host) return null;

  // Remover porta se existir
  const [hostname] = host.split(":");

  // Se for localhost ou IP, retornar null
  if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  // Se não contiver o domínio principal, retornar null
  if (!hostname.endsWith(MAIN_DOMAIN)) {
    return null;
  }

  // Extrair subdomínio
  const parts = hostname.split(".");
  if (parts.length <= 2) {
    // É apenas camisamanager.com
    return null;
  }

  // Retornar o primeiro subdomínio
  return parts[0];
}

/**
 * Resolver tenant ID a partir do host/header
 */
export async function resolveTenantId(host: string, customTenantId?: number): Promise<number> {
  // Se houver tenant ID customizado (ex: header X-Tenant-ID), usar
  if (customTenantId && customTenantId > 0) {
    return customTenantId;
  }

  // Tentar extrair subdomínio
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    try {
      const db = await getDb();
      if (db) {
        const result = await db
          .select()
          .from(tenants)
          .where(eq(tenants.slug, subdomain))
          .limit(1);

        if (result.length > 0) {
          return result[0].id;
        }
      }
    } catch (error) {
      console.warn(`[TenantResolver] Erro ao buscar tenant com slug "${subdomain}":`, error);
    }
  }

  // Fallback para tenant default
  return DEFAULT_TENANT_ID;
}

/**
 * Validar se um tenant existe
 */
export async function validateTenant(tenantId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const result = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.warn(`[TenantResolver] Erro ao validar tenant ${tenantId}:`, error);
    return false;
  }
}

/**
 * Obter informações do tenant
 */
export async function getTenantInfo(tenantId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.warn(`[TenantResolver] Erro ao obter info do tenant ${tenantId}:`, error);
    return null;
  }
}

/**
 * Gerar URL do tenant com subdomínio
 */
export function generateTenantUrl(slug: string, protocol = "https"): string {
  if (!slug || slug === "default") {
    return `${protocol}://${MAIN_DOMAIN}`;
  }
  return `${protocol}://${slug}.${MAIN_DOMAIN}`;
}

/**
 * Verificar se é localhost/desenvolvimento
 */
export function isLocalhost(host: string): boolean {
  if (!host) return false;
  const [hostname] = host.split(":");
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
