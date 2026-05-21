# CamisaManager - TODO

## Banco de Dados / Schema
- [x] Tabela: products (id, name, team, description, imageUrl, cost, price, avgCost, active, createdAt)
- [x] Tabela: product_sizes (id, productId, size, stock)
- [x] Tabela: customers (id, name, phone, email, address, isDefault, totalSpent, lastPurchaseAt, createdAt)
- [x] Tabela: sales (id, customerId, paymentMethod, total, profit, notes, createdAt)
- [x] Tabela: sale_items (id, saleId, productId, size, quantity, unitPrice, unitCost)
- [x] Tabela: supplier_orders (id, productId, size, quantity, unitCost, totalCost, status, trackingCode, notes, orderedAt, receivedAt, createdAt)
- [x] Tabela: stock_adjustments (id, productId, size, quantity, reason, createdAt, userId)
- [x] Tabela: store_settings (id, storeName, ownerName, phone, email, address, logoUrl, updatedAt)
- [x] Tabela: catalog_orders (id, customerName, customerPhone, items JSON, notes, status, createdAt)

## Backend (tRPC Routers)
- [x] Router: products (list, get, create, update, delete, uploadImage)
- [x] Router: customers (list, get, create, update, delete, getHistory)
- [x] Router: sales (list, get, create, getMetrics, getChartData)
- [x] Router: stock (list, adjust, getByProduct, history)
- [x] Router: supplierOrders (list, get, create, update, markReceived, trackPackage)
- [x] Router: simulator (calculate)
- [x] Router: settings (get, update)
- [x] Router: catalog (products, settings, submitOrder, orders, orderDetail, updateOrderStatus)
- [x] Router: dashboard (metrics, chartData)

## Frontend - Layout e Design
- [x] Design system: cores elegantes (dark navy + gold accent), tipografia refinada
- [x] DashboardLayout com sidebar elegante e navegação completa
- [x] Componentes reutilizáveis: MetricCard, DataTable, StatusBadge, etc.

## Frontend - Dashboard
- [x] Cards de métricas: valor vendido, lucro, ticket médio, clientes ativos, margem
- [x] Gráfico de faturamento (recharts)
- [x] Filtros por semana, mês, período personalizado

## Frontend - Vendas
- [x] Lista de vendas com filtros e busca
- [x] Modal/formulário de nova venda
- [x] Seleção de cliente (com opção "Consumidor Final")
- [x] Adição de produtos com tamanho e quantidade
- [x] Seleção de forma de pagamento
- [x] Atualização automática do estoque ao confirmar

## Frontend - Clientes
- [x] Lista de clientes com busca
- [x] Cadastro/edição de clientes
- [x] Histórico de compras por cliente
- [x] Valor total gasto e data da última compra
- [x] Cliente padrão "Consumidor Final" pré-cadastrado

## Frontend - Produtos
- [x] Lista de produtos com filtros
- [x] Cadastro/edição de produtos (time, tamanhos, custo, preço)
- [x] Upload de imagem do produto
- [x] Cálculo automático de custo médio

## Frontend - Estoque
- [x] Visualização em tempo real por produto e tamanho
- [x] Ajuste manual com justificativa obrigatória
- [x] Histórico de movimentações

## Frontend - Pedidos ao Fornecedor
- [x] Lista de pedidos com status
- [x] Cadastro de novo pedido
- [x] Campo de código de rastreio dos Correios
- [x] Integração com rastreio dos Correios (link direto)
- [x] Marcar como "Recebido" (atualiza estoque automaticamente)

## Frontend - Simulador de Pedidos
- [x] Formulário: produto, quantidade, custo unitário
- [x] Cálculo e exibição do novo custo médio estimado
- [x] Comparativo antes/depois

