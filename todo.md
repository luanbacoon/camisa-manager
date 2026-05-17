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
