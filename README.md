# 🦷 Bertuol Odontologia Avançada — Versão 1.4.0

> **Plataforma Web Multi-Tenant de Gestão de Clínicas Odontológicas, Central de Credenciais de Clientes (6.285+ Pacientes), CRM de Reativação & WhatsApp, Agenda Diária Inteligente com IA Gemini, PWA do Paciente e Totem de Recepção com Gamificação.**

[![Versão](https://img.shields.io/badge/vers%C3%A3o-v1.4.0-FF981A.svg?style=for-the-badge)](https://github.com/FlavioSantTI/bertuol-flow)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB_Bertuol-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Gemini AI](https://img.shields.io/badge/Google_AI_Studio-Gemini_Flash-8E75FF.svg?style=for-the-badge&logo=google)](https://ai.google.dev)

---

## 🔗 Rotas Oficiais de Produção (`bertuolflow.app-bertuol.tech`)

As rotas principais da aplicação estão homologadas e mapeadas no domínio oficial:

| Rota / Perfil | URL de Acesso Direto | Descrição & Recursos |
| :--- | :--- | :--- |
| **🩺 App do Profissional (Dentistas)** | [`https://bertuolflow.app-bertuol.tech/`](https://bertuolflow.app-bertuol.tech/) | Agenda cronológica diária, Resumos de prontuários com IA Gemini Flash, Biometria WebAuthn e Alertas do Totem. |
| **🏢 Gestão & Recepção (CRM, Atendentes, Gerentes & Admin)** | [`https://bertuolflow.app-bertuol.tech/`](https://bertuolflow.app-bertuol.tech/) | Central de Credenciais de Clientes (`6.285+`), CRM de Recall 6+ meses, Recepção, Totem QR Code, Resgate de Vouchers e Gestão de Usuários. |
| **👑 SuperAdmin Root & Simulador de Perfis** | [`https://bertuolflow.app-bertuol.tech/?role=admin_root`](https://bertuolflow.app-bertuol.tech/?role=admin_root) | Controle irrestrito Multi-Clínicas (Palmas & Paraíso) com barra de simulação instantânea de perfis. |
| **📱 Portal & PWA do Paciente (Clube Sorriso)** | [`https://bertuolflow.app-bertuol.tech/paciente.html`](https://bertuolflow.app-bertuol.tech/paciente.html) *(ou `?app=paciente`)* | PWA instalável com suporte offline, Scanner QR Code de Check-in no Totem, Tutorial Interativo e Extrato de Pontos. |

---

## 🌟 Visão Geral da Jornada & Versão 1.4.0

O **Bertuol Flow** evoluiu na **Versão 1.4.0** para entregar a gestão completa de credenciais e acessos da base real de pacientes (**6.285+ clientes importados** do Clinicorp para o Supabase), além de busca instantânea otimizada para o balcão de atendimento.

### 🏆 Novidades e Funcionalidades Principais da v1.4.0

#### 1. 🔐 Central de Credenciais & Acessos de Clientes (`Clube Sorriso PWA`)
- **Carregamento Completo em Lotes (`6.285+ Clientes`)**: Sincronização paginada via `.range()` na tabela `public.patients` do Supabase, superando o limite padrão de 1.000 registros do PostgREST e trazendo toda a base das unidades **Palmas - TO** e **Paraíso do Tocantins - TO**.
- **Busca Inteligente por Nome & Sobrenome no Topo**: Campo de busca em destaque no topo do modal com normalização automática de acentos (`João` = `joao`), busca multi-palavras fora de sequência (`Maria Silva` encontra `MARIA APARECIDA DA SILVA`), filtro alfabético (`A–Z`) e consulta direta em tempo real no Supabase (`ilike`).
- **Disparo de Links de Ativação & Renovação de Senha**:
  - Envio de link de primeiro acesso com token de 48h e senha provisória via **WhatsApp Web**, **API Direta (Evolution GO)** ou **SMS Nativo**.
  - Modal de **Renovação de Senha de Balcão** e alternância de status (`Ativo no App`, `Pendente de Ativação`, `Bloqueado`) com 1 clique.
- **Permissão RBAC Dedicada (`canManageClientAccounts`)**: Permite que o perfil **Recepção / Atendente (`receptionist`)** gerencie cadastros, senhas e acessos de clientes/pacientes sem expor as abas administrativas de usuários internos ou cargos.

#### 2. 🛡️ Homologação & Validação das Rotas Principais (RBAC)
- **Matriz de Proteção de Rotas (`ProtectedRoute.tsx` & `COMPONENT_ACCESS_MAP`)**: Isolamento por contexto (`clinic`, `patient`, `root`) garantindo conformidade LGPD e segurança de acesso.
- **Auditoria 100% OK**: Validação automatizada de permissões para Dentistas, Recepcionistas, Gerentes, Admins e Pacientes.

#### 3. 🎯 Módulo CRM (Recall Preventivo & Funil de WhatsApp)
- **Varredura Inteligente de Recalls (6+ Meses)**: Varredura automática de pacientes sem consulta há mais de 6 meses para reativação preventiva.
- **Pipeline Kanban & Tabela de Oportunidades**: Organização visual por estágios (`Novos Leads`, `Em Contato`, `Agendado`, `Convertido`, `Perdido`).
- **Templates de Mensagem com 1 Clique**: Disparo rápido para WhatsApp com variáveis dinâmicas e oferta de bônus de pontos do Clube Sorriso.

#### 4. 🏢 Gestão Multi-Clínicas (Multi-Tenant)
- **Unidades Mapeadas no Supabase (`public.clinics`)**:
  - **Unidade Palmas - TO**: `d176a1c3-9955-4555-87d9-1da0bacb61a5` (`external_id`: `5053762760081408`)
  - **Unidade Paraíso do Tocantins - TO**: `5d30567b-ecfc-49a7-903d-f994c6de50f1` (`external_id`: `5053762760081409`)

---

## 🏗️ Arquitetura de Software & Tecnologias

```
├── client (Vite + React 19 + TypeScript + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/       # Componentes Modulares (ClientAccountsTab, UserManagementModal, Header, etc.)
│   │   ├── config/           # Rótulos centralizados de versão (version.ts -> v1.4.0)
│   │   ├── contexts/         # Contexto de Tenant e Filtro de Clínicas (TenantContext)
│   │   ├── patient/          # PWA do Paciente e Clube Sorriso Bertuol
│   │   ├── routes/           # Rotas e Guards (RootLayout, ClinicLayout, ProtectedRoute)
│   │   ├── services/         # DataService, SupabaseService, WebAuthn, Messaging
│   │   ├── types/            # Tipagem TypeScript (database.ts, Clinic, UserRole, UserPermissions)
│   │   └── utils/            # Scripts SQL, Formatadores e Auxiliares
├── server (Node.js Express + TSX Proxy Server)
│   └── server.ts             # API endpoints (/api/clinics, /api/login, /api/webhooks, Gemini Proxy)
```

---

## 🗄️ Esquema do Banco de Dados (Supabase / PostgreSQL)

```sql
-- 1. TABELA DE CLÍNICAS / UNIDADES (MULTI-TENANT)
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(100),                          -- ID Clinicorp (ex: 5053762760081408)
    name VARCHAR(255) NOT NULL,                         -- Nome oficial da unidade
    short_name VARCHAR(100) NOT NULL,                   -- Nome curto para agendas
    slug VARCHAR(100) UNIQUE NOT NULL,                  -- Slug do webhook
    unidade VARCHAR(100) NOT NULL,                      -- Ex: "Palmas - TO"
    owner_email VARCHAR(150),                           -- E-mail do responsável
    phone VARCHAR(50),
    whatsapp_number VARCHAR(50),
    whatsapp_instance_key VARCHAR(100),
    color_tag VARCHAR(20) DEFAULT '#FF981A',
    active BOOLEAN DEFAULT true,
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    google_maps_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. COLUNAS DE CREDENCIAIS E ACESSO AO APP NA TABELA DE PACIENTES (v1.4.0)
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS app_access_status VARCHAR(40) DEFAULT 'pending_activation',
  ADD COLUMN IF NOT EXISTS activation_token VARCHAR(100),
  ADD COLUMN IF NOT EXISTS activation_token_expires_at TIMESTAMPTZ;
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* Node.js v18+ ou v20+
* npm ou yarn

### 1. Clonar o Repositório
```bash
git clone https://github.com/FlavioSantTI/bertuol-flow.git
cd bertuol-flow
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente (`.env`)
Crie um arquivo `.env` na raiz do projeto:
```env
PORT=3000
GEMINI_API_KEY=sua_chave_gemini_aqui
SUPABASE_URL=https://sswbkfrpxboxmjvunhzt.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_supabase
```

### 4. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
O servidor de desenvolvimento iniciará em `http://localhost:3000`.

---

## 📜 Licença e Propriedade

Desenvolvido para **Bertuol Odontologia Avançada**. Direitos reservados.
- **Versão**: `v1.4.0`
- **Gestão**: Flávio Santiago & Favuca Dias
