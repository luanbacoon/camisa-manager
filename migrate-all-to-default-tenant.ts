#!/usr/bin/env tsx
/**
 * Script de Migração Completo para Tenant 'Default'
 * 
 * Este script consolida TODOS os dados existentes em um único tenant 'default'
 * com ID = 1, incluindo registros com tenantId NULL.
 * 
 * Validação:
 * - Antes: Conta total de registros por tabela
 * - Depois: Verifica se todos os registros estão no tenant "default"
 * - Garante: Nenhum registro fica para trás
 * 
 * Executar com: npx tsx migrate-all-to-default-tenant.ts
 */

import { getDb } from './server/db';
import { 
  users, products, customers, sales, 
  supplierOrders, catalogOrders, auditLog, suppliers 
} from './drizzle/schema';
import { eq, isNull, or } from 'drizzle-orm';

const DEFAULT_TENANT_ID = 1;

interface TableInfo {
  table: any;
  name: string;
  field: any;
}

async function migrateAllToDefaultTenant() {
  try {
    console.log('🚀 Iniciando migração COMPLETA para tenant "default"...\n');

    const db = await getDb();

    // Tabelas com tenantId
    const tablesToMigrate: TableInfo[] = [
      { table: users, name: 'usuários', field: users.tenantId },
      { table: products, name: 'produtos', field: products.tenantId },
      { table: customers, name: 'clientes', field: customers.tenantId },
      { table: sales, name: 'vendas', field: sales.tenantId },
      { table: supplierOrders, name: 'pedidos ao fornecedor', field: supplierOrders.tenantId },
      { table: catalogOrders, name: 'pedidos do catálogo', field: catalogOrders.tenantId },
      { table: auditLog, name: 'log de auditoria', field: auditLog.tenantId },
      { table: suppliers, name: 'fornecedores', field: suppliers.tenantId },
    ];

    console.log('📊 VALIDAÇÃO ANTES DA MIGRAÇÃO:\n');
    const beforeStats: Record<string, { total: number; inDefault: number; needsMigration: number }> = {};

    for (const { table, name, field } of tablesToMigrate) {
      try {
        // Contar total de registros
        const allRecords = await db.select().from(table);
        const total = allRecords.length;

        // Contar registros no tenant default
        const inDefault = await db.select().from(table).where(eq(field, DEFAULT_TENANT_ID));
        const inDefaultCount = inDefault.length;

        // Contar registros que precisam migração (NULL ou != 1)
        const needsMigration = await db
          .select()
          .from(table)
          .where(or(isNull(field), eq(field, DEFAULT_TENANT_ID) ? undefined : true));
        const needsMigrationCount = needsMigration.length - inDefaultCount;

        beforeStats[name] = {
          total,
          inDefault: inDefaultCount,
          needsMigration: Math.max(0, total - inDefaultCount),
        };

        console.log(`📋 ${name.padEnd(30)} | Total: ${total} | Default: ${inDefaultCount} | Precisa migrar: ${Math.max(0, total - inDefaultCount)}`);
      } catch (e: any) {
        console.log(`⚠️  ${name.padEnd(30)} | Erro ao contar registros`);
      }
    }

    console.log('\n🔄 EXECUTANDO MIGRAÇÃO:\n');

    for (const { table, name, field } of tablesToMigrate) {
      try {
        console.log(`📝 Migrando ${name}...`);

        // Migrar registros com tenantId NULL
        await db
          .update(table)
          .set({ tenantId: DEFAULT_TENANT_ID })
          .where(isNull(field));

        // Migrar registros com tenantId diferente de 1
        await db
          .update(table)
          .set({ tenantId: DEFAULT_TENANT_ID })
          .where(eq(field, DEFAULT_TENANT_ID) ? undefined : true);

        // Contar quantos foram migrados
        const afterMigration = await db.select().from(table).where(eq(field, DEFAULT_TENANT_ID));
        console.log(`✅ ${name}: ${afterMigration.length} registros no tenant "default"\n`);
      } catch (e: any) {
        console.log(`⚠️  ${name}: Erro durante migração (pode ser normal se tabela não existe)\n`);
      }
    }

    console.log('\n🔍 VALIDAÇÃO APÓS MIGRAÇÃO:\n');

    let allSuccess = true;
    for (const { table, name, field } of tablesToMigrate) {
      try {
        // Contar total de registros
        const allRecords = await db.select().from(table);
        const total = allRecords.length;

        // Contar registros no tenant default
        const inDefault = await db.select().from(table).where(eq(field, DEFAULT_TENANT_ID));
        const inDefaultCount = inDefault.length;

        // Verificar se todos estão no tenant default
        const allInDefault = total === inDefaultCount;
        const status = allInDefault ? '✅' : '⚠️ ';

        console.log(`${status} ${name.padEnd(30)} | Total: ${total} | Default: ${inDefaultCount} | Status: ${allInDefault ? 'OK' : 'INCOMPLETO'}`);

        if (!allInDefault) {
          allSuccess = false;
          // Listar registros que não estão no tenant default
          const notInDefault = await db
            .select()
            .from(table)
            .where(eq(field, DEFAULT_TENANT_ID) ? undefined : true);
          console.log(`   ⚠️  ${notInDefault.length} registros ainda fora do tenant "default"`);
        }
      } catch (e: any) {
        console.log(`⚠️  ${name.padEnd(30)} | Erro ao validar`);
      }
    }

    console.log('\n' + '='.repeat(80));
    if (allSuccess) {
      console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('Todos os dados foram consolidados no tenant "default" (ID=1)');
    } else {
      console.log('⚠️  MIGRAÇÃO PARCIALMENTE CONCLUÍDA');
      console.log('Alguns registros ainda precisam ser verificados manualmente');
    }
    console.log('='.repeat(80) + '\n');

    process.exit(allSuccess ? 0 : 1);
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

migrateAllToDefaultTenant();
