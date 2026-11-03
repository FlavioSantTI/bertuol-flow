# 🚀 Plano Geral de Lançamento (Go-Live) — Bertuol Flow v1.3.0

> **Roteiro técnico, operacional e de higienização de dados para entrar em produção com a Versão Cliente (PWA do Paciente) e a Versão Clínica (Dentistas, Atendentes/Recepção, Gerentes e Administradores).**

---

## 🏗️ 1. Arquitetura das Versões de Lançamento

O ecossistema **Bertuol Flow v1.3.0** opera a partir de um único servidor Node.js/Vite consolidado ([`server.ts`](server.ts)), servindo **duas aplicações independentes (Multi-Entry PWA)** com rotas e escopos isolados:

| Edição / Público | URL / Rota de Produção | Entrada HTML / Manifest | Perfis que Acessam |
| :--- | :--- | :--- | :--- |
| **1. App do Cliente (Paciente)** | `https://seu-dominio.com.br/paciente` | [`paciente.html`](paciente.html) + [`manifest-paciente.json`](public/manifest-paciente.json) | **Pacientes** (Login por CPF/Celular, Check-in QR Code, Clube Sorriso, Chat com a Clínica) |
| **2. App da Clínica (Corporativo)** | `https://seu-dominio.com.br/app` (ou `/`) | [`index.html`](index.html) + Manifest Principal | **Dentistas**, **Atendentes (Recepção)**, **Gerentes de Atendimento** e **Admins / SuperAdmin** |
| **3. Totem de Autoatendimento** | `https://seu-dominio.com.br/app` *(Botão Modo Totem)* | [`ReceptionTotemModal.tsx`](src/components/ReceptionTotemModal.tsx) | Tablet/Totem fixo na recepção de cada unidade (Palmas, Paraíso, Araguaína) |

---

## 👥 2. Organização por Perfil na Versão Clínica (`/app`)

Para que o lançamento ocorra sem atrito, cada colaborador deve ter seu e-mail cadastrado na tabela `public.profiles` (ou gerenciado na tela de **Gestão de Equipe / Perfis** pelo Admin):

### 🦷 A) Perfil Dentista (`role: 'dentist'`)
- **O que vê e usa:**
  - Agenda cronológica dos seus próprios pacientes no dia/semana.
  - Botão **Resumo Clínico com IA Gemini** (análise rápida de anamnese, alertas médicos e histórico antes de chamar o paciente).
  - Notificação visual e sonora em tempo real quando o paciente faz **Check-in no Totem** da recepção.
  - **Mensageria Interna**: Comunicação direta com a Recepção/Gerência e resposta a dúvidas de pacientes encaminhadas.
- **O que configurar antes do lançamento:**
  - Vincular o `dentist_id` / nome exato do profissional conforme cadastrado no Clinicorp para sincronização automática da agenda.

### 🛎️ B) Perfil Atendente / Recepção (`role: 'reception'`)
- **O que vê e usa:**
  - Visão travada na sua **Unidade Física local** (`clinic_id` fixo por segurança e LGPD).
  - Gestão completa de chegadas, confirmação de presença e abertura do **Totem QR Code** da unidade.
  - **Central de Mensagens**: Atendimento de conversas iniciadas pelos pacientes no App do Paciente (`/paciente`) e comunicação interna com os consultórios.
  - **Mini-CRM Bertuol**: Disparo diário da fila de *Recall Preventivo (6+ meses)* e movimentação de leads no Kanban.
  - Validação de códigos de resgate de prêmios do **Clube Sorriso Bertuol**.

### 📈 C) Perfil Gerente de Atendimento (`role: 'manager'`)
- **O que vê e usa:**
  - Tudo o que a Recepção acessa + **Métricas de Conversão do Mini-CRM**, criação/edição de **Funis (Pipelines)** e **Modelos de Mensagens**, gestão de catálogo de prêmios do Clube Sorriso e relatórios de atendimento.

