# 👕 Camisa Manager

Sistema completo de gerenciamento para loja de camisas com painel de controle, vendas, clientes, produtos, estoque, pedidos ao fornecedor, simulador de pedidos e catálogo público.

## Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, tRPC
- **Backend:** Node.js, Express, tRPC
- **Banco de dados:** MySQL com Drizzle ORM
- **Armazenamento de imagens:** AWS S3
- **Auth:** OAuth via cookie de sessão JWT

## Funcionalidades

- 📊 **Dashboard** — métricas de faturamento, lucro, ticket médio e gráficos por período
- 🛒 **Vendas** — registro de vendas com múltiplos itens, desconto, status e forma de pagamento
- 👥 **Clientes** — cadastro, histórico de compras e valor total gasto
- 👕 **Produtos** — cadastro com tamanhos, galeria de fotos, custo e preço
- 📦 **Estoque** — visualização em tempo real, ajuste manual com histórico
- 🚚 **Pedidos ao Fornecedor** — controle de pedidos com rastreio dos Correios
- 🧮 **Simulador** — cálculo de novo custo médio ao fazer pedido
- 🌐 **Catálogo Público** — página sem login para clientes realizarem pedidos via WhatsApp
- ⚙️ **Configurações** — personalização da loja (logo, cores, banner, redes sociais)

---

## Pré-requisitos

- Node.js 20+
- pnpm 10+
- MySQL 8+
- Conta AWS (para upload de imagens via S3)

---

## Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/luanbacoon/camisa-manager.git
cd camisa-manager
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais (veja a seção [Variáveis de Ambiente](#variáveis-de-ambiente) abaixo).

### 4. Configure o banco de dados

Crie o banco no MySQL:

```sql
CREATE DATABASE camisa_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Execute as migrations:

```bash
pnpm db:push
```

### 5. Inicie em modo desenvolvimento

```bash
pnpm dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

---

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `DATABASE_URL` | URL de conexão MySQL | ✅ |
| `JWT_SECRET` | Segredo para assinar tokens de sessão | ✅ |
| `VITE_APP_ID` | ID da aplicação OAuth | ✅ |
| `OAUTH_SERVER_URL` | URL do servidor OAuth | ✅ |
| `OWNER_OPEN_ID` | OpenID do dono da loja | ✅ |
| `VITE_OAUTH_PORTAL_URL` | URL do portal OAuth (frontend) | ✅ |
| `AWS_REGION` | Região AWS para o S3 | Para imagens |
| `AWS_ACCESS_KEY_ID` | Access key da AWS | Para imagens |
| `AWS_SECRET_ACCESS_KEY` | Secret key da AWS | Para imagens |
| `AWS_S3_BUCKET` | Nome do bucket S3 | Para imagens |
| `PORT` | Porta do servidor (padrão: 3000) | ❌ |

---

## Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Inicia o servidor em modo desenvolvimento com hot-reload |
| `pnpm build` | Gera o build de produção |
| `pnpm start` | Inicia o servidor em modo produção |
| `pnpm test` | Executa os testes unitários |
| `pnpm db:push` | Gera e aplica as migrations do banco |
| `pnpm check` | Verifica erros de TypeScript |
| `pnpm lint` | Verifica qualidade de código com ESLint |
| `pnpm lint:fix` | Corrige automaticamente problemas de lint |
| `pnpm format` | Formata o código com Prettier |

---

## CI/CD

O repositório inclui um workflow do GitHub Actions (`.github/workflows/ci.yml`) que executa automaticamente a cada push ou pull request:

1. Verificação de tipos TypeScript (`pnpm check`)
2. Testes unitários (`pnpm test`)
3. Build de produção (`pnpm build`)

---

## Estrutura do Projeto

```
camisa-manager/
├── client/                  # Frontend React
│   └── src/
│       ├── _core/           # Auth hooks e utilitários internos
│       ├── components/      # Componentes reutilizáveis e shadcn/ui
│       ├── pages/           # Páginas da aplicação
│       ├── lib/             # Configuração do tRPC
│       └── contexts/        # Context providers (tema, etc.)
├── server/                  # Backend Express + tRPC
│   ├── _core/               # Auth, OAuth, contexto tRPC, env
│   ├── db.ts                # Funções de acesso ao banco
│   ├── routers.ts           # Definição dos endpoints tRPC
│   └── storage.ts           # Integração com AWS S3
├── drizzle/                 # Schema e migrations do banco
│   └── schema.ts
├── shared/                  # Tipos e constantes compartilhados
└── .github/workflows/       # CI/CD com GitHub Actions
```

---

## Deploy em Produção

```bash
# Build
pnpm build

# Iniciar
NODE_ENV=production pnpm start
```

Certifique-se de que todas as variáveis de ambiente estão configuradas no ambiente de produção.

---

## Testes

```bash
pnpm test
```

Os testes cobrem os principais routers tRPC (auth, produtos, vendas, estoque, etc.).

---

## Catálogo Público

O catálogo público fica disponível em `/catalogo` e não requer autenticação. Clientes podem visualizar produtos e enviar pedidos diretamente via WhatsApp.

Para configurar o catálogo, acesse **Configurações** no painel admin e personalize nome, logo, banner, cores e quais produtos aparecem.
