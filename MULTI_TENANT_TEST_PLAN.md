# Plano de Testes - Isolamento Multi-Tenant

## 1. Visão Geral

Este documento detalha o plano de testes para validar o isolamento de dados entre tenants no CamisaManager. O objetivo é garantir que **nenhum tenant consiga acessar, modificar ou visualizar dados de outro tenant**.

---

## 2. Estado Atual do Isolamento

### 2.1 Tabelas COM tenantId (11 tabelas)

| Tabela | tenantId | Filtro em db.ts | Filtro em routers.ts |
|--------|----------|-----------------|---------------------|
| `products` | ✅ NOT NULL | ✅ `listProducts(tenantId?)` | ❌ Não passa tenantId na listagem |
| `customers` | ✅ NOT NULL | ❌ Sem filtro | ❌ Não passa tenantId |
| `sales` | ✅ NOT NULL | ❌ Sem filtro | ❌ Não passa tenantId |
| `supplier_orders` | ✅ NOT NULL | ❌ Sem filtro | ❌ Não passa tenantId |
| `catalog_orders` | ✅ NOT NULL | ❌ Sem filtro | ❌ Não passa tenantId |
| `local_users` | ✅ NOT NULL | ✅ (via auth) | ✅ (via auth) |
| `suppliers` | ✅ NOT NULL | ✅ (via router) | ✅ (via router) |
| `user_tenants` | ✅ NOT NULL | ✅ (via context) | ✅ (via context) |
| `audit_log` | ✅ NOT NULL | N/A | N/A |
| `subscriptions` | ✅ NOT NULL | N/A | N/A |
| `invoices` | ✅ NOT NULL | N/A | N/A |

### 2.2 Tabelas SEM tenantId (18 tabelas)

| Tabela | Precisa de tenantId? | Justificativa |
|--------|---------------------|---------------|
| `users` | ❌ Não | Tabela global de autenticação |
| `store_settings` | ✅ **SIM** | Cada loja tem suas configurações |
| `product_sizes` | ⚠️ Indireto | Isolado via productId (se product é isolado) |
| `product_gallery` | ⚠️ Indireto | Isolado via productId |
| `sale_items` | ⚠️ Indireto | Isolado via saleId |
| `supplier_order_items` | ⚠️ Indireto | Isolado via orderId |
| `tracking_history` | ⚠️ Indireto | Isolado via orderId |
| `stock_adjustments` | ⚠️ Indireto | Isolado via productId |
| `whatsapp_templates` | ✅ **SIM** | Cada loja tem seus templates |
| `whatsapp_history` | ⚠️ Indireto | Isolado via orderId |
| `tenants` | ❌ Não | Tabela de referência |
| `permissions` | ❌ Não | Tabela global de permissões |
| `role_permissions` | ❌ Não | Tabela global |
| `two_factor_secrets` | ❌ Não | Vinculado a userId |
| `login_attempts` | ❌ Não | Vinculado a userId |
| `backups` | ✅ **SIM** | Cada loja tem seus backups |
| `password_reset_tokens` | ❌ Não | Vinculado a userId |
| `session_tokens` | ❌ Não | Vinculado a userId |

### 2.3 Gaps Críticos Identificados

**NÍVEL CRÍTICO (Vazamento de Dados):**

1. **`listCustomers()`** - Retorna TODOS os clientes de TODOS os tenants
2. **`listSales()`** - Retorna TODAS as vendas de TODOS os tenants
3. **`listSupplierOrders()`** - Retorna TODOS os pedidos de TODOS os tenants
4. **`listCatalogOrders()`** - Retorna TODOS os pedidos do catálogo
5. **`getDashboardMetrics()`** - Calcula métricas com dados de TODOS os tenants
6. **`getChartData()`** - Gráficos com dados de TODOS os tenants
7. **`listStockWithProducts()`** - Estoque de TODOS os tenants
8. **`listProducts()`** - Não passa tenantId no router (apesar de suportar)

**NÍVEL ALTO (Acesso Cross-Tenant):**

9. **`getCustomer(id)`** - Permite acessar cliente de outro tenant por ID
10. **`getSaleWithItems(id)`** - Permite acessar venda de outro tenant por ID
11. **`updateCustomer(id)`** - Permite editar cliente de outro tenant
12. **`updateProduct(id)`** - Permite editar produto de outro tenant
13. **`updateSupplierOrder(id)`** - Permite editar pedido de outro tenant
14. **`markSupplierOrderReceived(id)`** - Permite marcar pedido de outro tenant como recebido
15. **`deleteProductSafe(id)`** - Permite deletar produto de outro tenant

