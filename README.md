# 🦷 Bertuol Odontologia Avançada — Versão 1.3.3

> **Plataforma Web Multi-Tenant de Gestão de Clínicas Odontológicas, CRM de Reativação & WhatsApp, Agenda Diária Inteligente com IA Gemini, PWA do Paciente e Totem de Recepção com Gamificação.**

[![Versão](https://img.shields.io/badge/vers%C3%A3o-v1.3.3-FF981A.svg?style=for-the-badge)](https://github.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB_Bertuol-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Gemini AI](https://img.shields.io/badge/Google_AI_Studio-Gemini_Flash-8E75FF.svg?style=for-the-badge&logo=google)](https://ai.google.dev)

---

## 🔗 Rotas Oficiais de Produção (`bertuolflow.app-bertuol.tech`)

As três rotas principais da aplicação estão homologadas e mapeadas no domínio oficial:

| Rota / Perfil | URL de Acesso Direto | Descrição & Recursos |
| :--- | :--- | :--- |
| **🩺 App do Profissional (Dentistas)** | [`https://bertuolflow.app-bertuol.tech/`](https://bertuolflow.app-bertuol.tech/) | Agenda cronológica diária, Resumos de prontuários com IA Gemini Flash, Biometria WebAuthn e Alertas do Totem. |
| **🏢 Gestão & Recepção (CRM, Atendentes, Gerentes & Admin)** | [`https://bertuolflow.app-bertuol.tech/`](https://bertuolflow.app-bertuol.tech/) | CRM de Recall 6+ meses e Leads do WhatsApp, Recepção, Totem QR Code, Resgate de Vouchers e Gestão de Usuários. |
| **👑 SuperAdmin Root & Simulador de Perfis** | [`https://bertuolflow.app-bertuol.tech/?role=admin_root`](https://bertuolflow.app-bertuol.tech/?role=admin_root) | Controle irrestrito Multi-Clínicas (Palmas & Paraíso) com barra de simulação instantânea de perfis. |
| **📱 Portal & PWA do Paciente (Clube Sorriso)** | [`https://bertuolflow.app-bertuol.tech/paciente.html`](https://bertuolflow.app-bertuol.tech/paciente.html) *(ou `?app=paciente`)* | PWA instalável com suporte offline, Scanner QR Code de Check-in no Totem, Tutorial Interativo e Extrato de Pontos. |

---

## 🌟 Visão Geral da Jornada & Versão 1.3.3

O **Bertuol Odontologia Avançada** evoluiu para uma solução corporativa completa de ecossistema odontológico **Multi-Tenant / Multi-Clínicas**, integrando o fluxo do consultório (Dentistas, Gerentes, Atendentes) com o público final (Pacientes e Clube de Vantagens Sorriso) e gestão comercial ativa.

### 🏆 Novidades e Funcionalidades Principais da v1.3.3

#### 1. 🛡️ Homologação & Validação das 3 Rotas Principais (RBAC)
- **Matriz de Proteção de Rotas (`ProtectedRoute.tsx`)**: Isolamento por contexto (`clinic`, `patient`, `root`) garantindo conformidade LGPD e segurança de acesso.
- **Auditoria 100% OK**: Validação automatizada de permissões para Dentistas, Recepcionistas, Gerentes, Admins e Pacientes.

#### 2. 🎯 Módulo CRM (Recall Preventivo & Funil de WhatsApp)
- **Varredura Inteligente de Recalls (6+ Meses)**: Varredura automática de pacientes sem consulta há mais de 6 meses para reativação preventiva.
- **Pipeline Kanban & Tabela de Oportunidades**: Organização visual por estágios (`Novos Leads`, `Em Contato`, `Agendado`, `Convertido`, `Perdido`).
- **Templates de Mensagem com 1 Clique**: Disparo rápido para WhatsApp com variáveis dinâmicas e oferta de bônus de pontos do Clube Sorriso.

#### 3. 📸 Tutorial Interativo no Check-in (PWA do Paciente)
- **Guia Passo a Passo Animado**: Destaque visual da câmera e orientação clara sobre leitura do QR Code no Totem da recepção.
- **Feedback Instantâneo de Pontos**: Explicação pedagógica de como o check-in credita pontos automaticamente no Clube Sorriso.

#### 4. 🏢 Gestão Multi-Clínicas (Multi-Tenant)
- **Unidades Gerenciadas**: Matriz Palmas (TO), Paraíso do Tocantins (TO) e Araguaína (TO).
- **Filtro de Unidade Consolidada ou Individual**: Seleção de clínicas no cabeçalho ou visão global consolidada.

---

## 🏗️ Arquitetura de Software & Tecnologias

```
├── client (Vite + React 19 + TypeScript + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/       # Componentes Modulares (Header, MultiClinicModal, LoginScreen, etc.)
│   │   ├── contexts/         # Contexto de Tenant e Filtro de Clínicas (TenantContext)
│   │   ├── patient/          # PWA do Paciente e Clube Sorriso Bertuol
│   │   ├── routes/           # Rotas e Guards (RootLayout, ClinicLayout, ProtectedRoute)
│   │   ├── services/         # DataService, SupabaseService, WebAuthn, Messaging
│   │   ├── types/            # Tipagem TypeScript (database.ts, Clinic, UserRole)
│   │   └── utils/            # Scripts SQL, Formatadores e Auxiliares
├── server (Node.js Express + TSX Proxy Server)
│   └── server.ts             # API endpoints (/api/clinics, /api/login, /api/webhooks, Gemini Proxy)
```

---

## 🗄️ Esquema do Banco de Dados (Supabase / PostgreSQL)

O script DDL completo com a tabela `public.clinics` atualizada com o endereço estruturado:

```sql
-- TABELA DE CLÍNICAS / UNIDADES (MULTI-TENANT)
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
    
    -- ENDEREÇO E GEOLOCALIZAÇÃO (v1.2.0)
    cep VARCHAR(10),                                    -- Máscara 00000-000
    logradouro VARCHAR(255),                            -- Rua / Avenida
    numero VARCHAR(20),                                 -- Número do imóvel
    complemento VARCHAR(100),                           -- Sala, Edifício
    bairro VARCHAR(100),                                -- Bairro
    cidade VARCHAR(100),                                -- Cidade
    estado VARCHAR(2),                                  -- UF (ex: TO)
    google_maps_url TEXT,                               -- Link do Google Maps
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* Node.js v18+ ou v20+
* npm ou yarn

### 1. Clonar o Repositório
```bash
git clone https://github.com/SEU_USUARIO/bertuol-flow.git
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
- **Versão**: `v1.3.3`
- **Gestão**: Flávio Santiago & Favuca Dias