### 👑 D) Perfil Admin Clínica & SuperAdmin Root (`role: 'admin'` / `isRoot: true`)
- **O que vê e usa:**
  - Visão Multi-Clínicas consolidada (**Todas as Unidades** ou filtro individual).
  - **CRUD de Unidades Multi-Tenant** com busca automática de endereço por CEP (ViaCEP) e link do Google Maps.
  - Configuração de credenciais de integração (Clinicorp API, Supabase, Gemini AI, Webhooks WhatsApp).
  - **Simulador de Perfis (RBAC)**: Barra superior exclusiva para testar a visão de Dentista, Recepção ou Gerente a qualquer momento.

---

## 📱 3. Organização da Versão Cliente — PWA do Paciente (`/paciente`)

### Funcionalidades Prontas para o Paciente:
1. **Acesso Rápido sem Senha Complexa:** Identificação por Telefone/CPF sincronizado com a base da clínica.
2. **Confirmação de Consulta em 1 Toque:** Visualização das próximas consultas + botão de rota no Google Maps da unidade.
3. **Check-in via Leitor de QR Code no Totem:** Ao chegar na clínica, o paciente escaneia o QR Code do Totem, avisa o dentista automaticamente e ganha **+20 pontos** na hora.
4. **Clube Sorriso Bertuol (Gamificação):** Extrato de pontos, missões (aniversário, indicação, check-in) e resgate de prêmios com voucher validável na recepção.
5. **Canal de Mensagens com a Clínica:** O paciente envia mensagem pelo app e a conversa cai diretamente na aba **Pacientes** da Central de Mensagens da clínica (roteada para Recepção/Admin da unidade).

---

## 🧹 4. Checklist de Limpeza ("Deixar Limpo para Produção")

Antes de divulgar o link oficial para a equipe e para os pacientes, execute esta limpeza em **4 etapas**:

### Etapa 4.1 — Limpar Arquivos JSON de Testes Locais no Servidor
Durante o desenvolvimento, o servidor local salvou logs e conversas de teste em arquivos `.json` na raiz. Antes do deploy final (ou no servidor de produção), zere ou remova o conteúdo de teste destes arquivos:
- `conversations_store.json` → deixar como `[]`
- `messages_store.json` → deixar como `[]`
- `participants_store.json` → deixar como `[]`
- `conversation_events_store.json` → deixar como `[]`
- `in_app_notifications.json` → deixar como `[]`
- `birthday_gift_requests.json` → deixar como `[]`
- `access_logs.json` → deixar como `[]`

### Etapa 4.2 — Limpar Banco de Dados Supabase (Remover Dados Fictícios)
No **SQL Editor** do seu painel Supabase:
1. Certifique-se de que o script [`MENSAGERIA_SUPABASE_SETUP.sql`](MENSAGERIA_SUPABASE_SETUP.sql) já foi executado.
2. Para limpar mensagens e conversas de teste criadas durante a homologação, execute:
   ```sql
   -- Limpa apenas as mensagens e conversas de teste antes do Go-Live
   TRUNCATE TABLE
     public.message_reads,
     public.conversation_events,
     public.messages,
     public.conversation_participants,
     public.conversations
   RESTART IDENTITY CASCADE;
   ```
3. Verifique a tabela `public.clinics` para garantir que apenas as unidades reais (**Palmas**, **Paraíso**, **Araguaína**) estejam ativas (`active = true`) com seus respectivos CEPs, endereços, telefones de WhatsApp e `google_maps_url` preenchidos.
4. Verifique a tabela `public.profiles` para garantir que os e-mails reais dos dentistas, recepcionistas e administradores estejam cadastrados com o `role` e `clinic_id` corretos.