**NÍVEL MÉDIO (Configurações Compartilhadas):**

16. **`getStoreSettings()`** - Retorna configurações globais (deveria ser por tenant)
17. **`listWhatsAppTemplates()`** - Templates compartilhados entre tenants
18. **`getStockHistory()`** - Histórico de estoque sem filtro de tenant

---

## 3. Cenários de Teste

### 3.1 Testes de Isolamento de Listagem (Prioridade: CRÍTICA)

| ID | Cenário | Entrada | Resultado Esperado |
|----|---------|---------|-------------------|
| T01 | Tenant A lista produtos | Usuário do Tenant A | Apenas produtos do Tenant A |
| T02 | Tenant B lista produtos | Usuário do Tenant B | Apenas produtos do Tenant B |
| T03 | Tenant A lista clientes | Usuário do Tenant A | Apenas clientes do Tenant A |
| T04 | Tenant B lista clientes | Usuário do Tenant B | Apenas clientes do Tenant B |
| T05 | Tenant A lista vendas | Usuário do Tenant A | Apenas vendas do Tenant A |
| T06 | Tenant A lista pedidos ao fornecedor | Usuário do Tenant A | Apenas pedidos do Tenant A |
| T07 | Tenant A lista pedidos do catálogo | Usuário do Tenant A | Apenas pedidos do Tenant A |
| T08 | Tenant A vê dashboard | Usuário do Tenant A | Métricas apenas do Tenant A |
| T09 | Tenant A vê gráficos | Usuário do Tenant A | Dados apenas do Tenant A |
| T10 | Tenant A vê estoque | Usuário do Tenant A | Estoque apenas do Tenant A |

### 3.2 Testes de Acesso Cross-Tenant (Prioridade: ALTA)

| ID | Cenário | Entrada | Resultado Esperado |
|----|---------|---------|-------------------|
| T11 | Tenant A busca cliente do Tenant B por ID | `getCustomer(idDoTenantB)` | Retornar null ou erro 403 |
| T12 | Tenant A busca venda do Tenant B por ID | `getSaleWithItems(idDoTenantB)` | Retornar null ou erro 403 |
| T13 | Tenant A edita produto do Tenant B | `updateProduct(idDoTenantB, data)` | Erro 403 |
| T14 | Tenant A edita cliente do Tenant B | `updateCustomer(idDoTenantB, data)` | Erro 403 |
| T15 | Tenant A deleta produto do Tenant B | `deleteProductSafe(idDoTenantB)` | Erro 403 |
| T16 | Tenant A marca pedido do Tenant B como recebido | `markSupplierOrderReceived(idDoTenantB)` | Erro 403 |
| T17 | Tenant A edita pedido do Tenant B | `updateSupplierOrder(idDoTenantB, data)` | Erro 403 |
| T18 | Tenant A cancela pedido catálogo do Tenant B | `updateCatalogOrderStatus(idDoTenantB, 'cancelado')` | Erro 403 |

### 3.3 Testes de Criação com Tenant Correto (Prioridade: ALTA)

| ID | Cenário | Entrada | Resultado Esperado |
|----|---------|---------|-------------------|
| T19 | Criar produto como Tenant A | `createProduct(data)` | Produto criado com tenantId do Tenant A |
| T20 | Criar cliente como Tenant A | `createCustomer(data)` | Cliente criado com tenantId do Tenant A |
| T21 | Criar venda como Tenant A | `createSale(data)` | Venda criada com tenantId do Tenant A |
| T22 | Criar pedido fornecedor como Tenant A | `createSupplierOrder(data)` | Pedido com tenantId do Tenant A |
| T23 | Criar pedido catálogo como Tenant A | `createCatalogOrder(data)` | Pedido com tenantId do Tenant A |
| T24 | Criar fornecedor como Tenant A | `createSupplier(data)` | Fornecedor com tenantId do Tenant A |

### 3.4 Testes de Isolamento Indireto (Prioridade: MÉDIA)

