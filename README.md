# IndustryOS – Plataforma de Gestão Industrial

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=white" alt="Python 3.14">
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0-FCA121?logo=sqlalchemy&logoColor=white" alt="SQLAlchemy">
</p>

Sistema integrado de gestão industrial completo com módulos de pedidos, financeiro, logística, CRM e gestão de produtos. Desenvolvido para otimizar operações em ambiente industrial com automação, análise de dados e interface moderna.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack Técnico](#stack-técnico)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Desenvolvimento](#desenvolvimento)
- [API Endpoints](#api-endpoints)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Configuração](#configuração)
- [Troubleshooting](#troubleshooting)
- [Contribuindo](#contribuindo)

---

## 🎯 Visão Geral

O **IndustryOS** é uma plataforma completa de gestão industrial que integra:

- **Gestão de Pedidos**: Acompanhamento completo do ciclo de vida de pedidos, desde a criação até a finalização
- **Controle Financeiro**: Cashflow, despesas fixas, contas a pagar e projeção de saldo
- **CRM de Clientes**: Cadastro completo com histórico de pedidos e reengajamento
- **Gestão de Produtos**: Controle de estoque, preços, movimentações e lixeira
- **Gestão de Transportadoras**: Cadastro de transportadoras com integração aos pedidos
- **Dashboard Analítico**: Visualização em tempo real de métricas e indicadores

---

## ✨ Funcionalidades

### 🏠 Dashboard
- Visão geral em tempo real de pedidos, receitas, despesas e clientes ativos
- Cards informativos com métricas importantes
- Gráficos de evolução mensal
- Últimos pedidos e alertas de vencimentos

### 📦 Gestão de Pedidos
- Acompanhamento completo do ciclo de vida do pedido
- Status: Em Produção, Em Separação, Faturado, Aguardando NF, Finalizado
- Integração com transportadoras cadastradas
- Histórico completo de cada pedido

### 💰 Módulo Financeiro
- **Cashflow**: Entradas e saídas com gráficos de evolução
- **Despesas Fixas**: Cadastro e monitoramento de despesas recorrentes
- **Contas a Pagar**: Gestão de vencimentos e pagamentos
- **Projeção de Saldo**: Previsão financeira baseada em dados reais
- **Fechamentos Mensais**: Consolidação de dados por mês

### 👥 Cadastro de Clientes (CRM)
- Cadastro completo com CNPJ, endereço, contatos
- Histórico de pedidos por cliente
- Módulo de reengajamento
- Filtros e ordenação avançada

### 🏭 Gestão de Produtos
- Cadastro com código, nome, categoria, preços
- Dimensões e especificações técnicas
- Controle de estoque
- **Lixeira**: Produtos deletados podem ser restaurados
- Filtros por categoria e matéria prima

### 🚚 Gestão de Transportadoras
- Cadastro completo com CNPJ, telefone, endereço
- Contato principal da transportadora
- Integração com modal de finalização de pedidos
- Status ativo/inativo

### 🔐 Autenticação e Segurança
- Sistema JWT com tokens de acesso e refresh
- Proteção de rotas privadas
- CORS configurado para desenvolvimento

### 🎨 Interface
- **Tema Dark/Light**: Alternância global de tema
- **Responsividade**: Adaptado para mobile, tablet e desktop
- **Componentes UI**: shadcn/ui com Radix UI
- **Máscaras de Input**: CNPJ, telefone, CEP, valores monetários

## 🛠️ Stack Técnico

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **React** | 19 | Framework UI com hooks e context API |
| **TypeScript** | 5.0 | Tipagem estática para JavaScript |
| **Vite** | 6.x | Build tool ultrarrápido |
| **Tailwind CSS** | 3.4 | Framework CSS utilitário |
| **shadcn/ui** | 2024 | Componentes React acessíveis |
| **Radix UI** | Latest | Primitivos de UI headless |
| **Recharts** | 2.x | Gráficos e visualizações |
| **React Hook Form** | 7.x | Gerenciamento de formulários |
| **Zod** | 3.x | Validação de schemas |
| **Sonner** | Latest | Notificações toast |
| **Lucide React** | Latest | Ícones modernos |
| **Vitest** | Latest | Testes unitários |
| **Playwright** | Latest | Testes E2E |

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **FastAPI** | 0.115 | Framework Python moderno e rápido |
| **Python** | 3.14 | Linguagem de programação |
| **SQLAlchemy** | 2.0 | ORM para banco de dados |
| **Pydantic** | 2.x | Validação de dados e schemas |
| **PyJWT** | 2.x | Tokens JWT para autenticação |
| **bcrypt** | 4.x | Hash de senhas |
| **SQLite** | 3.x | Banco de dados (desenvolvimento) |
| **PostgreSQL** | 15+ | Banco de dados (produção) |
| **Uvicorn** | Latest | Servidor ASGI |

## 📦 Instalação

### Pré-requisitos

- **Node.js** 18+ (recomendado: 20 LTS)
- **Python** 3.14+
- **Git**

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/industryos.git
cd industryos
```

### 2. Instalação do Frontend

```bash
# Instalar dependências (usando npm, yarn, pnpm ou bun)
npm install

# Ou com bun (recomendado - mais rápido)
bun install
```

### 3. Instalação do Backend

```bash
# Navegar para o diretório do backend
cd backend

# Criar ambiente virtual (recomendado)
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Voltar para a raiz
cd ..
```

---

## 🚀 Desenvolvimento

### Iniciar o Backend

```bash
cd backend

# Opção 1: Usando uvicorn diretamente
python -m uvicorn app.main:app --reload --port 8000

# Opção 2: Usando o módulo principal
python -m app.main

# O backend estará disponível em: http://localhost:8000
# Documentação automática: http://localhost:8000/docs
```

### Iniciar o Frontend

```bash
# Na raiz do projeto (em outro terminal)

# Desenvolvimento
npm run dev

# Ou com bun
bun run dev

# O frontend estará disponível em: http://localhost:5173
```

### Scripts úteis

```bash
# Build para produção
npm run build

# Preview da build
npm run preview

# Testes
npm run test
npm run test:e2e

# Linting
npm run lint

# Type checking
npm run type-check
```

### Gerenciamento do Banco de Dados

```bash
cd backend

# Recriar banco de dados (quando houver mudanças no schema)
python recreate_db_full.py

# Resetar dados (mantém estrutura)
python reset_db.py
```

### Docker (Opcional)

```bash
# Iniciar backend e frontend com Docker Compose
docker-compose up

# Parar serviços
docker-compose down
```

---

## 🏗️ Arquitetura

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│                   (React + TypeScript)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  React   │  │ Tailwind │  │ shadcn/  │  │  Vite    │   │
│  │  Router  │  │   CSS    │  │   ui     │  │   6.x    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                              │
│                      (FastAPI)                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  FastAPI │  │SQLAlchemy│  │ Pydantic │  │  JWT     │   │
│  │  Routers │  │   ORM    │  │ Schemas  │  │  Auth    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Banco de Dados                         │
│              (SQLite - Desenvolvimento)                     │
│                   (PostgreSQL - Produção)                   │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Frontend** faz requisições HTTP para o **Backend**
2. **Backend** valida dados com **Pydantic** e autentica com **JWT**
3. **SQLAlchemy ORM** mapeia objetos Python para tabelas SQL
4. **Banco SQLite/PostgreSQL** persiste os dados
5. Resposta JSON retorna ao **Frontend**

---

## 🔌 API Endpoints

### Autenticação
- `POST /api/v1/auth/register` - Registrar novo usuário
- `POST /api/v1/auth/login` - Login e obter token JWT
- `POST /api/v1/auth/refresh` - Renovar token JWT

### Estatísticas
- `GET /api/v1/statistics/orders` - Estatísticas de pedidos
- `GET /api/v1/statistics/customers` - Estatísticas de clientes
- `GET /api/v1/statistics/finance` - Estatísticas financeiras
- `GET /api/v1/statistics/products` - Estatísticas de produtos

### CRUD
- `GET /api/v1/customers` - Listar clientes
- `POST /api/v1/customers` - Criar cliente
- `PUT /api/v1/customers/{id}` - Atualizar cliente
- `DELETE /api/v1/customers/{id}` - Deletar cliente

- `GET /api/v1/orders` - Listar pedidos
- `POST /api/v1/orders` - Criar pedido
- `PUT /api/v1/orders/{id}` - Atualizar pedido
- `DELETE /api/v1/orders/{id}` - Deletar pedido

- `GET /api/v1/products` - Listar produtos
- `POST /api/v1/products` - Criar produto
- `PUT /api/v1/products/{id}` - Atualizar produto
- `DELETE /api/v1/products/{id}` - Deletar produto

### Financeiro
- `GET /api/v1/financeiro/entries` - Listar entradas financeiras
- `POST /api/v1/financeiro/entries` - Criar entrada financeira
- `PUT /api/v1/financeiro/entries/{id}` - Atualizar entrada financeira
- `DELETE /api/v1/financeiro/entries/{id}` - Deletar entrada financeira

### Transportadoras
- `GET /api/v1/carriers` - Listar transportadoras
- `GET /api/v1/carriers/{id}` - Obter transportadora por ID
- `POST /api/v1/carriers` - Criar transportadora
- `PUT /api/v1/carriers/{id}` - Atualizar transportadora
- `DELETE /api/v1/carriers/{id}` - Deletar transportadora
- `GET /api/v1/carriers/health` - Health check do módulo

### Health
- `GET /api/v1/health` - Verificar status do sistema

---

## 📁 Estrutura de Pastas

```
inteligent-data-hub-main/
├── backend/                      # Backend FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies.py   # Dependências FastAPI
│   │   │   ├── routers/          # Endpoints da API
│   │   │   │   ├── auth.py       # Autenticação
│   │   │   │   ├── carriers.py   # Transportadoras
│   │   │   │   ├── customers.py  # Clientes
│   │   │   │   ├── financeiro.py # Financeiro
│   │   │   │   ├── health.py     # Health check
│   │   │   │   ├── notifications.py
│   │   │   │   ├── orders.py       # Pedidos
│   │   │   │   ├── products.py     # Produtos
│   │   │   │   └── statistics.py   # Estatísticas
│   │   │   └── routes/           # Rotas alternativas
│   │   ├── core/
│   │   │   ├── config.py         # Configurações
│   │   │   ├── exceptions.py     # Exceções customizadas
│   │   │   └── security.py       # Segurança JWT
│   │   ├── db/
│   │   │   ├── database.py       # Configuração SQLAlchemy
│   │   │   └── industry_os.db    # Banco SQLite
│   │   ├── models/               # Models SQLAlchemy
│   │   │   ├── carrier.py        # Transportadora
│   │   │   ├── customer.py       # Cliente
│   │   │   ├── order.py          # Pedido
│   │   │   └── product.py        # Produto
│   │   ├── schemas/              # Schemas Pydantic
│   │   └── main.py               # Entry point FastAPI
│   ├── data/                     # Dados SQLite
│   ├── recreate_db.py            # Script recriação banco
│   ├── recreate_db_full.py       # Script recriação completa
│   └── requirements.txt          # Dependências Python
├── src/                          # Frontend React
│   ├── components/               # Componentes React
│   │   ├── ui/                   # Componentes shadcn/ui
│   │   ├── masked-input.tsx      # Inputs com máscara
│   │   └── *.tsx                 # Componentes específicos
│   ├── contexts/                 # Contexts React
│   │   ├── AuthContext.tsx       # Autenticação
│   │   └── TrashContext.tsx      # Lixeira
│   ├── hooks/                    # Hooks personalizados
│   ├── lib/                      # Utilitários
│   ├── pages/                    # Páginas
│   │   ├── CarriersPage.tsx      # Transportadoras
│   │   ├── CustomersPage.tsx     # Clientes
│   │   ├── Dashboard.tsx         # Dashboard
│   │   ├── FinancePage.tsx       # Financeiro
│   │   ├── OrdersPage.tsx        # Pedidos
│   │   └── ProductsPage.tsx      # Produtos
│   ├── services/
│   │   └── api.ts                # API client
│   ├── types/                    # Tipos TypeScript
│   ├── App.tsx                   # App principal
│   └── main.tsx                  # Entry point React
├── public/                       # Arquivos estáticos
├── package.json                  # Dependências Node
├── tsconfig.json                 # Config TypeScript
├── tailwind.config.ts            # Config Tailwind
└── vite.config.ts                # Config Vite
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
# Banco de dados
DATABASE_URL=sqlite:///./data/industryos.db

# Segurança (mude em produção!)
SECRET_KEY=your-secret-key-change-in-production

# CORS (desenvolvimento)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Configurações de email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha

# Ambiente
ENVIRONMENT=development
DEBUG=True
```

Crie um arquivo `.env` na raiz (frontend):

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=IndustryOS
VITE_APP_VERSION=1.0.0
```

---

## 🐛 Troubleshooting

### Erro: `no such column: carriers.phone`

**Causa**: O banco de dados foi criado antes das novas colunas serem adicionadas ao modelo.

**Solução**:
```bash
# 1. Pare o backend (Ctrl+C)

# 2. Delete o banco
cd backend
python recreate_db_full.py

# 3. Reinicie o backend
python -m uvicorn app.main:app --reload --port 8000
```

### Erro de CORS

**Causa**: O frontend não consegue se comunicar com o backend.

**Solução**:
1. Verifique se o backend está rodando na porta 8000
2. Verifique se o CORS está configurado no `main.py`
3. Reinicie o backend após alterações

### Erro: `ModuleNotFoundError`

**Causa**: Dependências Python não instaladas.

**Solução**:
```bash
cd backend
pip install -r requirements.txt
```

### Porta 8000 já em uso

**Solução**:
```bash
# Encontre o processo usando a porta 8000
# Windows:
netstat -ano | findstr :8000

# Linux/Mac:
lsof -i :8000

# Mate o processo ou use outra porta
python -m uvicorn app.main:app --reload --port 8001
```

---

## 🤝 Contribuindo

### Como contribuir

1. **Fork** o projeto
2. Crie uma **branch** para sua feature:
   ```bash
   git checkout -b feature/nova-feature
   ```
3. Faça as alterações e **commit**:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade"
   ```
4. **Push** para sua branch:
   ```bash
   git push origin feature/nova-feature
   ```
5. Abra um **Pull Request**

### Convenções de Commit

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação de código
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Tarefas de build/deploy

### Padrões de Código

- **Frontend**: ESLint + Prettier configurados
- **Backend**: PEP8, docstrings obrigatórias
- **Nomes**: camelCase (JS/TS), snake_case (Python)
- **Commits**: Mensagens em português, claras e concisas

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autores

- **IndustryOS Team** - *Desenvolvimento inicial* - [GitHub](https://github.com/seu-usuario)

---

<p align="center">
  Desenvolvido com ❤️ para a indústria brasileira
</p>

