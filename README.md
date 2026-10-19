# 🦷 Bertuol Odontologia Avançada — Versão 1.2.0

> **Plataforma Web Multi-Tenant de Gestão de Clínicas Odontológicas, Agenda Diária Inteligente com IA Gemini, PWA do Paciente e Totem de Recepção com Gamificação.**

[![Versão](https://img.shields.io/badge/vers%C3%A3o-v1.2.0-FF981A.svg?style=for-the-badge)](https://github.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB_Bertuol-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Gemini AI](https://img.shields.io/badge/Google_AI_Studio-Gemini_Flash-8E75FF.svg?style=for-the-badge&logo=google)](https://ai.google.dev)

---

## 🌟 Visão Geral da Jornada & Versão 1.2.0

O **Bertuol Odontologia Avançada** evoluiu para uma solução corporativa completa de ecossistema odontológico **Multi-Tenant / Multi-Clínicas**, integrando o fluxo do consultório (Dentistas, Gerentes, Atendentes) com o público final (Pacientes e Clube de Vantagens Sorriso).

### 🏆 Funcionalidades Principais da v1.2.0

#### 1. 🏢 Gestão Multi-Clínicas (Multi-Tenant)
- **Unidades Gerenciadas**: Matriz Palmas (TO), Paraíso do Tocantins (TO) e Araguaína (TO).
- **Filtro de Unidade Consolidada ou Individual**: Seleção de clínicas no cabeçalho ou visão global consolidada.
- **Isolamento e Segurança (LGPD)**: Recepção travada na unidade física local; SuperAdmin Root com controle irrestrito.

#### 2. 📍 CRUD de Unidades com Endereço Estruturado & ViaCEP
- **Integração Assíncrona ViaCEP**: Digitação de CEP (`00000-000`) com consulta automática na API `viacep.com.br`.
- **Preenchimento Automático de Endereço**: Preenche logradouro, bairro, cidade e UF automaticamente.
- **Foco Automático do Cursor**: Move o cursor diretamente para o campo **Número** após o CEP ser localizado.
- **Geolocalização no Google Maps**: Link de rota/localização por unidade com botão de atalho *"Testar Link"* para envio automático em confirmações de WhatsApp.

#### 3. 👑 Modo SuperAdmin Root & Simulador de Perfis (RBAC)
- **Acesso Irrestrito**: Garantido para os perfis `favuca.dias@gmail.com` e `flavio.santiago.ti@outlook.com`.
- **Barra Superior de Simulação**: O SuperAdmin pode testar o sistema como *Dentista*, *Recepção*, *Gerente de Atendimento* ou *Admin Clínica*, mantendo o botão de 1 clique *"Restaurar Root"*.

#### 4. 🤖 Agenda Diária Inteligente com IA Gemini
- **Análise Clínica com IA**: Geração de resumos inteligentes de prontuários e anamneses usando a SDK oficial `@google/genai` (Gemini Flash).
- **Ordenação Rápida por Horário**: Sincronização cronológica de horários e procedimentos.

#### 5. 📱 PWA do Paciente (Clube Sorriso Bertuol)
- **Instalável (PWA)**: Manifest e Service Worker offline para celular ou desktop (`/paciente`).
- **Check-in via QR Code no Totem**: O paciente escaneia o QR Code no Totem da recepção e acumula pontos (+20 pts).
- **Catálogo de Resgate de Prêmios**: Troca de pontos por escovas elétricas, kits ortodônticos e clareamentos.

#### 6. 🛎️ Totem de Recepção & Notificação em Tempo Real
- Alerta visual no topo da tela do consultório quando um paciente realiza check-in na recepção.
- Suporte a notificações Web Push e som de aviso configurável.

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
- **Versão**: `v1.2.0`
- **Gestão**: Flávio Santiago & Favuca Dias