| ID | Cenário | Entrada | Resultado Esperado |
|----|---------|---------|-------------------|
| T25 | Tenant A lista tamanhos de produto do Tenant B | `getProductWithSizes(idDoTenantB)` | Retornar null ou erro 403 |
| T26 | Tenant A lista galeria de produto do Tenant B | `getProductGallery(idDoTenantB)` | Retornar [] ou erro 403 |
| T27 | Tenant A lista itens de venda do Tenant B | `getSaleWithItems(idDoTenantB)` | Retornar null ou erro 403 |
| T28 | Tenant A lista histórico de estoque do Tenant B | `getStockHistory(productIdDoTenantB)` | Retornar [] |
| T29 | Tenant A lista tracking de pedido do Tenant B | `getTrackingHistory(orderIdDoTenantB)` | Retornar [] |
| T30 | Tenant A lista WhatsApp history de pedido do Tenant B | `getWhatsAppHistory(orderIdDoTenantB)` | Retornar [] |

### 3.5 Testes de Configurações por Tenant (Prioridade: MÉDIA)

| ID | Cenário | Entrada | Resultado Esperado |
|----|---------|---------|-------------------|
| T31 | Tenant A atualiza configurações da loja | `updateStoreSettings(data)` | Apenas configurações do Tenant A atualizadas |
| T32 | Tenant B lê configurações da loja | `getStoreSettings()` | Configurações do Tenant B |
| T33 | Tenant A lista templates WhatsApp | `listWhatsAppTemplates()` | Apenas templates do Tenant A |
| T34 | Tenant A atualiza template WhatsApp | `updateWhatsAppTemplate(data)` | Apenas template do Tenant A atualizado |

### 3.6 Testes de Autenticação e Contexto (Prioridade: CRÍTICA)

| ID | Cenário | Entrada | Resultado Esperado |
|----|---------|---------|-------------------|
| T35 | Usuário OAuth recebe tenantId automaticamente | Login via Manus OAuth | `ctx.user.tenantId` preenchido |
| T36 | Usuário local recebe tenantId do tenant associado | Login via email/senha | `ctx.user.tenantId` correto |
| T37 | Usuário sem tenant tenta acessar dados | Sem tenantId no contexto | Erro 403 ou dados vazios |
| T38 | Usuário com tenant inválido tenta acessar dados | tenantId inexistente | Erro 403 ou dados vazios |
| T39 | Fallback de tenantId não vaza dados | `tenantId || 1` | ⚠️ PERIGOSO - deve ser removido |

### 3.7 Testes de Edge Cases (Prioridade: ALTA)

| ID | Cenário | Entrada | Resultado Esperado |
|----|---------|---------|-------------------|
| T40 | Usuário admin global tenta acessar dados de todos | Role admin | Depende da regra de negócio |
| T41 | Usuário muda de tenant (multi-tenant user) | Troca de tenant ativo | Dados do novo tenant |
| T42 | Tenant suspenso tenta acessar dados | Tenant com status 'suspenso' | Erro 403 |
| T43 | Tenant deletado tenta acessar dados | Tenant com cascade delete | Dados removidos |
| T44 | Criação de dados com tenantId=0 | Tentativa de bypass | Erro de validação |
| T45 | SQL injection no tenantId | `tenantId = "1 OR 1=1"` | Erro de tipo (number) |

---

## 4. Implementação dos Testes

### 4.1 Setup de Teste

```typescript
// server/multi-tenant.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { tenants, userTenants, products, customers, sales } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Criar 2 tenants de teste
let tenantA: number;
let tenantB: number;
let userA: { id: number; tenantId: number };
let userB: { id: number; tenantId: number };

beforeAll(async () => {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Criar Tenant A
  const [resultA] = await db.insert(tenants).values({
    name: "Loja A - Teste",
    slug: "loja-a-teste",
    email: "loja-a@teste.com",
    phone: "11999990001",
    plan: "basico",
    status: "ativo",
    maxProducts: 100,
    maxUsers: 5,
  });
  tenantA = (resultA as any).insertId;

  // Criar Tenant B
  const [resultB] = await db.insert(tenants).values({
    name: "Loja B - Teste",
    slug: "loja-b-teste",
    email: "loja-b@teste.com",
    phone: "11999990002",
    plan: "basico",
    status: "ativo",
    maxProducts: 100,
    maxUsers: 5,
  });
  tenantB = (resultB as any).insertId;

  // Simular contextos de usuário
  userA = { id: 100, tenantId: tenantA };
  userB = { id: 200, tenantId: tenantB };

  // Inserir dados de teste para Tenant A
  await db.insert(products).values({
    name: "Camisa Flamengo - Tenant A",
    tenantId: tenantA,
    cost: "50.00",
    avgCost: "50.00",
    price: "120.00",
  });

  // Inserir dados de teste para Tenant B
  await db.insert(products).values({
    name: "Camisa Vasco - Tenant B",
    tenantId: tenantB,
    cost: "45.00",
    avgCost: "45.00",
    price: "110.00",
  });
});

afterAll(async () => {
  const db = await getDb();
  if (!db) return;
  // Limpar dados de teste
  await db.delete(tenants).where(eq(tenants.slug, "loja-a-teste"));
  await db.delete(tenants).where(eq(tenants.slug, "loja-b-teste"));
});
```

