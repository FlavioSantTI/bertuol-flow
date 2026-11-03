# 🦷 Bertuol Odontologia Avançada — Versão 1.3.0

> **Plataforma Web Multi-Tenant de Gestão de Clínicas Odontológicas, Mini-CRM com Funis Personalizados, Mensageria Integrada (Equipe & Paciente), Agenda Diária com IA Gemini, PWA do Paciente e Totem de Recepção com Gamificação.**

[![Versão](https://img.shields.io/badge/vers%C3%A3o-v1.3.0-FF981A.svg?style=for-the-badge)](https://github.com/FlavioSantTI/bertuol-flow)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB_Bertuol-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Gemini AI](https://img.shields.io/badge/Google_AI_Studio-Gemini_Flash-8E75FF.svg?style=for-the-badge&logo=google)](https://ai.google.dev)

---

## 🌟 Visão Geral da Jornada & Novidades da Versão 1.3.0

O **Bertuol Flow v1.3.0** é uma solução corporativa completa para o ecossistema odontológico **Multi-Tenant / Multi-Clínicas**, dividindo-se em duas experiências integradas:
1. **Versão Clínica (`/app`)**: Para **Dentistas**, **Atendentes (Recepção)**, **Gerentes** e **Administradores**.
2. **Versão Cliente (`/paciente`)**: PWA instalável para **Pacientes** com confirmação de consulta, check-in por QR Code no Totem, canal de mensagens e programa de fidelidade **Clube Sorriso Bertuol**.

---

## 🏆 Funcionalidades Principais (v1.3.0)

### 1. 🎯 Mini-CRM Comercial & Recall Inteligente (Novo na v1.3.0)
- **CRUD Completo de Funis (Pipelines) e Etapas (Colunas Kanban)**:
  - Crie, renomeie, defina como padrão e exclua múltiplos funis (ex: *Funil Principal Recall & WhatsApp*, *Funil de Orçamentos & Implantes*, *Alinhadores*).
  - Adicione, edite, escolha cores/ícones, reordene e exclua etapas do Kanban com comportamento contábil automático (*Em Aberto*, *Agendado*, *Convertido/Ganho* ou *Perdido*).
- **Varredura Automática de Recall (6+ Meses)**:
  - Identifica automaticamente pacientes sem consulta há mais de 180 dias e gera oportunidades de reativação com bônus de pontos no Clube Sorriso.
- **Disparo Rápido no WhatsApp com Templates Dinâmicos**:
  - Substituição automática de `{nome}`, `{doutor}`, `{clinica}` e `{pontos}` + avanço automático da oportunidade para a etapa *Em Contato*.
- 📖 **Documentação dedicada**: Consulte o [**Tutorial Completo do Mini-CRM (`TUTORIAL_MINI_CRM.md`)**](./TUTORIAL_MINI_CRM.md).

### 2. 💬 Central de Mensageria Híbrida (Equipe Interna & Pacientes) (Novo na v1.3.0)
- **Comunicação Paciente ↔ Clínica**: O paciente abre conversas diretamente pelo PWA (`/paciente`) e a mensagem é roteada automaticamente para a Recepção/Administração da unidade na aba **Pacientes**.
- **Chat Interno da Equipe**: Comunicação em tempo real entre Recepção, Consultórios (Dentistas) e Gerência, com suporte a anexos, confirmação de leitura e histórico persistido no Supabase ([`MENSAGERIA_SUPABASE_SETUP.sql`](./MENSAGERIA_SUPABASE_SETUP.sql)).

### 3. 🏢 Gestão Multi-Clínicas (Multi-Tenant) & ViaCEP
- **Unidades Gerenciadas**: Matriz Palmas (TO), Paraíso do Tocantins (TO) e Araguaína (TO).
- **CRUD de Unidades com ViaCEP**: Consulta automática de CEP (`00000-000`), preenchimento de logradouro/bairro/cidade/UF e link direto do Google Maps por unidade.
- **Isolamento e Segurança (LGPD)**: Recepção travada na unidade física local; SuperAdmin Root com visão global consolidada.

### 4. 👑 Modo SuperAdmin Root & Simulador de Perfis (RBAC)
- **Acesso Irrestrito**: Garantido para os perfis administradores root.
- **Barra Superior de Simulação**: Alterne em 1 clique a visualização entre *Dentista*, *Recepção*, *Gerente de Atendimento* e *Admin Clínica*.

### 5. 🤖 Agenda Diária Inteligente com IA Gemini
- **Análise Clínica com IA**: Geração de resumos executivos de prontuários e anamneses usando `@google/genai` (Gemini Flash).
- **Ordenação Cronológica & Filtro por Profissional**: Sincronização em tempo real com a rotina do consultório.

### 6. 📱 PWA do Paciente & Totem de Recepção (Clube Sorriso Bertuol)
- **Instalável (PWA)**: Manifest e Service Worker (`v1.3.0`) para celular ou desktop (`/paciente`).
- **Check-in via QR Code no Totem**: O paciente escaneia o QR Code no Totem da recepção, notifica o dentista em tempo real com alerta sonoro/visual e acumula pontos (**+20 pts**).
- **Catálogo de Resgate de Prêmios**: Troca de pontos por recompensas na clínica.

---

## 📚 Documentação Operacional e Planejamento de Lançamento

- 🎯 [**Tutorial de Uso do Mini-CRM (`TUTORIAL_MINI_CRM.md`)**](./TUTORIAL_MINI_CRM.md) — Passo a passo completo de uso diário, varredura de recall, criação de funis/colunas e scripts de WhatsApp.
- 🚀 [**Plano de Lançamento v1.3.0 (`PLANO_LANCAMENTO_APP_V1.3.0.md`)**](./PLANO_LANCAMENTO_APP_V1.3.0.md) — Organização das versões Cliente e Clínica (Dentistas, Atendentes, Admins) e checklist completo de limpeza para produção.
- 🗄️ [**Setup SQL da Mensageria (`MENSAGERIA_SUPABASE_SETUP.sql`)**](./MENSAGERIA_SUPABASE_SETUP.sql) — Script idempotente para criar as tabelas e políticas RLS da mensageria no Supabase.

---

## 🏗️ Arquitetura de Software & Tecnologias

```text
├── client (Vite + React 19 + TypeScript + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/
│   │   │   ├── crm/          # MiniCRMModal, CRMPipelineManagerModal, CRMLeadCard, etc.
│   │   │   ├── messaging/    # Central de Mensagens Interna e Paciente
│   │   │   └── ...           # Header, MultiClinicModal, LoginScreen, Totem, etc.
│   │   ├── config/           # Controle centralizado de versão (version.ts -> v1.3.0)
│   │   ├── contexts/         # Contexto Multi-Tenant (TenantContext)
│   │   ├── patient/          # PWA do Paciente e Clube Sorriso Bertuol (/paciente)
│   │   ├── routes/           # Rotas e Guards (RootLayout, ClinicLayout, ProtectedRoute)
│   │   ├── services/         # CRMService, MessagingService, SupabaseService, WebAuthn
│   │   ├── types/            # Tipagens TypeScript (database.ts, crm.ts, messaging.ts)
│   │   └── utils/            # Scripts SQL, Formatadores e Auxiliares
├── server (Node.js Express + TSX Proxy Server)
│   └── server.ts             # API endpoints (/api/clinics, /api/messaging, /api/login, Gemini Proxy)
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* Node.js v18+ ou v20+
* npm

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
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase
```

### 4. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
- **App da Clínica (Dentistas, Recepção, Admins)**: `http://localhost:3000/app`
- **App do Cliente / Paciente (PWA)**: `http://localhost:3000/paciente`
- **Painel Rápido de Links de Homologação**: `http://localhost:3000/admin-links.html`

---

## 📜 Licença e Propriedade

Desenvolvido para **Bertuol Odontologia Avançada**. Todos os direitos reservados.
- **Versão**: `v1.3.0` (Build `2026.11.03`)
- **Gestão**: Flávio Santiago & Favuca Dias
