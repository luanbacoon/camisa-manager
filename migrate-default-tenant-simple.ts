#!/usr/bin/env tsx
/**
 * Script de Migração para Tenant 'Default' - Versão Simplificada
 * 
 * Este script consolida todos os dados existentes em um único tenant 'default'
 * com ID = 1 para organizar a estrutura multi-tenant do sistema.
 * 
 * Executar com: npx tsx migrate-default-tenant-simple.ts
 */

import { getDb } from './server/db';
import { tenants, users, products, customers, sales, supplierOrders, supplierOrderItems, stockAdjustments, catalogOrders, storeSettings, trackingHistory, whatsappTemplates, whatsappHistory, auditLog, suppliers, productGallery } from './drizzle/schema';
import { eq, ne } from 'drizzle-orm';

const DEFAULT_TENANT_ID = 1;
const DEFAULT_TENANT_NAME = 'Default Store';

async function migrateToDefaultTenant() {
  try {
    console.log('🚀 Iniciando migração de dados para tenant "default"...\n');

    const db = await getDb();

    // Tenant 'default' com ID 1 já existe
    console.log('📝 PASSO 1: Tenant "default" (ID=1) já existe, pulando criação\n');

    // Array de tabelas com tenantId e seus nomes
    const tablesToMigrate = [
      { table: users, name: 'usuários' },
      { table: products, name: 'produtos' },
      { table: customers, name: 'clientes' },
      { table: sales, name: 'vendas' },
      { table: supplierOrders, name: 'pedidos ao fornecedor' },
      { table: supplierOrderItems, name: 'itens de pedido ao fornecedor' },
      { table: stockAdjustments, name: 'ajustes de estoque' },
      { table: catalogOrders, name: 'pedidos do catálogo' },
      { table: storeSettings, name: 'configurações da loja' },
      { table: trackingHistory, name: 'histórico de rastreamento' },
      { table: whatsappTemplates, name: 'templates WhatsApp' },
      { table: whatsappHistory, name: 'histórico WhatsApp' },
      { table: auditLog, name: 'log de auditoria' },
      { table: suppliers, name: 'fornecedores' },
      { table: productGallery, name: 'galeria de produtos' },
    ];

    let stepNumber = 2;
    for (const { table, name } of tablesToMigrate) {
      console.log(`📝 PASSO ${stepNumber}: Migrando ${name}...`);
      
      try {
        const toUpdate = await db
          .select()
          .from(table)
          .where(ne(table.tenantId, DEFAULT_TENANT_ID));
        
        if (toUpdate.length > 0) {
          await db
            .update(table)
            .set({ tenantId: DEFAULT_TENANT_ID })
            .where(ne(table.tenantId, DEFAULT_TENANT_ID));
          console.log(`✅ ${toUpdate.length} ${name} migrado(s)\n`);
        } else {
          console.log(`✅ Todos os ${name} já estão no tenant "default"\n`);
        }
      } catch (e: any) {
        console.log(`⚠️  Tabela ${name} não encontrada ou sem tenantId, pulando...\n`);
      }
      
      stepNumber++;
    }

    // VALIDAÇÃO
    console.log('\n🔍 VALIDAÇÃO: Verificando integridade dos dados...\n');

    const tenantCount = await db.select().from(tenants).where(eq(tenants.id, DEFAULT_TENANT_ID));
    console.log(`📊 Tenants com ID 1: ${tenantCount.length}`);

    const userCount = await db.select().from(users).where(eq(users.tenantId, DEFAULT_TENANT_ID));
    console.log(`📊 Usuários no tenant "default": ${userCount.length}`);

    const productCount = await db.select().from(products).where(eq(products.tenantId, DEFAULT_TENANT_ID));
    console.log(`📊 Produtos no tenant "default": ${productCount.length}`);

    const customerCount = await db.select().from(customers).where(eq(customers.tenantId, DEFAULT_TENANT_ID));
    console.log(`📊 Clientes no tenant "default": ${customerCount.length}`);

    const saleCount = await db.select().from(sales).where(eq(sales.tenantId, DEFAULT_TENANT_ID));
    console.log(`📊 Vendas no tenant "default": ${saleCount.length}`);

    const supplierOrderCount = await db.select().from(supplierOrders).where(eq(supplierOrders.tenantId, DEFAULT_TENANT_ID));
    console.log(`📊 Pedidos ao fornecedor no tenant "default": ${supplierOrderCount.length}`);

    const catalogOrderCount = await db.select().from(catalogOrders).where(eq(catalogOrders.tenantId, DEFAULT_TENANT_ID));
    console.log(`📊 Pedidos do catálogo no tenant "default": ${catalogOrderCount.length}`);

    console.log('\n✅ Migração concluída com sucesso!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

migrateToDefaultTenant();