### 4.2 Testes de Isolamento de Listagem

```typescript
describe("Isolamento de Listagem", () => {
  it("T01: Tenant A só vê seus produtos", async () => {
    const products = await listProducts(false, tenantA);
    expect(products.every(p => p.tenantId === tenantA)).toBe(true);
    expect(products.some(p => p.tenantId === tenantB)).toBe(false);
  });

  it("T03: Tenant A só vê seus clientes", async () => {
    const customers = await listCustomers(tenantA);
    expect(customers.every(c => c.tenantId === tenantA)).toBe(true);
  });

  it("T05: Tenant A só vê suas vendas", async () => {
    const sales = await listSales(undefined, undefined, tenantA);
    expect(sales.every(s => s.tenantId === tenantA)).toBe(true);
  });
});
```

### 4.3 Testes de Acesso Cross-Tenant

```typescript
describe("Acesso Cross-Tenant", () => {
  it("T11: Tenant A NÃO pode acessar cliente do Tenant B", async () => {
    // Criar cliente no Tenant B
    const clienteB = await createCustomer({ name: "Cliente B", tenantId: tenantB });
    
    // Tenant A tenta acessar
    const result = await getCustomer(clienteB, tenantA);
    expect(result).toBeNull(); // Deve retornar null
  });

  it("T13: Tenant A NÃO pode editar produto do Tenant B", async () => {
    // Buscar produto do Tenant B
    const produtosB = await listProducts(false, tenantB);
    const produtoB = produtosB[0];
    
    // Tenant A tenta editar (deve falhar)
    await expect(
      updateProduct(produtoB.id, { name: "Hackeado" }, tenantA)
    ).rejects.toThrow("FORBIDDEN");
  });
});
```

### 4.4 Testes de Criação

```typescript
describe("Criação com Tenant Correto", () => {
  it("T19: Produto criado herda tenantId do usuário", async () => {
    const productId = await createProduct(
      { name: "Novo Produto", tenantId: tenantA, cost: "30", avgCost: "30", price: "80" },
      [{ size: "M", stock: 10 }]
    );
    
    const product = await getProductWithSizes(productId, tenantA);
    expect(product?.tenantId).toBe(tenantA);
  });
});
```

---

## 5. Matriz de Priorização

| Prioridade | Quantidade | Descrição |
|-----------|-----------|-----------|
| 🔴 CRÍTICA | 12 testes | Vazamento de dados em listagens e contexto |
| 🟠 ALTA | 18 testes | Acesso cross-tenant e criação |
| 🟡 MÉDIA | 15 testes | Isolamento indireto e configurações |
| **TOTAL** | **45 testes** | |

---

## 6. Correções Necessárias (Pré-Requisitos)

### 6.1 Fase 1: Corrigir Funções de Listagem em db.ts

**Estratégia:** Usar `where` condicional com `as any` para evitar erros de tipo Drizzle.

```typescript
// Padrão a aplicar em TODAS as funções de listagem:
export async function listCustomers(tenantId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (tenantId) {
    return db.select().from(customers)
      .where(eq(customers.tenantId, tenantId))
      .orderBy(desc(customers.createdAt));
  }
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}
```

**Funções a corrigir:**
1. `listCustomers()` → adicionar `tenantId?: number`
2. `listSales()` → adicionar `tenantId?: number`
3. `listSupplierOrders()` → adicionar `tenantId?: number`
4. `listCatalogOrders()` → adicionar `tenantId?: number`
5. `getDashboardMetrics()` → adicionar `tenantId?: number`
6. `getChartData()` → adicionar `tenantId?: number`
7. `listStockWithProducts()` → adicionar `tenantId?: number`
8. `getCustomer()` → adicionar `tenantId?: number`
9. `getSaleWithItems()` → adicionar `tenantId?: number`
10. `getCustomerSales()` → adicionar `tenantId?: number`

