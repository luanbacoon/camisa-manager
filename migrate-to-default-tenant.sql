-- ============================================================================
-- MIGRAÇÃO DE DADOS PARA TENANT 'DEFAULT' (ID = 1)
-- ============================================================================
-- Este script consolida todos os dados existentes em um único tenant 'default'
-- com ID = 1 para organizar a estrutura multi-tenant do sistema.
--
-- Passos:
-- 1. Criar tenant 'default' com ID = 1
-- 2. Migrar todos os usuários para o tenant 'default'
-- 3. Migrar todos os produtos e dados relacionados
-- 4. Migrar clientes, vendas e dados relacionados
-- 5. Migrar pedidos ao fornecedor
-- 6. Migrar pedidos do catálogo
-- 7. Validar integridade dos dados
-- ============================================================================

-- PASSO 1: Criar tenant 'default' se não existir
-- Se já existir um tenant com ID 1, ele será atualizado
INSERT INTO tenants (id, name, email, phone, createdAt, updatedAt) 
VALUES (1, 'Default Store', 'admin@default.local', '+55 11 0000-0000', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  name = 'Default Store',
  email = 'admin@default.local',
  phone = '+55 11 0000-0000',
  updatedAt = NOW();

-- PASSO 2: Atualizar todos os usuários para tenantId = 1
UPDATE users SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 3: Atualizar todos os produtos para tenantId = 1
UPDATE products SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 4: Atualizar todos os tamanhos de produtos para tenantId = 1
-- (Nota: productSizes não tem tenantId direto, mas está vinculado via productId)

-- PASSO 5: Atualizar todos os clientes para tenantId = 1
UPDATE customers SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 6: Atualizar todas as vendas para tenantId = 1
UPDATE sales SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 7: Atualizar todos os itens de venda para tenantId = 1
UPDATE saleItems SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 8: Atualizar todos os pedidos ao fornecedor para tenantId = 1
UPDATE supplierOrders SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 9: Atualizar todos os itens de pedido ao fornecedor para tenantId = 1
UPDATE supplierOrderItems SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 10: Atualizar todos os ajustes de estoque para tenantId = 1
UPDATE stockAdjustments SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 11: Atualizar todos os pedidos do catálogo para tenantId = 1
UPDATE catalogOrders SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 12: Atualizar todas as configurações da loja para tenantId = 1
UPDATE storeSettings SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 13: Atualizar histórico de rastreamento para tenantId = 1
UPDATE trackingHistory SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 14: Atualizar templates WhatsApp para tenantId = 1
UPDATE whatsappTemplates SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 15: Atualizar histórico WhatsApp para tenantId = 1
UPDATE whatsappHistory SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 16: Atualizar log de auditoria para tenantId = 1
UPDATE auditLog SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 17: Atualizar fornecedores para tenantId = 1
UPDATE suppliers SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- PASSO 18: Atualizar galeria de produtos para tenantId = 1
UPDATE productGallery SET tenantId = 1 WHERE tenantId IS NULL OR tenantId != 1;

-- ============================================================================
-- VALIDAÇÃO - Verificar integridade dos dados
-- ============================================================================

-- Verificar tenants
SELECT 'Tenants' as entity, COUNT(*) as count FROM tenants;

-- Verificar usuários por tenant
SELECT 'Users' as entity, tenantId, COUNT(*) as count FROM users GROUP BY tenantId;

-- Verificar produtos por tenant
SELECT 'Products' as entity, tenantId, COUNT(*) as count FROM products GROUP BY tenantId;

-- Verificar clientes por tenant
SELECT 'Customers' as entity, tenantId, COUNT(*) as count FROM customers GROUP BY tenantId;

-- Verificar vendas por tenant
SELECT 'Sales' as entity, tenantId, COUNT(*) as count FROM sales GROUP BY tenantId;

-- Verificar pedidos ao fornecedor por tenant
SELECT 'SupplierOrders' as entity, tenantId, COUNT(*) as count FROM supplierOrders GROUP BY tenantId;

-- Verificar pedidos do catálogo por tenant
SELECT 'CatalogOrders' as entity, tenantId, COUNT(*) as count FROM catalogOrders GROUP BY tenantId;

-- ============================================================================
-- LIMPEZA - Deletar tenants antigos (opcional, comentado por segurança)
-- ============================================================================
-- DELETE FROM tenants WHERE id IN (23, 24, 30001, 60001);