## Frontend - Catálogo Público
- [x] Página pública sem necessidade de login
- [x] Listagem de produtos com fotos
- [x] Filtro por time, tamanho, disponibilidade
- [x] Detalhes do produto (tamanhos, preço)
- [x] Formulário de pedido pelo catálogo
- [x] Pedidos do catálogo visíveis no painel admin

## Frontend - Configurações
- [x] Dados da loja (nome, telefone, email, endereço, instagram, whatsapp)
- [x] Informações da conta do usuário
- [x] Link do catálogo público com botão de copiar

## Testes
- [x] Testes unitários para routers principais (14 testes passando)
- [x] Validação de fluxo de venda e atualização de estoque


## Melhorias Solicitadas
- [x] Botão de envio de pedido para WhatsApp no catálogo público
- [x] Melhorar página de Vendas com métricas de período, busca, filtros e tabela completa
- [x] Melhorar modal de nova venda com grid de produtos, imagens, busca, data, desconto e status
- [x] Adicionar opção de criar novo cliente no modal de nova venda
- [x] Adicionar campo de status na venda com 8 opções (aguardando pagamento, pago, aguardando envio, em transito, finalizado, pago 50%, fazer pedido ao fornecedor, pedido feito ao fornecedor)
- [x] Melhorar modal de novo produto com upload de foto, preview, e campos adicionais (gênero, categoria, versão)
- [x] Adicionar suporte a múltiplas fotos por produto com galeria (frente, costas, detalhes)

## Bugs Reportados
- [x] Imagens não aparecem no catálogo e no módulo de produtos (corrigido: instalado multer e corrigida rota de upload)
- [x] Adicionar interface para upload de múltiplas imagens de galeria no modal de novo produto
- [x] Converter campos Gênero, Categoria e Versão para selects ao invés de inputs de texto
- [x] Adicionar aba de personalização nas Configurações (nome da loja, cores, logo, banner)
- [x] Adicionar seletor de produtos para o catálogo público nas Configurações
- [x] Mostrar todos os tamanhos no catálogo (mesmo sem estoque) para permitir encomendas
- [x] Implementar personalização funcional do catálogo (nome, cor, logo, banner) com upload e persistência
- [x] Implementar seletor real de produtos para o catálogo público nas Configurações
- [x] Aplicar personalizações no Catalog.tsx (logo, banner, cor primária, nome da loja)
- [x] Corrigir saveProductSelection para persistir showInCatalog para produtos desmarcados
- [x] Adicionar opção de excluir produtos cadastrados no módulo de Produtos
- [x] Implementar exclusão segura de produto: bloquear se tiver histórico relacionado ou usar soft delete
- [x] Remover tamanhos e galeria ao deletar produto
- [x] Redesenhar modal de novo pedido ao fornecedor com grid de produtos, formulário completo e carrinho
- [x] Persistir no backend os campos do novo pedido (fornecedor, tipo, moeda, data, desconto, frete)
- [x] Salvar pedido multi-itens de forma transacional (estrutura de pedido + itens)

## Ajustes de Layout - Pedidos ao Fornecedor
- [x] Ajustar grid modal para 8 colunas (4 produtos + 4 formulário)
- [x] Aumentar campos de dados do pedido para 3 colunas
- [x] Aumentar campos de adicionar item para 4 colunas
- [x] Manter estrutura original com layout mais horizontal

## Busca de Produtos
- [x] Campo de busca no painel esquerdo do modal de novo pedido para filtrar camisas por nome em tempo real

