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
| **🩺 App do Profissional (Dentistas)** | [`https://bertuolflow.app-bertuol.tech/`](https://bertuolflow.app-bertuol.tech/) | Agenda cronológica diária sincronizada com Clinicorp, Resumos de prontuários com IA Gemini Flash, Alerta Sonoro de chegada, Consulta ao **Clube Sorriso & Vouchers**, Biometria WebAuthn e Chat Interno. |
| **🏢 Gestão & Recepção (CRM, Atendentes, Gerentes & Admin)** | [`https://bertuolflow.app-bertuol.tech/`](https://bertuolflow.app-bertuol.tech/) | Central de Credenciais de Clientes (`6.285+`), CRM de Recall 6+ meses, Totem QR Code (`/totem-imprimir`), Resgate e Baixa de Vouchers, Mensageria Unificada e Gestão de Usuários. |
| **👑 SuperAdmin Root & Simulador de Perfis** | [`https://bertuolflow.app-bertuol.tech/?role=admin_root`](https://bertuolflow.app-bertuol.tech/?role=admin_root) | Barra unificada Multi-Clínicas (`Palmas` & `Paraíso`), simulador instantâneo de perfis RBAC e atalhos diretos para **`🎬 Apresentação 60m`** e **`🎙️ Roteiros HeyGen`**. |
| **📱 Portal & PWA do Paciente (Clube Sorriso)** | [`https://bertuolflow.app-bertuol.tech/paciente.html`](https://bertuolflow.app-bertuol.tech/paciente.html) *(ou `?app=paciente`)* | PWA instalável com confirmação em 1 toque (`+10 pts`), Scanner QR Code de Check-in no Totem (`+30 pts`), Catálogo de Recompensas, Vouchers `BRT-XXXX`, Presente de Aniversário e Chat com a Clínica. |
| **🎬 Estúdio 3D de Treinamento (Modo Completo / Telão / Trilha)** | [`https://bertuolflow.app-bertuol.tech/slideshow-hyperframes.html`](https://bertuolflow.app-bertuol.tech/slideshow-hyperframes.html) | Palco Three.js 3D (Cápsulas de Vidro Flutuantes + Rede Neural) com separação em duas telas sincronizadas via `BroadcastChannel` + SSE: **`?mode=projector`** (Só Telão) e **`?mode=presenter`** (Só Trilha + Teleprompter + Cronômetro 60m). |
| **🎙️ Central de Roteiros HeyGen & Mapa Técnico** | [`https://bertuolflow.app-bertuol.tech/roteiros-heygen.html`](https://bertuolflow.app-bertuol.tech/roteiros-heygen.html) | 3 roteiros completos de 2 minutos (6 cenas cada: Paciente + Clube, Dentista, Recepção) com cópia em 1 clique, prompts B-roll para Veo/Flow e tabela de mapeamento real dos 16 módulos do código. |
| **❓ Central de Ajuda (FAQ Interativo)** | [`https://bertuolflow.app-bertuol.tech/faq.html`](https://bertuolflow.app-bertuol.tech/faq.html) | Guia rápido interativo para toda a equipe (Recepção, Dentistas, Gerência e Instalação PWA/Face ID). |

---

## 🌟 Visão Geral da Jornada & Versão 1.4.0

O **Bertuol Flow** evoluiu na **Versão 1.4.0** para entregar a gestão completa de credenciais e acessos da base real de pacientes (**6.285+ clientes importados** do Clinicorp para o Supabase), isolamento estrito Multi-Tenant por perfil, além de um **Estúdio de Apresentação 3D com Modo Duas Telas** e **Central de Roteiros HeyGen**.

### 🏆 Novidades e Funcionalidades Principais da v1.4.0

#### 1. 🔐 Central de Credenciais & Acessos de Clientes (`Clube Sorriso PWA`)
- **Carregamento Completo em Lotes (`6.285+ Clientes`)**: Sincronização paginada via `.range()` na tabela `public.patients` do Supabase, superando o limite padrão de 1.000 registros do PostgREST e trazendo toda a base das unidades **Palmas - TO** e **Paraíso do Tocantins - TO**.
- **Busca Inteligente por Nome & Sobrenome no Topo**: Campo de busca em destaque no topo do modal com normalização automática de acentos (`João` = `joao`), busca multi-palavras fora de sequência (`Maria Silva` encontra `MARIA APARECIDA DA SILVA`), filtro alfabético (`A–Z`) e consulta direta em tempo real no Supabase (`ilike`).
- **Disparo de Links de Ativação & Renovação de Senha**:
  - Envio de link de primeiro acesso com token de 48h e senha provisória via **WhatsApp Web**, **API Direta (Evolution GO)** ou **SMS Nativo**.
  - Modal de **Renovação de Senha de Balcão** e alternância de status (`Ativo no App`, `Pendente de Ativação`, `Bloqueado`) com 1 clique.
- **Permissão RBAC Dedicada (`canManageClientAccounts`)**: Permite que o perfil **Recepção / Atendente (`receptionist`)** gerencie cadastros, senhas e acessos de clientes/pacientes sem expor as abas administrativas de usuários internos ou cargos.

#### 2. 🎬 Estúdio de Apresentação 3D & Modo Duas Telas Sincronizadas (`/slideshow-hyperframes.html`)
- **Palco WebGL Three.js + Mockup 3D**:
  - Fundo espacial com **Rede Neural 3D interativa**, **4 Cápsulas de Vidro Fosco Flutuantes (`MeshPhysicalMaterial`)** com bordas luminosas e **celular em perspectiva 3D** que inclina a cada etapa.
  - Suporte a modo automático sincronizado, giro 360° e rotação livre pelo mouse.
- **Separação Telão (Projetor) + Trilha (Apresentador) em Tempo Real**:
  - **`?mode=projector` (Só Telão)**: Exibe apenas o palco visual 3D limpo em tela cheia para projetor ou TV, ocultando a trilha lateral e o teleprompter.
  - **`?mode=presenter` (Só Trilha)**: Painel exclusivo para o notebook ou celular do apresentador, com **Teleprompter em fonte grande**, **Cronômetro de 60 minutos**, **Prévia da próxima etapa**, lista clicável dos 8 blocos e botões para projetar o sistema ao vivo (`/` ou `/?app=paciente`) diretamente no Telão.
  - **Sincronização Dupla (`BroadcastChannel` + Server-Sent Events `/api/presentation/events`)**: Mudanças de slide entre janelas no mesmo computador ocorrem em `< 2ms` e também sincronizam entre celular e computador via servidor.

#### 3. 🎙️ Central de Roteiros HeyGen & Mapeamento Técnico (`/roteiros-heygen.html`)
- **3 Roteiros Estruturados de 2 Minutos (6 Cenas cada)**:
  1. **Vídeo 1:** Jornada do Paciente & Clube Sorriso (`/?app=paciente`).
  2. **Vídeo 2:** Jornada do Dentista & Corpo Clínico (`/` no perfil `dentist`).
  3. **Vídeo 3:** Jornada da Atendente / Recepção (`/` no perfil `receptionist`).
- **Mapeamento Técnico Auditado**: Tabela completa dos **16 módulos reais** encontrados no código-fonte com rotas, arquivos, endpoints e impacto operacional, além de botões de cópia em 1 clique para o **HeyGen AI Studio** e prompts B-roll para **Google Flow / Veo**.

#### 4. 🛡️ Homologação RBAC, Travamento de Unidade & Clube para Dentistas
- **Barra Root Unificada (`👑 MODO SUPERADMIN ROOT`)**: Controle de Escopo de Unidade (`Global / Palmas / Paraíso`), Simulador de Perfis RBAC e atalhos para o Estúdio 3D e Roteiros HeyGen.
- **Isolamento Estrito de Unidade**: Perfis de unidade única (`receptionist`, `dentist`, `admin_clinica` local) exibem automaticamente cadeado fixo (`🔒 Palmas - TO` / `🔒 Paraíso - TO`), enquanto `admin_root` e `gerente_atendimento` possuem alternância multi-clínica.
- **Acesso Clube Sorriso para Dentistas**: Botão **Clube Sorriso** habilitado no cabeçalho do perfil `dentist` para consulta de pontos e vouchers dos pacientes, mantendo ferramentas técnicas restritas ao SuperAdmin Root.

#### 5. 🎯 Módulo CRM (Recall Preventivo & Funil de WhatsApp) & Mensageria Interna
- **Varredura Inteligente de Recalls (6+ Meses)**: Identificação automática de pacientes sem consulta há mais de 6 meses para reativação preventiva com funil Kanban e disparo no WhatsApp.
- **Mensageria Interna Multi-Unidade**: Chat em tempo real entre recepção, dentistas e pacientes com gravação de áudio no navegador, envio de fotos/mídia e contador de mensagens não lidas.

#### 6. 🏢 Gestão Multi-Clínicas (Multi-Tenant)
- **Unidades Mapeadas no Supabase (`public.clinics`)**:
  - **Unidade Palmas - TO**: `d176a1c3-9955-4555-87d9-1da0bacb61a5` (`external_id`: `5053762760081408`)
  - **Unidade Paraíso do Tocantins - TO**: `5d30567b-ecfc-49a7-903d-f994c6de50f1` (`external_id`: `5053762760081409`)

---

## 🏗️ Arquitetura de Software & Tecnologias

```
├── client (Vite + React 19 + TypeScript + Tailwind CSS v4)
│   ├── public/
│   │   ├── slideshow-hyperframes.html  # Estúdio 3D 60m (Completo, ?mode=projector e ?mode=presenter)
│   │   ├── roteiros-heygen.html        # Central dos 3 Roteiros HeyGen + Mapeamento Técnico Real
│   │   ├── faq.html                    # Central de Ajuda Interativa da Equipe
│   │   └── sw-push.js                  # Service Worker para Web Push VAPID & PWA
│   ├── src/
│   │   ├── components/       # Modais e UI (ClientAccountsTab, UserManagementModal, Header, MiniCRM, etc.)
│   │   ├── config/           # Rótulos centralizados de versão (version.ts -> v1.4.0)
│   │   ├── contexts/         # Contexto de Tenant e Filtro de Clínicas (TenantContext)
│   │   ├── patient/          # PWA do Paciente e Clube Sorriso Bertuol
│   │   ├── routes/           # Rotas e Guards (RootLayout, ClinicLayout, ProtectedRoute)
│   │   ├── services/         # DataService, SupabaseService, WebAuthn, Messaging
│   │   ├── types/            # Tipagem TypeScript (database.ts, Clinic, UserRole, UserPermissions)
│   │   └── utils/            # Scripts SQL, Formatadores e Auxiliares
├── server (Node.js Express + TSX Proxy Server)
│   └── server.ts             # APIs REST & SSE (/api/clinics, /api/login, /api/presentation/events, /api/clinicorp/*, Gemini Proxy)
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