### Etapa 4.3 — Limpar `localStorage` do Mini-CRM nos Navegadores de Teste
No Mini-CRM ([`crmService.ts`](src/services/crmService.ts)), existem 5 oportunidades iniciais de demonstração (*Ana Paula Silveira*, *Carlos Eduardo Mendes*, etc.) que são carregadas quando o navegador está vazio:
- **Opção A (Rápida pela Interface):** Basta clicar no ícone de lixeira (`🗑️`) nos 5 cards de exemplo e clicar em **"Varredura Recall 6+ Meses"** para popular o CRM apenas com os pacientes reais vindos do banco/Clinicorp.
- **Opção B (Código Limpo sem Seed):** Se desejar que nenhum card de exemplo apareça em novos computadores da clínica, podemos deixar `INITIAL_SEED_OPPORTUNITIES = []` em [`src/services/crmService.ts`](src/services/crmService.ts#L107).

### Etapa 4.4 — Higienizar Variáveis de Ambiente (`.env` de Produção)
No servidor de produção (Portainer / Docker / VPS), configure todas as chaves definitivas:
```env
NODE_ENV=production
PORT=3000

# Inteligência Artificial (Resumos Clínicos)
GEMINI_API_KEY=sua_chave_producao_google_ai_studio

# Banco de Dados Oficial Supabase
SUPABASE_URL=https://sswbkfrpxboxmjvunhzt.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon_oficial
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_oficial

# Segurança Biometria WebAuthn (Passkeys)
WEBAUTHN_RP_ID=seu-dominio-oficial.com.br
WEBAUTHN_ORIGIN=https://seu-dominio-oficial.com.br

# Notificações Web Push (VAPID Keys)
VAPID_PUBLIC_KEY=sua_vapid_public_key
VAPID_PRIVATE_KEY=sua_vapid_private_key
VAPID_SUBJECT=mailto:contato@bertuol.com.br
```

---

## 📅 5. Cronograma Sugerido de Lançamento (Rollout em 4 Fases)

### Fase 1: Preparação & Infraestrutura (Dia 1)
- [ ] Executar limpeza das tabelas de teste no Supabase (`TRUNCATE` de mensageria e check-ins de teste).
- [ ] Cadastrar na tela **Gestão Multi-Clínicas** os dados reais de endereço, CEP, WhatsApp e link do Google Maps de cada unidade.
- [ ] Gerar build de produção (`npm run build`) e subir container Docker/Portainer com HTTPS ativo (obrigatório para câmera de QR Code e Biometria WebAuthn).

### Fase 2: Onboarding Interno — Equipe Clínica (Dia 2)
- [ ] **Recepção / Atendentes:** Treinamento de 30 min usando o [`TUTORIAL_MINI_CRM.md`](TUTORIAL_MINI_CRM.md), abertura do Totem QR Code e resposta na Central de Mensagens.
- [ ] **Dentistas:** Instalar o atalho do App da Clínica (`/app`) no celular/computador do consultório, ativar notificações de chegada de paciente e testar o Resumo por IA.
- [ ] **Gerência / Admins:** Configurar os funis definitivos no Mini-CRM e revisar os modelos de mensagens de WhatsApp.

### Fase 3: Soft Launch — Pacientes Piloto na Recepção (Dias 3 a 5)
- [ ] Posicionar o QR Code de instalação do **App do Paciente (`/paciente`)** e o **Totem de Check-in** na recepção da unidade Matriz (Palmas).
- [ ] Orientar a recepção a convidar os pacientes que chegarem para fazer o check-in pelo celular ganhando **+20 pontos** de boas-vindas no Clube Sorriso.

### Fase 4: Disparo Oficial de Reativação via Mini-CRM (Dia 6+)
- [ ] Executar a **"Varredura Recall 6+ Meses"** no Mini-CRM.
- [ ] Iniciar o disparo gradual de mensagens pelo WhatsApp convidando os pacientes inativos para agendar o retorno preventivo e conhecer o novo **Clube Sorriso Bertuol**.