## Integração com Correios
- [x] Implementar link de rastreio clicável para Correios (https://www.correios.com.br/rastreamento)
- [x] Adicionar botão com ícone ExternalLink na tabela de pedidos para rastrear
- [x] Integrar API dos Correios para buscar status de entrega em tempo real
- [x] Exibir status de rastreamento na UI (modal de edição e tabela)

## Atualização Automática de Rastreamento
- [x] Criar job de atualização de rastreamento no backend
- [x] Configurar Heartbeat scheduler para executar a cada 30 minutos
- [x] Adicionar tabela para armazenar histórico de rastreamento
- [x] Implementar lógica de atualização apenas para pedidos pendentes/em trânsito

## Exclusão de Pedidos do Catálogo
- [x] Criar procedure tRPC para deletar pedido do catálogo
- [x] Adicionar botão de exclusão na UI com diálogo de confirmação
- [x] Testar funcionalidade de exclusão

## Notificações WhatsApp para Pedidos
- [x] Criar função de envio de mensagem WhatsApp no backend
- [x] Integrar notificação ao atualizar status de pedido do catálogo
- [x] Testar envio de notificações WhatsApp

## Personalização de Mensagens WhatsApp
- [x] Criar tabela de configurações de templates de mensagens
- [x] Implementar procedures tRPC para gerenciar templates
- [x] Criar página de configuração de mensagens
- [x] Integrar templates personalizados ao envio
- [x] Testar personalização de mensagens

## Histórico de Mensagens WhatsApp
- [x] Criar tabela de histórico de mensagens
- [x] Implementar funções de banco para gerenciar histórico
- [x] Criar procedures tRPC para consultar histórico
- [x] Integrar registro de mensagens ao envio
- [x] Criar página de visualização de histórico
- [x] Testar histórico de mensagens


## CRÍTICO - Sistema Multi-Loja (SaaS) - ABORDAGEM GRADUAL
- [x] Criar tabela de tenants com dados da loja
- [x] Criar tabela de user_tenants para associar usuários a lojas
- [x] Criar procedures tRPC para gerenciar tenants
- [x] Criar middleware de tenant-middleware.ts com funções auxiliares
- [x] Criar painel de admin para gerenciar tenants (UI) - AdminTenants.tsx integrado em /admin/tenants
- [x] Migrar dados existentes para tenant "default"
- [x] Adicionar tenantId à tabela de produtos
- [x] Adicionar tenantId às tabelas de customers, sales, supplier_orders, catalogOrders
- [x] Atualizar procedures para usar tenantId do contexto
- [x] Atualizar queries de listagem para filtrar por tenantId
- [x] Implementar subdomínios dinâmicos (tenant.camisamanager.com)
- [x] Implementar isolamento de dados em todas as queries

## CRÍTICO - Sistema de Permissões e Roles
- [x] Criar tabela de roles (admin, gerente, vendedor, visualizador)
- [x] Criar tabela de permissões por role
- [x] Implementar middleware de autorização
- [x] Adicionar verificação de permissões em todas as procedures tRPC (permissionProcedure criado)
- [x] Criar tabela de auditoria de ações (helpers de auditoria implementados)
- [x] Implementar logs de acesso e tentativas de login (logAuditAction implementado)

## CRÍTICO - Integração com Stripe
- [ ] Configurar conta Stripe
- [ ] Criar tabela de subscriptions
- [ ] Implementar webhook do Stripe
- [ ] Criar fluxo de checkout
- [ ] Implementar cancelamento e downgrade de planos
- [ ] Criar histórico de faturas

## CRÍTICO - Segurança (2FA, Criptografia)
- [x] Implementar autenticação 2FA (TOTP)
- [x] Criptografar dados sensíveis (telefone, email)
- [x] Implementar rate limiting em APIs (express-rate-limit)
- [x] Validar entrada em todas as APIs
- [x] Implementar CORS corretamente
- [x] Adicionar testes de segurança

## CRÍTICO - Backup e Disaster Recovery
- [x] Configurar backup automático diário
- [x] Implementar backup em múltiplas regiões
- [x] Criar plano de recuperação de desastres
- [x] Testar restore de backup
- [x] Documentar procedimento de recuperação


## CRÍTICO - Segurança
- [x] Implementar autenticação 2FA com TOTP (Google Authenticator)
- [x] Implementar rate limiting para proteção contra brute force
- [x] Implementar criptografia de dados sensíveis
- [x] Implementar auditoria de segurança (audit log)
- [x] Criar UI para gerenciar 2FA (ativar/desativar, backup codes)
- [x] Testar segurança


## CRÍTICO - Backup e Disaster Recovery
- [x] Criar sistema de backup automático do banco de dados
- [x] Implementar armazenamento de backups em S3
- [x] Criar procedures tRPC para gerenciar backups
- [x] Criar UI para visualizar e restaurar backups
- [x] Testar backup e restore


## Implementação Completa de 2FA
- [x] Criar módulos helpers de 2FA (gerar secret, verificar token, ativar/desativar)
- [x] Integrar 2FA ao fluxo de autenticação no backend
- [x] Criar UI de login com verificação de 2FA
- [x] Criar página de gerenciamento de 2FA (ativar/desativar, backup codes)
- [x] Implementar rate limiting para login
- [x] Testar fluxo completo de 2FA


## Autenticação Local por Cliente
- [x] Criar tabelas de usuários locais (email, senha hash, tenant)
- [x] Implementar procedures tRPC para login/registro/reset de senha
- [x] Criar UI de login customizada (sem Manus OAuth)
- [x] Criar painel de admin para gerenciar usuários e clientes
- [x] Testar autenticação local
- [x] Integrar autenticação local ao contexto tRPC
- [x] Adicionar testes de hashing de senha

## Funcionalidades Adicionais
- [x] Botão para apagar histórico do WhatsApp
- [x] Invalidar/refetch de queries após limpar histórico
- [x] Adicionar feedback de sucesso/erro para limpeza
- [x] Testar fluxo completo de exclusão


## BUG - Criação de Usuários
- [x] Investigar e corrigir erro ao criar usuários


## Relatórios Avançados (PDF/Excel)
- [x] Criar helpers para gerar dados de relatórios (vendas, estoque)
- [x] Criar procedures tRPC para gerar relatórios
- [x] Criar UI de relatórios com filtros
- [x] Criar helpers de exportação para PDF (docx) e Excel (xlsx)
- [x] Integrar exportação com procedures tRPC
- [x] Adicionar botões de download na UI de relatórios
- [x] Testar geração e download de relatórios (72 testes passando)


## Gerenciamento de Fornecedores
- [x] Criar tabela de fornecedores com contatos
- [x] Criar procedures tRPC para CRUD de fornecedores
- [x] Criar UI de gerenciamento de fornecedores
- [x] Integrar fornecedores com pedidos ao fornecedor (requer migração de schema para adicionar supplierId)
- [x] Testar gerenciamento de fornecedores


## Bug - Catálogo com Produtos de Teste
- [x] Remover 4 produtos de teste (Test Camisa...) do banco de dados
- [x] Deletar dependências (tamanhos, pedidos, vendas, ajustes)
- [x] Validar que catálogo mostra apenas produtos reais

## Bug - Camisa Brasil Amarela Não Aparecia em Produtos
- [x] Investigar por que camisa Brasil Amarela estava apenas no catálogo
- [x] Identificar problema de isolamento de tenant (user associado a tenantId 1 que não existia)
- [x] Corrigir associação de user para tenantId 30001 correto
- [x] Validar que camisa agora aparece em Produtos após login novamente

## RBAC (Role-Based Access Control)
- [x] Criar tabelas de roles e permissões no schema
- [x] Implementar helpers de RBAC (hasPermission, hasAnyPermission, hasAllPermissions)
- [x] Criar procedures tRPC para gerenciar roles e permissões
- [x] Integrar RBAC router ao appRouter
- [x] Criar 4 roles padrão (admin, gerente, vendedor, visualizador)
- [x] Definir permissões por módulo (produtos, vendas, clientes, etc)

## Criptografia de Dados Sensíveis
- [x] Criar helpers de criptografia (AES-256-GCM)
- [x] Implementar funções de hash de senha (bcrypt)
- [x] Criar funções de máscara de dados (telefone, email, CPF, CNPJ)
- [x] Integrar criptografia com dados de clientes e fornecedores
- [x] Aplicar criptografia em procedures tRPC (createCustomer, updateCustomer, getCustomer)
- [x] Testar criptografia end-to-end (26 testes passando, descriptografia em getCustomer)

## Validação de Entrada e CORS
- [x] Criar schemas de validação com Zod
- [x] Implementar sanitização de entrada
- [x] Configurar CORS seguro
- [x] Adicionar headers de segurança
- [x] Implementar rate limiting
- [x] Detectar atividades suspeitas
- [x] Testar validação em procedures tRPC (39 testes de segurança)

## Admin de Tenants
- [x] Criar procedures tRPC para gerenciar tenants
- [x] Implementar listagem de tenants (admin only)
- [x] Implementar criação de novo tenant
- [x] Implementar atualização de tenant
- [x] Implementar deleção de tenant
- [x] Implementar gerenciamento de usuários por tenant
- [x] Integrar admin-tenants router ao appRouter
- [x] Criar UI de admin para gerenciar tenants

## Testes de Segurança
- [x] Criar testes de validação de entrada (email, telefone, CPF, CNPJ)
- [x] Criar testes de criptografia (encrypt/decrypt)
- [x] Criar testes de máscara de dados
- [x] Testar prevenção de XSS
- [x] Testar prevenção de SQL Injection
- [x] 39 testes de segurança passando
- [x] Criar testes de RBAC com assertions assincronas
- [x] Criar testes de isolamento de tenant (11 testes passando)

## Fase 1 - Correção Isolamento Multi-Tenant (db.ts)
- [x] Corrigir listCustomers() com tenantId
- [x] Corrigir listSales() com tenantId
- [x] Corrigir listSupplierOrders() com tenantId
- [x] Corrigir listCatalogOrders() com tenantId
- [x] Corrigir getDashboardMetrics() com tenantId
- [x] Corrigir getChartData() com tenantId
- [x] Corrigir listStockWithProducts() com tenantId
- [x] Corrigir getCustomer() com tenantId
- [x] Corrigir getSaleWithItems() com tenantId
- [x] Corrigir getCustomerSales() com tenantId
- [x] Atualizar routers para passar tenantId em listagens
- [x] Atualizar routers para passar tenantId em gets
- [x] Remover fallbacks || 1 perigosos (5 de 6 removidos)
- [x] Implementar testes de isolamento multi-tenant (8 testes)


## Portal SaaS para Clientes
- [x] Criar página de Sign Up com email/senha
- [x] Criar página de Login com email/senha
- [x] Implementar autenticação por email (sem Manus OAuth)
- [x] Criar sistema de tenants automático (um tenant por cliente)
- [x] Criar dashboard simplificado para cliente
- [x] Adaptar todas as funcionalidades para modo cliente (isolamento de dados)
- [x] Criar página de boas-vindas/onboarding
- [x] Implementar recuperação de senha
- [x] Criar interface de gerenciamento de conta do cliente
- [x] Testar fluxo completo de Sign Up → Login → Dashboard

## Portal SaaS para Clientes - Proximos Passos (COMPLETO)
- [x] Recuperacao de senha por email
- [x] Pagina de onboarding e boas-vindas
- [x] Interface de gerenciamento de conta do cliente
- [x] Integracao com WhatsApp (templates e historico)
- [x] Catalogo online para cliente


## Painel de Admin para Gerenciar Clientes
- [x] Criar tabela de convites com tokens
- [x] Implementar sistema de envio de emails com convites
- [x] Criar pagina de aceitar convite
- [x] Criar painel de admin para listar clientes
- [x] Adicionar opcoes de ativar/desativar clientes
- [x] Adicionar opcoes de resetar senha
- [x] Adicionar opcoes de deletar clientes
- [x] Testar fluxo completo de convites