### 6.2 Fase 2: Atualizar Routers para Passar tenantId

```typescript
// Padrão a aplicar em TODOS os procedures de listagem:
list: protectedProcedure.query(({ ctx }) => {
  const tenantId = (ctx.user as any)?.tenantId;
  if (!tenantId) throw new TRPCError({ code: "FORBIDDEN", message: "Tenant não encontrado" });
  return listCustomers(tenantId);
}),
```

### 6.3 Fase 3: Adicionar Validação Cross-Tenant em Gets/Updates

```typescript
// Padrão para funções de get/update/delete:
get: protectedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input, ctx }) => {
    const tenantId = (ctx.user as any)?.tenantId;
    const customer = await getCustomer(input.id);
    if (customer && customer.tenantId !== tenantId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    return customer;
  }),
```

### 6.4 Fase 4: Remover Fallbacks Perigosos

**URGENTE:** Remover todos os `|| 1` de tenantId:

```typescript
// ❌ PERIGOSO - Fallback para tenant 1
const tenantId = (ctx.user as any)?.tenantId || 1;

// ✅ SEGURO - Erro se não tem tenant
const tenantId = (ctx.user as any)?.tenantId;
if (!tenantId) throw new TRPCError({ code: "FORBIDDEN", message: "Tenant obrigatório" });
```

---

## 7. Ferramentas de Teste

### 7.1 Vitest (Unitários)

```bash
pnpm test                    # Executar todos os testes
pnpm test multi-tenant       # Executar apenas testes multi-tenant
pnpm test --coverage         # Com cobertura
```

### 7.2 Teste Manual via API

```bash
# Criar 2 sessões com tenants diferentes
# Sessão Tenant A
curl -H "Authorization: Bearer TOKEN_A" \
  http://localhost:3000/api/trpc/customers.list

# Sessão Tenant B
curl -H "Authorization: Bearer TOKEN_B" \
  http://localhost:3000/api/trpc/customers.list

# Comparar resultados - devem ser diferentes
```

### 7.3 Teste de Penetração

```bash
# Tentar acessar recurso de outro tenant por ID
curl -H "Authorization: Bearer TOKEN_A" \
  http://localhost:3000/api/trpc/customers.get?input={"id":999}

# Deve retornar null ou 403, NUNCA dados do Tenant B
```

---

## 8. Critérios de Aceitação

Para considerar o isolamento multi-tenant **COMPLETO**, todos os seguintes critérios devem ser atendidos:

1. ✅ **Zero vazamento de dados** - Nenhuma query retorna dados de outro tenant
2. ✅ **Zero acesso cross-tenant** - Nenhuma operação CRUD permite acessar dados de outro tenant
3. ✅ **Criação correta** - Todos os registros são criados com o tenantId correto
4. ✅ **Sem fallbacks perigosos** - Nenhum `|| 1` ou valor hardcoded
5. ✅ **Tenant obrigatório** - Procedures protegidos exigem tenantId válido
6. ✅ **45 testes passando** - Todos os cenários descritos neste documento
7. ✅ **Cobertura > 90%** - Em funções que lidam com dados multi-tenant

---

## 9. Timeline Estimada

| Fase | Duração | Descrição |
|------|---------|-----------|
| Fase 1 | 2h | Corrigir funções de listagem em db.ts |
| Fase 2 | 1h | Atualizar routers para passar tenantId |
| Fase 3 | 2h | Adicionar validação cross-tenant |
| Fase 4 | 30min | Remover fallbacks perigosos |
| Testes | 3h | Implementar 45 cenários de teste |
| **TOTAL** | **8.5h** | |

---

## 10. Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Erros de tipo Drizzle ao mudar assinaturas | Alto | Usar padrão if/else ao invés de `let query` |
| Breaking changes em procedures existentes | Médio | Manter parâmetros opcionais |
| Dados existentes sem tenantId | Alto | Migrar dados para tenant padrão antes |
| Performance com filtro adicional | Baixo | Índice em tenantId já existe |
| Fallback `|| 1` em produção | Crítico | Remover ANTES de deploy |
