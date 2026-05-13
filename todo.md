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
