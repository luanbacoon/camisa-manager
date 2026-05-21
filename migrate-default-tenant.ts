#!/usr/bin/env tsx
/**
 * Script de Migração para Tenant 'Default'
 * 
 * Este script consolida todos os dados existentes em um único tenant 'default'
 * com ID = 1 para organizar a estrutura multi-tenant do sistema.
 * 
 * Executar com: npx tsx migrate-default-tenant.ts
 */

import { getDb } from './server/db';
import { tenants, users, products, customers, sales, saleItems, supplierOrders, supplierOrderItems, stockAdjustments, catalogOrders, storeSettings, trackingHistory, whatsappTemplates, whatsappHistory, auditLog, suppliers, productGallery } from './drizzle/schema';
import { eq, ne } from 'drizzle-orm';

const DEFAULT_TENANT_ID = 1;
const DEFAULT_TENANT_NAME = 'Default Store';

async function migrateToDefaultTenant() {
  try {
    console.log('🚀 Iniciando migração de dados para tenant "default"...\n');

    const db = await getDb();

    // PASSO 1: Criar ou atualizar tenant 'default'
    console.log('📝 PASSO 1: Criando/atualizando tenant "default"...');
    try {
      await db
        .insert(tenants)
        .values({
          id: DEFAULT_TENANT_ID,
          slug: 'default',
          name: DEFAULT_TENANT_NAME,
          email: 'admin@default.local',
          phone: '+55 11 0000-0000',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      console.log('✅ Tenant "default" criado\n');
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY' || e.errno === 1062) {
        console.log('✅ Tenant "default" já existe\n');
      } else {
        throw e;
      }
    }

    // PASSO 2: Migrar usuários
    console.log('📝 PASSO 2: Migrando usuários...');
    const usersToUpdate = await db
      .select()
      .from(users)
      .where(ne(users.tenantId, DEFAULT_TENANT_ID));
    
    if (usersToUpdate.length > 0) {
      await db
        .update(users)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(users.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${usersToUpdate.length} usuário(s) migrado(s)\n`);
    } else {
      console.log('✅ Todos os usuários já estão no tenant "default"\n');
    }

    // PASSO 3: Migrar produtos
    console.log('📝 PASSO 3: Migrando produtos...');
    const productsToUpdate = await db
      .select()
      .from(products)
      .where(ne(products.tenantId, DEFAULT_TENANT_ID));
    
    if (productsToUpdate.length > 0) {
      await db
        .update(products)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(products.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${productsToUpdate.length} produto(s) migrado(s)\n`);
    } else {
      console.log('✅ Todos os produtos já estão no tenant "default"\n');
    }

    // PASSO 4: Migrar clientes
    console.log('📝 PASSO 4: Migrando clientes...');
    const customersToUpdate = await db
      .select()
      .from(customers)
      .where(ne(customers.tenantId, DEFAULT_TENANT_ID));
    
    if (customersToUpdate.length > 0) {
      await db
        .update(customers)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(customers.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${customersToUpdate.length} cliente(s) migrado(s)\n`);
    } else {
      console.log('✅ Todos os clientes já estão no tenant "default"\n');
    }

    // PASSO 5: Migrar vendas
    console.log('📝 PASSO 5: Migrando vendas...');
    const salesToUpdate = await db
      .select()
      .from(sales)
      .where(ne(sales.tenantId, DEFAULT_TENANT_ID));
    
    if (salesToUpdate.length > 0) {
      await db
        .update(sales)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(sales.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${salesToUpdate.length} venda(s) migrada(s)\n`);
    } else {
      console.log('✅ Todas as vendas já estão no tenant "default"\n');
    }

    // PASSO 6: Migrar itens de venda
    console.log('📝 PASSO 6: Migrando itens de venda...');
    const saleItemsToUpdate = await db
      .select()
      .from(saleItems)
      .where(ne(saleItems.tenantId, DEFAULT_TENANT_ID));
    
    if (saleItemsToUpdate.length > 0) {
      await db
        .update(saleItems)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(saleItems.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${saleItemsToUpdate.length} item(ns) de venda migrado(s)\n`);
    } else {
      console.log('✅ Todos os itens de venda já estão no tenant "default"\n');
    }

    // PASSO 7: Migrar pedidos ao fornecedor
    console.log('📝 PASSO 7: Migrando pedidos ao fornecedor...');
    const supplierOrdersToUpdate = await db
      .select()
      .from(supplierOrders)
      .where(ne(supplierOrders.tenantId, DEFAULT_TENANT_ID));
    
    if (supplierOrdersToUpdate.length > 0) {
      await db
        .update(supplierOrders)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(supplierOrders.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${supplierOrdersToUpdate.length} pedido(s) ao fornecedor migrado(s)\n`);
    } else {
      console.log('✅ Todos os pedidos ao fornecedor já estão no tenant "default"\n');
    }

    // PASSO 8: Migrar itens de pedido ao fornecedor
    console.log('📝 PASSO 8: Migrando itens de pedido ao fornecedor...');
    const supplierOrderItemsToUpdate = await db
      .select()
      .from(supplierOrderItems)
      .where(ne(supplierOrderItems.tenantId, DEFAULT_TENANT_ID));
    
    if (supplierOrderItemsToUpdate.length > 0) {
      await db
        .update(supplierOrderItems)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(supplierOrderItems.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${supplierOrderItemsToUpdate.length} item(ns) de pedido migrado(s)\n`);
    } else {
      console.log('✅ Todos os itens de pedido já estão no tenant "default"\n');
    }

    // PASSO 9: Migrar ajustes de estoque
    console.log('📝 PASSO 9: Migrando ajustes de estoque...');
    const stockAdjustmentsToUpdate = await db
      .select()
      .from(stockAdjustments)
      .where(ne(stockAdjustments.tenantId, DEFAULT_TENANT_ID));
    
    if (stockAdjustmentsToUpdate.length > 0) {
      await db
        .update(stockAdjustments)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(stockAdjustments.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${stockAdjustmentsToUpdate.length} ajuste(s) de estoque migrado(s)\n`);
    } else {
      console.log('✅ Todos os ajustes de estoque já estão no tenant "default"\n');
    }

    // PASSO 10: Migrar pedidos do catálogo
    console.log('📝 PASSO 10: Migrando pedidos do catálogo...');
    const catalogOrdersToUpdate = await db
      .select()
      .from(catalogOrders)
      .where(ne(catalogOrders.tenantId, DEFAULT_TENANT_ID));
    
    if (catalogOrdersToUpdate.length > 0) {
      await db
        .update(catalogOrders)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(catalogOrders.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${catalogOrdersToUpdate.length} pedido(s) do catálogo migrado(s)\n`);
    } else {
      console.log('✅ Todos os pedidos do catálogo já estão no tenant "default"\n');
    }

    // PASSO 11: Migrar configurações da loja
    console.log('📝 PASSO 11: Migrando configurações da loja...');
    const storeSettingsToUpdate = await db
      .select()
      .from(storeSettings)
      .where(ne(storeSettings.tenantId, DEFAULT_TENANT_ID));
    
    if (storeSettingsToUpdate.length > 0) {
      await db
        .update(storeSettings)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(storeSettings.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${storeSettingsToUpdate.length} configuração(ões) migrada(s)\n`);
    } else {
      console.log('✅ Todas as configurações já estão no tenant "default"\n');
    }

    // PASSO 12: Migrar histórico de rastreamento
    console.log('📝 PASSO 12: Migrando histórico de rastreamento...');
    const trackingHistoryToUpdate = await db
      .select()
      .from(trackingHistory)
      .where(ne(trackingHistory.tenantId, DEFAULT_TENANT_ID));
    
    if (trackingHistoryToUpdate.length > 0) {
      await db
        .update(trackingHistory)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(trackingHistory.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${trackingHistoryToUpdate.length} registro(s) de rastreamento migrado(s)\n`);
    } else {
      console.log('✅ Todos os registros de rastreamento já estão no tenant "default"\n');
    }

    // PASSO 13: Migrar templates WhatsApp
    console.log('📝 PASSO 13: Migrando templates WhatsApp...');
    const whatsappTemplatesToUpdate = await db
      .select()
      .from(whatsappTemplates)
      .where(ne(whatsappTemplates.tenantId, DEFAULT_TENANT_ID));
    
    if (whatsappTemplatesToUpdate.length > 0) {
      await db
        .update(whatsappTemplates)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(whatsappTemplates.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${whatsappTemplatesToUpdate.length} template(s) WhatsApp migrado(s)\n`);
    } else {
      console.log('✅ Todos os templates WhatsApp já estão no tenant "default"\n');
    }

    // PASSO 14: Migrar histórico WhatsApp
    console.log('📝 PASSO 14: Migrando histórico WhatsApp...');
    const whatsappHistoryToUpdate = await db
      .select()
      .from(whatsappHistory)
      .where(ne(whatsappHistory.tenantId, DEFAULT_TENANT_ID));
    
    if (whatsappHistoryToUpdate.length > 0) {
      await db
        .update(whatsappHistory)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(whatsappHistory.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${whatsappHistoryToUpdate.length} registro(s) de histórico WhatsApp migrado(s)\n`);
    } else {
      console.log('✅ Todos os registros de histórico WhatsApp já estão no tenant "default"\n');
    }

    // PASSO 15: Migrar log de auditoria
    console.log('📝 PASSO 15: Migrando log de auditoria...');
    const auditLogToUpdate = await db
      .select()
      .from(auditLog)
      .where(ne(auditLog.tenantId, DEFAULT_TENANT_ID));
    
    if (auditLogToUpdate.length > 0) {
      await db
        .update(auditLog)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(auditLog.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${auditLogToUpdate.length} registro(s) de auditoria migrado(s)\n`);
    } else {
      console.log('✅ Todos os registros de auditoria já estão no tenant "default"\n');
    }

    // PASSO 16: Migrar fornecedores
    console.log('📝 PASSO 16: Migrando fornecedores...');
    const suppliersToUpdate = await db
      .select()
      .from(suppliers)
      .where(ne(suppliers.tenantId, DEFAULT_TENANT_ID));
    
    if (suppliersToUpdate.length > 0) {
      await db
        .update(suppliers)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(suppliers.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${suppliersToUpdate.length} fornecedor(es) migrado(s)\n`);
    } else {
      console.log('✅ Todos os fornecedores já estão no tenant "default"\n');
    }

    // PASSO 17: Migrar galeria de produtos
    console.log('📝 PASSO 17: Migrando galeria de produtos...');
    const productGalleryToUpdate = await db
      .select()
      .from(productGallery)
      .where(ne(productGallery.tenantId, DEFAULT_TENANT_ID));
    
    if (productGalleryToUpdate.length > 0) {
      await db
        .update(productGallery)
        .set({ tenantId: DEFAULT_TENANT_ID })
        .where(ne(productGallery.tenantId, DEFAULT_TENANT_ID));
      console.log(`✅ ${productGalleryToUpdate.length} imagem(ns) de galeria migrada(s)\n`);
    } else {
      console.log('✅ Todas as imagens de galeria já estão no tenant "default"\n');
    }

    // VALIDAÇÃO: Verificar integridade dos dados
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
