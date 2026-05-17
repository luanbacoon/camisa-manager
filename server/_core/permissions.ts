import { getDb } from "../db";
import { permissions, rolePermissions } from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

export type Role = "admin" | "gerente" | "vendedor" | "visualizador";

/**
 * Permissões disponíveis no sistema
 * Formato: "recurso.ação"
 */
export const PERMISSIONS = {
  // Produtos
  "products.list": "Listar produtos",
  "products.create": "Criar produto",
  "products.update": "Editar produto",
  "products.delete": "Deletar produto",
  "products.uploadImage": "Upload de imagens",

  // Vendas
  "sales.list": "Listar vendas",
  "sales.create": "Criar venda",
  "sales.update": "Editar venda",
  "sales.delete": "Deletar venda",
  "sales.viewMetrics": "Visualizar métricas",

  // Clientes
  "customers.list": "Listar clientes",
  "customers.create": "Criar cliente",
  "customers.update": "Editar cliente",
  "customers.delete": "Deletar cliente",

  // Estoque
  "stock.list": "Listar estoque",
  "stock.adjust": "Ajustar estoque",
  "stock.viewHistory": "Visualizar histórico",

  // Pedidos ao Fornecedor
  "supplierOrders.list": "Listar pedidos ao fornecedor",
  "supplierOrders.create": "Criar pedido ao fornecedor",
  "supplierOrders.update": "Editar pedido ao fornecedor",
  "supplierOrders.delete": "Deletar pedido ao fornecedor",

  // Catálogo
  "catalog.manage": "Gerenciar catálogo",
  "catalog.viewOrders": "Visualizar pedidos do catálogo",

  // Configurações
  "settings.view": "Visualizar configurações",
  "settings.update": "Editar configurações",
  "settings.manageUsers": "Gerenciar usuários",
  "settings.viewAudit": "Visualizar auditoria",

  // WhatsApp
  "whatsapp.manage": "Gerenciar WhatsApp",
  "whatsapp.viewHistory": "Visualizar histórico de mensagens",

  // Dashboard
  "dashboard.view": "Visualizar dashboard",

  // Relatórios
  "reports.view": "Visualizar relatórios",
  "reports.export": "Exportar relatórios",
} as const;

/**
 * Permissões padrão por role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, (keyof typeof PERMISSIONS)[]> = {
  admin: Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[],
  gerente: [
    "products.list",
    "products.create",
    "products.update",
    "products.delete",
    "products.uploadImage",
    "sales.list",
    "sales.create",
    "sales.update",
    "sales.delete",
    "sales.viewMetrics",
    "customers.list",
    "customers.create",
    "customers.update",
    "customers.delete",
    "stock.list",
    "stock.adjust",
    "stock.viewHistory",
    "supplierOrders.list",
    "supplierOrders.create",
    "supplierOrders.update",
    "supplierOrders.delete",
    "catalog.manage",
    "catalog.viewOrders",
    "settings.view",
    "whatsapp.manage",
    "whatsapp.viewHistory",
    "dashboard.view",
    "reports.view",
    "reports.export",
  ],
  vendedor: [
    "products.list",
    "sales.list",
    "sales.create",
    "sales.update",
    "customers.list",
    "customers.create",
    "customers.update",
    "stock.list",
    "stock.viewHistory",
    "catalog.viewOrders",
    "dashboard.view",
  ],
  visualizador: [
    "products.list",
    "sales.list",
    "customers.list",
    "stock.list",
    "stock.viewHistory",
    "catalog.viewOrders",
    "dashboard.view",
    "reports.view",
  ],
};

/**
 * Inicializar permissões padrão no banco de dados
 */
export async function initializePermissions() {
  try {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    // Verificar se já existem permissões
    const existing = await db.select().from(permissions).limit(1);
    if (existing.length > 0) {
      console.log("Permissões já inicializadas");
      return;
    }

    // Inserir todas as permissões
    const permissionsList = Object.entries(PERMISSIONS).map(([name, description]) => ({
      name,
      description,
    }));

    await db.insert(permissions).values(permissionsList);

    // Inserir role_permissions padrão
    const rolePerms: Array<{ role: Role; permissionId: number }> = [];

    for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      for (const permName of perms) {
        const perm = permissionsList.find((p) => p.name === permName);
        if (perm) {
          rolePerms.push({
            role: role as Role,
            permissionId: permissionsList.indexOf(perm) + 1, // ID será 1-based após insert
          });
        }
      }
    }

    console.log(`Inicializadas ${permissionsList.length} permissões`);
    console.log(`Inicializadas ${rolePerms.length} role-permissions`);
  } catch (error) {
    console.error("Erro ao inicializar permissões:", error);
  }
}

/**
 * Verificar se um role tem uma permissão específica
 */
export async function hasPermission(
  role: Role,
  permission: keyof typeof PERMISSIONS
): Promise<boolean> {
  const perms = DEFAULT_ROLE_PERMISSIONS[role];
  return perms.includes(permission);
}

/**
 * Obter todas as permissões de um role
 */
export async function getRolePermissions(
  role: Role
): Promise<(keyof typeof PERMISSIONS)[]> {
  return DEFAULT_ROLE_PERMISSIONS[role];
}

/**
 * Validar se uma ação é permitida
 */
export function checkPermission(role: Role, permission: keyof typeof PERMISSIONS): boolean {
  return DEFAULT_ROLE_PERMISSIONS[role].includes(permission);
}
