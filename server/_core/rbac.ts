import { getDb } from "../db";
import { rolePermissions, permissions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Verifica se um usuário tem uma permissão específica baseado em seu role
 */
export async function hasPermission(
  userRole: "admin" | "gerente" | "vendedor" | "visualizador",
  permissionName: string
): Promise<boolean> {
  try {
    const db = await getDb();

    // Admin tem todas as permissões
    if (userRole === "admin") {
      return true;
    }

    // Buscar a permissão
    const perm = await db
      .select()
      .from(permissions)
      .where(eq(permissions.name, permissionName))
      .limit(1);

    if (!perm || perm.length === 0) {
      return false;
    }

    // Buscar se o role tem essa permissão
    const hasAccess = await db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.role, userRole),
          eq(rolePermissions.permissionId, perm[0].id)
        )
      )
      .limit(1);

    return hasAccess && hasAccess.length > 0;
  } catch (error) {
    console.error("Erro ao verificar permissão:", error);
    return false;
  }
}

/**
 * Verifica se um usuário tem qualquer uma das permissões fornecidas
 */
export async function hasAnyPermission(
  userRole: "admin" | "gerente" | "vendedor" | "visualizador",
  permissionNames: string[]
): Promise<boolean> {
  if (userRole === "admin") {
    return true;
  }

  for (const permName of permissionNames) {
    if (await hasPermission(userRole, permName)) {
      return true;
    }
  }

  return false;
}

/**
 * Verifica se um usuário tem todas as permissões fornecidas
 */
export async function hasAllPermissions(
  userRole: "admin" | "gerente" | "vendedor" | "visualizador",
  permissionNames: string[]
): Promise<boolean> {
  if (userRole === "admin") {
    return true;
  }

  for (const permName of permissionNames) {
    if (!(await hasPermission(userRole, permName))) {
      return false;
    }
  }

  return true;
}

/**
 * Inicializa as permissões padrão do sistema
 */
export async function initializeDefaultPermissions(): Promise<void> {
  try {
    const db = await getDb();

    const defaultPermissions = [
      // Produtos
      { name: "products.view", description: "Visualizar produtos" },
      { name: "products.create", description: "Criar produtos" },
      { name: "products.update", description: "Atualizar produtos" },
      { name: "products.delete", description: "Deletar produtos" },

      // Vendas
      { name: "sales.view", description: "Visualizar vendas" },
      { name: "sales.create", description: "Criar vendas" },
      { name: "sales.update", description: "Atualizar vendas" },
      { name: "sales.delete", description: "Deletar vendas" },

      // Clientes
      { name: "customers.view", description: "Visualizar clientes" },
      { name: "customers.create", description: "Criar clientes" },
      { name: "customers.update", description: "Atualizar clientes" },
      { name: "customers.delete", description: "Deletar clientes" },

      // Estoque
      { name: "stock.view", description: "Visualizar estoque" },
      { name: "stock.adjust", description: "Ajustar estoque" },

      // Relatórios
      { name: "reports.view", description: "Visualizar relatórios" },
      { name: "reports.export", description: "Exportar relatórios" },

      // Configurações
      { name: "settings.view", description: "Visualizar configurações" },
      { name: "settings.update", description: "Atualizar configurações" },

      // Fornecedores
      { name: "suppliers.view", description: "Visualizar fornecedores" },
      { name: "suppliers.create", description: "Criar fornecedores" },
      { name: "suppliers.update", description: "Atualizar fornecedores" },
      { name: "suppliers.delete", description: "Deletar fornecedores" },

      // Pedidos ao Fornecedor
      { name: "supplierOrders.view", description: "Visualizar pedidos ao fornecedor" },
      { name: "supplierOrders.create", description: "Criar pedidos ao fornecedor" },
      { name: "supplierOrders.update", description: "Atualizar pedidos ao fornecedor" },
      { name: "supplierOrders.delete", description: "Deletar pedidos ao fornecedor" },

      // Admin
      { name: "admin.users", description: "Gerenciar usuários" },
      { name: "admin.roles", description: "Gerenciar roles" },
      { name: "admin.audit", description: "Visualizar auditoria" },
    ];

    // Inserir permissões que não existem
    for (const perm of defaultPermissions) {
      const exists = await db
        .select()
        .from(permissions)
        .where(eq(permissions.name, perm.name))
        .limit(1);

      if (!exists || exists.length === 0) {
        await db.insert(permissions).values({
          name: perm.name,
          description: perm.description,
        });
      }
    }

    console.log("✅ Permissões padrão inicializadas");
  } catch (error) {
    console.error("Erro ao inicializar permissões:", error);
  }
}

/**
 * Inicializa as permissões padrão para cada role
 */
export async function initializeDefaultRolePermissions(): Promise<void> {
  try {
    const db = await getDb();

    // Definir permissões por role
    const rolePermissionMap: Record<
      "admin" | "gerente" | "vendedor" | "visualizador",
      string[]
    > = {
      admin: [
        // Admin tem todas as permissões
        "products.view",
        "products.create",
        "products.update",
        "products.delete",
        "sales.view",
        "sales.create",
        "sales.update",
        "sales.delete",
        "customers.view",
        "customers.create",
        "customers.update",
        "customers.delete",
        "stock.view",
        "stock.adjust",
        "reports.view",
        "reports.export",
        "settings.view",
        "settings.update",
        "suppliers.view",
        "suppliers.create",
        "suppliers.update",
        "suppliers.delete",
        "supplierOrders.view",
        "supplierOrders.create",
        "supplierOrders.update",
        "supplierOrders.delete",
        "admin.users",
        "admin.roles",
        "admin.audit",
      ],
      gerente: [
        // Gerente pode fazer quase tudo menos deletar e gerenciar admin
        "products.view",
        "products.create",
        "products.update",
        "sales.view",
        "sales.create",
        "sales.update",
        "customers.view",
        "customers.create",
        "customers.update",
        "stock.view",
        "stock.adjust",
        "reports.view",
        "reports.export",
        "settings.view",
        "suppliers.view",
        "suppliers.create",
        "suppliers.update",
        "supplierOrders.view",
        "supplierOrders.create",
        "supplierOrders.update",
        "admin.audit",
      ],
      vendedor: [
        // Vendedor pode criar vendas e visualizar dados
        "products.view",
        "sales.view",
        "sales.create",
        "customers.view",
        "customers.create",
        "stock.view",
        "reports.view",
      ],
      visualizador: [
        // Visualizador pode apenas visualizar
        "products.view",
        "sales.view",
        "customers.view",
        "stock.view",
        "reports.view",
        "settings.view",
      ],
    };

    // Inserir permissões para cada role
    for (const [role, permNames] of Object.entries(rolePermissionMap)) {
      for (const permName of permNames) {
        // Buscar a permissão
        const perm = await db
          .select()
          .from(permissions)
          .where(eq(permissions.name, permName))
          .limit(1);

        if (perm && perm.length > 0) {
          // Verificar se já existe
          const exists = await db
            .select()
            .from(rolePermissions)
            .where(
              and(
                eq(rolePermissions.role, role as any),
                eq(rolePermissions.permissionId, perm[0].id)
              )
            )
            .limit(1);

          if (!exists || exists.length === 0) {
            await db.insert(rolePermissions).values({
              role: role as any,
              permissionId: perm[0].id,
            });
          }
        }
      }
    }

    console.log("✅ Permissões de role inicializadas");
  } catch (error) {
    console.error("Erro ao inicializar permissões de role:", error);
  }
}
