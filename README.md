# 🦷 Bertuol Odontologia Avançada — Versão 1.9.0

> **Plataforma Web Multi-Tenant de Gestão de Clínicas Odontológicas, Central de Suporte Unificada (FAQ por Perfil, Chat de IA com Isolamento, Cartilhas A4 em PDF e Sincronização via GitHub PR), Central de Credenciais de Clientes (6.285+ Pacientes), CRM Comercial Multi-Funil com Data do Orçamento separada da Última Vinda Real à Clínica (Clinicorp), Pipeline de Aniversariantes & Automação Diária de Vouchers (`BRT-ANIV`) com Integração Direta Supabase & n8n, Dashboard de Relatórios (CSV/PDF), Carga Histórica de 1 Ano de Orçamentos Clinicorp (UI + CLI), Filtro & Ordenação por Data, Gestão de Rótulos e Integração Bidirecional Clinicorp & WhatsApp, Mensageria Interna Multi-Participante, Agenda Diária Inteligente com IA Gemini, PWA do Paciente com Login Seguro, Central de QR Code (Marketing & Totem) e Central Exclusiva Admin Root.**

[![Versão](https://img.shields.io/badge/vers%C3%A3o-v1.9.0-147A80.svg?style=for-the-badge)](https://github.com/FlavioSantTI/bertuol-flow)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB_Bertuol-3ECF8E.svg?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Gemini AI](https://img.shields.io/badge/Google_AI_Studio-Gemini_Flash-8E75FF.svg?style=for-the-badge&logo=google)](https://ai.google.dev)

---

## 🔗 Rotas Oficiais de Produção (`bertuolflow.app-bertuol.tech`)

As rotas principais da aplicação estão homologadas, isoladas por perfil (`RBAC`) e prontas para o lançamento oficial:

| Rota / Perfil | URL de Acesso Direto | Descrição & Recursos |
| :--- | :--- | :--- |
| **🩺 App do Profissional (Dentistas)** | [`https://bertuolflow.app-bertuol.tech/`](https://bertuolflow.app-bertuol.tech/) | Interface clínica 100% limpa com agenda cronológica sincronizada com Clinicorp, Resumos Executivos com IA Gemini Flash, Alerta Sonoro de chegada, Consulta ao **Clube Sorriso & Vouchers**, Biometria WebAuthn e Chat Interno. |
| **🏢 Gestão & Recepção (CRM, Atendentes, Gerentes & Admin)** | [`https://bertuolflow.app-bertuol.tech/`](https://bertuolflow.app-bertuol.tech/) | Central de Credenciais de Clientes (`6.285+`), CRM de Recall 6+ meses, Totem QR Code (`/totem-imprimir`), Resgate e Baixa de Vouchers, Mensageria Unificada e Gestão de Usuários. |
| **👑 Central Global SuperAdmin Root & Tutoriais (`/root` / `/tutoriais`)** | [`https://bertuolflow.app-bertuol.tech/root`](https://bertuolflow.app-bertuol.tech/root) *(ou `?app=root` / `?app=tutoriais`)* | **Acesso Restrito `admin_root`:** Central unificada de Tutoriais, Estúdio 3D 60m, Modos Telão/Apresentador, Roteiros HeyGen, Governança Multi-Tenant e Checklist de Lançamento. |
| **📱 Portal & PWA do Paciente (Clube Sorriso)** | [`https://bertuolflow.app-bertuol.tech/paciente.html`](https://bertuolflow.app-bertuol.tech/paciente.html) *(ou `?app=paciente`)* | PWA instalável com confirmação em 1 toque (`+10 pts`), Scanner QR Code de Check-in no Totem (`+30 pts`), Catálogo de Recompensas, Vouchers `BRT-XXXX`, Presente de Aniversário e Chat com a Clínica. |
| **🎬 Estúdio 3D de Treinamento (Acesso via Central Root)** | [`https://bertuolflow.app-bertuol.tech/slideshow-hyperframes.html`](https://bertuolflow.app-bertuol.tech/slideshow-hyperframes.html) | Palco Three.js 3D (Cápsulas de Vidro Flutuantes + Rede Neural) com separação em duas telas sincronizadas via `BroadcastChannel` + SSE: **`?mode=projector`** (Só Telão) e **`?mode=presenter`** (Só Trilha + Teleprompter + Cronômetro 60m). |
| **🎙️ Central de Roteiros HeyGen & Mapa Técnico (Acesso via Central Root)** | [`https://bertuolflow.app-bertuol.tech/roteiros-heygen.html`](https://bertuolflow.app-bertuol.tech/roteiros-heygen.html) | 3 roteiros completos de 2 minutos (6 cenas cada: Paciente + Clube, Dentista, Recepção) com cópia em 1 clique, prompts B-roll para Veo/Flow e tabela de mapeamento real dos 16 módulos do código. |
| **❓ Central de Suporte Unificada (FAQ, IA & Cartilhas A4)** | [`https://bertuolflow.app-bertuol.tech/suporte`](https://bertuolflow.app-bertuol.tech/suporte) *(com redirect de `/faq.html`)* | Base unificada separada por perfil (**Paciente**, **Dentista** e **Recepção & CRM**) com Chat de IA isolado por perfil, citações clicáveis e download/impressão de Cartilhas A4 em PDF. |

---

## 🌟 Visão Geral da Jornada & Versão 1.8.0

O **Bertuol Flow** chega à **Versão 1.8.0** trazendo a separação definitiva entre **Data do Orçamento** e **Última Vinda Real à Clínica** (presença efetivamente atendida no Clinicorp) em todos os funis do CRM, com atualização em lote (12 meses) e consulta individual em 1 clique — mantendo os cards e a barra de filtros enxutos e livres de poluição visual.

### 🗓️ Novidades da v1.8.0 — Data do Orçamento vs. Última Vinda Real à Clínica (Clinicorp)

- **🔎 Detecção Validada de Presença Real no Clinicorp (`GET /api/clinicorp/patient-last-visit` & `POST /api/crm/sync-last-visits`)**:
  - Consulta janelas paralelas de até 12 meses no Clinicorp com cache em servidor (5 min) e filtragem estrita de comparecimento real (status atendido / sessão registrada), ignorando faltas, cancelamentos, registros excluídos e agendamentos futuros.
  - Sincronização em lote nos funis do CRM preservando automaticamente a **Data do Orçamento** antes de gravar a **Última Vinda à Clínica**, contagem de dias sem vir e último procedimento realizado.
- **🧩 Persistência Segura & Transparente (`src/utils/crmSystemFields.ts`)**:
  - Preserva metadados internos (`__sys_estimate_date`, `__sys_last_visit_proc`, `__sys_last_visit_synced`) no Supabase sem alterar os campos livres editados pelas atendentes.
- **✨ Interface Limpa no CRM (`CRMLeadCard`, `CRMLeadDrawer`, `CRMNewOpportunityModal`, `MiniCRMModal`)**:
  - **Cards (Kanban e Lista)**: linha inline discreta em fonte tabular exibindo `Orç. DD/MM/AAAA` junto de `Voltou DD/MM/AAAA` (quando houve retorno após o orçamento), `Últ. vinda DD/MM/AAAA` ou `Sem retorno`.
  - **Gaveta do Lead & Novo Atendimento**: campos editáveis de **Data do Orçamento** e **Última Vinda à Clínica** com botão de atualização em 1 clique direto do Clinicorp e resumo silencioso de dias/procedimento.
  - **Ordenação & Sincronização na Barra de Datas**: seletor compacto de ordenação (*Orçamento mais recente/antigo*, *Última vinda recente*, *Mais tempo sem vir*) e botão **Última Vinda** integrados à própria barra de datas já existente, sem criar novas linhas na interface.

### 🧭 Recursos da v1.7.0 — Central de Suporte Unificada, Cartilhas PDF A4 & Correção Clinicorp

- **📚 Base Única Versionada por Perfil (`docs/support-kb/`)**:
  - 32 guias oficiais segmentados em **Paciente (11)**, **Dentista (10)** e **Recepção & CRM (11)**, servindo como fonte única para o FAQ interativo, o Chat de IA e as Cartilhas A4.
- **🤖 Chat de Suporte com IA & Isolamento Automático de Perfil (`POST /api/support/chat`)**:
  - Isolamento estrito no servidor: visitantes da rota pública `/suporte` e pacientes acessam exclusivamente conteúdo de **Paciente**; dentistas acessam **Dentista**; recepção acessa **Recepção & CRM + Paciente**; gerência/admin alterna entre os 3 acervos e consulta o status de sincronização GitHub.
  - Respostas fundamentadas exclusivamente nos guias permitidos, com citações clicáveis que abrem direto o passo a passo correspondente.
- **📄 Cartilhas A4 Imprimíveis & Download Direto em PDF (`SupportPrintBooklet` & `jsPDF`)**:
  - Geração vetorial direta em PDF A4 (`Baixar PDF (A4)`) e impressão sincronizada (`Imprimir` com fallback automático para download em ambientes incorporados), com capa opcional, QR Code para `/suporte`, sumário e paginação no rodapé.
- **🔄 Atualização Contínua via GitHub Action com Pull Request (`.github/workflows/sync-support-docs.yml`)**:
  - Mapeamento automático de impacto (`impactMap`): a cada push na `main` que altere fluxos de pacientes, dentistas ou recepção, o workflow gera rascunho de atualização via `scripts/sync-support-docs.ts` e abre Pull Request para revisão humana antes de publicar.
- **📞 Correção de Telefone (`MobilePhone`) no Agendamento Clinicorp (`/api/clinicorp/schedule-appointment`)**:
  - Remoção automática do prefixo internacional `55` antes de consultar/criar paciente ou agendar no Clinicorp, priorização do telefone já salvo no prontuário do paciente e reenvio automático em caso de erro HTTP 400 por divergência de 8 vs 9 dígitos.

### 🎂 Recursos da v1.6.0 — Pipeline de Aniversariantes & Automação Diária de Vouchers (`BRT-ANIV`)

- **🎉 Funil de Sistema "Aniversariantes" (`birthdays`) no CRM**:
  - Novo funil dedicado com 5 etapas: **Aniversariante do Dia** → **Voucher Enviado** → **Cortesia Agendada** → **Voucher Resgatado** → **Expirado / Sem Retorno**.
  - Totalmente integrado aos filtros do CRM, KPIs e relatórios (`Aniversariantes (Voucher)`), captura rápida inline e cadastro manual de oportunidades.
- **🎟️ Voucher Único `BRT-ANIV-XXXX` (Validade de 7 Dias) & Baixa Automática**:
  - Geração automática de código exclusivo por aniversariante com expiração em 7 dias (configurável de 1 a 30 dias), exibido nos cards (Kanban e Lista) com botão de cópia rápida e contagem regressiva semântica de vencimento.
  - Template dedicado de WhatsApp com interpolação automática de `{nome}`, `{clinica}`, `{voucher}` e `{validade}` no envio automático e no modal de contato rápido (`CRMQuickContactModal`).
  - Persistência durável dos vouchers e integração direta com a baixa da recepção (`POST /api/reception/voucher/claim`), movendo automaticamente o card correspondente no Supabase para **Voucher Resgatado** com registro de auditoria.
- **⏰ Motor Diário Duplo (Agendador Interno + Webhook n8n) & Idempotência Anual**:
  - **Agendador diário no servidor**: executa automaticamente no horário configurado (padrão `08:30` em `America/Sao_Paulo`), consultando aniversariantes exatos do dia (`DD/MM`) no Clinicorp, enriquecendo telefones via `public.patients`, enviando WhatsApp (WAHA / Evolution GO com cadência anti-bloqueio), disparando notificação In-App/Push no Portal do Paciente e criando o card com follow-up para D+4.
  - **Webhook protegido para n8n (`POST /api/crm/birthdays/run-daily`)**: autenticado via `Authorization: Bearer <BIRTHDAY_CRON_SECRET>` com comparação segura em tempo constante e trava de deduplicação anual (nunca duplica envio para o mesmo paciente no mesmo ano, mesmo com servidor + n8n ativos).
- **⚙️ Modal de Automação Diária no CRM (`CRMBirthdayAutomationModal`)**:
  - Acessível diretamente no funil **Aniversariantes** (para perfis administrativos/gerência), com 3 abas: **Configuração e Disparo** (horário, unidade, validade, prévia ao vivo da mensagem, **Simulação Dry-Run** e disparo imediato), **Execuções** (histórico tabular) e **Webhook n8n** (URL, headers e JSON prontos para cópia em 1 clique).

### 📊 Recursos da v1.5.9 — Relatórios Gerenciais do CRM & Carga Histórica de Orçamentos (1 Ano)

- **📊 Dashboard de Relatórios do CRM (`CRMDashboardView` & `src/utils/crmAnalytics.ts`)**:
  - Nova aba **Relatórios** dentro do CRM com alternância instantânea entre **Todos os Funis** e o **funil atual**, sincronizada com os filtros de **data** e **unidade**.
  - **KPIs Executivos & Funil de Conversão**: visualização de leads, valor em pipeline, receita convertida, ticket médio e taxas de conversão entre etapas com gráficos Recharts.
  - **Financeiro de Orçamentos, Motivos de Perda & Gargalos de SLA**: ranking de motivos de perda com impacto financeiro em `R$`, alertas de SLA (>48h) com clique direto para abrir a ficha do lead (`CRMLeadDrawer`) e tabelas comparativas por **unidade**, **dentista** e **origem**.
  - **Exportação Gerencial**: geração de planilha **CSV (PT-BR / Excel)** e impressão formatada em **PDF A4** (`@media print` isolado para o relatório).
- **📥 Carga Histórica de 1 Ano de Orçamentos em Aberto (`OPEN`) do Clinicorp (`CRMEstimatesBackfillModal`, `crmEstimatesBackfill.ts`, `scripts/backfill-clinicorp-estimates.ts` & `POST /api/clinicorp/estimates-backfill-chunk`)**:
  - **Botão no CRM ("Importar Histórico" / "Importar Histórico (1 Ano)")**: disponível no cabeçalho do CRM e diretamente na aba **Orçamentos em Aberto** para administradores e gerência (`admin_root`, `admin`, `admin_clinica`, `admin_tecnico`, `gerente_atendimento`).
  - **Consulta Fatiada & Segura**: divide intervalos de até 366 dias em janelas sequenciais (7, 15 ou 30 dias), filtra estritamente orçamentos `OPEN`, ignora registros já existentes no CRM (por `estimate_id` ou `patient_id + data`), enriquece telefones ausentes via base `public.patients` e grava diretamente no funil **Orçamentos em Aberto** (`budgets`) do Supabase.
  - **Modo Simulação (Dry-Run) + Backup CSV/JSON**: permite conferir quantidades e valores antes de gravar e baixar os arquivos **CSV (Excel)** e **JSON** completos da execução.
  - **Script CLI Oficial**: `npm run crm:backfill-estimates -- --days=365` (com suporte a `--dry-run`, `--clinic=1|2|all`, `--from=YYYY-MM-DD`, `--to=YYYY-MM-DD` e `--chunk=15`), salvando os arquivos em `exports/`.

### 📅 Recursos da v1.5.8 — Filtro por Data no CRM, Gestão de Rótulos & Mensageria Multi-Participante

- **📅 Filtro por Data no CRM com Recálculo de KPIs (`src/utils/crmDateFilter.ts` & `MiniCRMModal`)**:
  - Seletor do campo de data analisado: **Data de Entrada**, **Follow-up**, **Data do Orçamento**, **Última Consulta** e **Agendamento**.
  - Atalhos rápidos de período (**Todo período**, **Hoje**, **7 dias**, **30 dias**, **Este mês**) além de intervalo **Personalizado (De / Até)** com botão de limpeza rápida.
  - Recálculo automático dos **indicadores (KPIs)** no topo do CRM em conjunto com a filtragem em tempo real do **Kanban** e da **Lista**.
  - Correção da ordem dos hooks React no modal do CRM, garantindo abertura estável sem reinicialização de sessão.
- **🏷️ Gestão de Rótulos no CRM (`CRMLabelsManagerModal`, `CRMNotesLabelsModal`, `CRMLeadCard`, `CRMNewOpportunityModal`, `CRMLeadDrawer`)**:
  - Novo modal dedicado **Gerenciar Rótulos** acessível diretamente pelo cabeçalho do CRM (`Rótulos`) e atalho `+ Rótulo` junto à barra de filtros.
  - Botão de etiquetas rápido em cada card do Kanban, criação inline de rótulos ao cadastrar novas oportunidades e vínculo automático de rótulos recém-criados na gaveta do lead.
- **💬 Mensageria Interna Multi-Participante & Atribuição Automática (`InternalMessagingModal`, `messagingService.ts`, `server.ts`)**:
  - Inclusão e remoção funcional de participantes (dentistas + equipe administrativa/recepção) em conversas persistidas no Supabase, com barra de participantes ativos visível no cabeçalho do chat.
  - Atribuição automática de responsável em conversas iniciadas ou respondidas por membros da equipe, substituindo o rótulo ambíguo `"Pendente"` por `"Sem responsável"` quando ainda não há atendente vinculado.

### 🛡️ Recursos da v1.5.7 — Permissão de Atendentes & Agenda Completa da Clínica

- **👩‍💼 Normalização RBAC para Atendentes/Recepcionistas**:
  - Usuários com perfil de atendimento (`receptionist`) passam a visualizar automaticamente **todos os dentistas da unidade** na agenda clínica sem bloqueio por filtro individual de profissional.

### 🚀 Recursos da v1.5.6 — Portal Paciente Teal, CRUD CRM & Orçamentos em Aberto Clinicorp (D-3)

- **💰 Importação de Orçamentos em Aberto do Clinicorp (`D-3`)**: Sincronização automática no CRM de orçamentos `OPEN` e atualização de orçamentos aprovados diretamente da API do Clinicorp.
- **🎨 Portal do Paciente Identidade Teal & Busca por Nome (`LIKE`)**: Novo padrão visual Teal na tela de login do paciente, busca de pacientes otimizada e renderização de modais via React Portals para empilhamento seguro.

### 🔗 Recursos da v1.5.3 — Integração Clinicorp no CRM & Login do Portal do Paciente

- **🔗 Agendamento Bidirecional com Clinicorp no CRM (`CRMQuickScheduleModal` & `/api/clinicorp/*`)**:
  - Leitura ao vivo da agenda do dentista selecionado (`GET /api/clinicorp/dentist-schedule`), exibindo grade de horários livres/ocupados, bloqueios `ASSIGN` (férias, viagens, restrições) e alerta de conflito de horário.
  - Gravação direta no Clinicorp ao confirmar no CRM (`POST /api/clinicorp/schedule-appointment`): localiza ou cadastra o paciente (`/patient/get` → `/patient/create`), resolve a categoria e registra a consulta oficial via `/appointment/create_appointment_by_api`, mantendo opção explícita de contingência local em caso de erro de API.
- **🔐 Tela de Login Segura no Portal do Paciente (`PatientLoginScreen` & `/api/patient/auth/login`)**:
  - Removido qualquer login automático em perfil de demonstração ao acessar `/paciente` ou `/portal` via link externo/QR Code.
  - Autenticação por **Celular (WhatsApp) / CPF + Senha ou Token de Ativação**, aba de **Primeiro Acesso** e validação automática de links de convite com `activation_token`.

### 🎨 Recursos da v1.5.2 — UI/UX Clínica & Central de QR Code para Marketing

- **🎨 Reorganização Completa de UI/UX Clínica (`Header`, `Agenda`, `CRM` e `Modais`)**:
  - Padronização visual 60-30-10 com superfícies limpas (`#F8FAFC` / `#FFFFFF`), bordas sutis (`border-slate-200`), tipografia numérica alinhada (`tabular-nums`) e acento principal único em **`#147A80`**.
  - Cabeçalho reorganizado com ações principais claras na rotina clínica e menu **Gestão** agrupado por contexto.
  - Unificação de todos os modais administrativos, operacionais, CRM e notificações com cabeçalhos limpos e redução de poluição visual (remoção de excesso de cápsulas, emojis em controles e animações decorativas contínuas).
- **📣 Central de QR Code · Folder de Marketing & Totem (`TotemQRCodeModal`)**:
  - Novo modo **Folder Marketing (Pacientes)** em **Gestão → QR Code e Totem**, apontando por padrão para o link oficial `https://bertuolflow.app-bertuol.tech/paciente` (além de presets para `/` ou URL personalizada com UTM).
  - Opções gráficas para impressão: escolha de cor (**Teal Bertuol `#147A80`** ou **Preto Gráfico `#0F172A`**) e opção de **Fundo Transparente**.
  - Exportação direta em **PNG Alta Resolução (1200×1200 px)** e **SVG (Vetor)** para gráficas, Canva e materiais impressos, preservando o modo **Totem de Check-in (Recepção)** com impressão A4.

### 🔄 Recursos da v1.5.1 — CRM Comercial Multi-Funil & Ficha Livre

- **🔀 CRUD Completo de Funis Personalizáveis (`CRMPipelineManagerModal` / `crm_pipelines`)**:
  - Crie, renomeie, reordene, escolha cores/ícones e personalize as etapas de quantos funis precisar além dos padrões (**Recall 6+ Meses**, **Campanhas & Tráfego Pago** e **Orçamentos em Aberto**).
  - Regras por etapa com suporte a colunas de **Ganho (`won`)** e **Perda (`lost`)**.
- **📝 Ficha Livre de Atendimento & Cadastro Rápido 1-Linha (`CRMLeadDrawer` & `CRMNewOpportunityModal`)**:
  - **Cadastro Rápido Inline**: Lance leads de balcão, WhatsApp ou `@instagram` diretamente acima do Kanban em 1 linha (`Nome ou @`, `WhatsApp / Contato`, `Interesse / Anotação livre`, `Unidade`).
  - **Gaveta Deslizante Editável (`CRMLeadDrawer`)**: Clique em qualquer card para editar nome, contato (`WhatsApp` ou `@instagram`), interesse livre, canal de origem, unidade, dentista (`Sem preferência` incluso), prioridade, valor, pontos Clube Sorriso e transferência entre funis.
  - **Campos Livres da Atendente (`+ Campo Livre` / `custom_fields`)**: Adicione atributos dinâmicos como *Melhor Horário*, *Instagram / Rede*, *Convênio / Plano*, *Indicado por*, *Forma de Pagamento*, *Queixa Principal* ou qualquer par personalizado `rótulo + valor`.
- **🏷️ Rótulos Customizados (`crm_labels`) & Notas Cronológicas**:
  - Criação/remoção de etiquetas coloridas e histórico completo de anotações com autor, data e hora sincronizado no Supabase.
- **📅 Agendamento 1-Clique na Agenda Clínica (`CRMQuickScheduleModal`)**:
  - Converta um lead do CRM diretamente em consulta agendada vinculando unidade, profissional, data e horário, movendo o card automaticamente para a etapa de ganho.
- **⏱️ Follow-up, Alertas de SLA & Motivo de Perda (`CRMLostReasonModal`)**:
  - Controle de próxima data de contato (hoje/amanhã/3 dias/7 dias/custom), badges de SLA atrasado e registro estruturado do motivo de perda ao mover ou arrastar o card para perdido.
- **🖱️ Drag & Drop no Kanban**:
  - Arraste e solte cards diretamente entre as colunas do funil com destaque visual e persistência imediata no Supabase (`crm_leads_recall` + trigger n8n 06:00h).

### 🏆 Funcionalidades Consolidadas (v1.5.0)

#### 1. 👑 Nova Central Exclusiva Admin Root de Tutoriais & Lançamento (`/root` | `/tutoriais` | `?app=root`)
- **Interface Principal da Clínica 100% Limpa**: Os botões de apresentação e roteiros foram removidos da área de trabalho da clínica (`/`), garantindo zero distração para dentistas, recepcionistas e gerentes.
- **Painel Restrito ao SuperAdmin Root (`src/routes/(root)/RootLayout.tsx`)**:
  - Protegido por `ProtectedRoute` exclusivo para `admin_root`, acessível em 1 clique pelo botão **`📚 Central Root & Tutoriais`** na barra superior do Root ou diretamente pelas rotas `/root` e `/tutoriais`.
  - **Visualizador Embutido + Abertura em Nova Aba**: Permite abrir dentro do próprio painel (ou em nova janela) todos os 8 módulos de treinamento e implantação:
    1. **Estúdio de Apresentação 60m (Modo Completo 3D)** (`/slideshow-hyperframes.html`)
    2. **Modo Só Telão 3D Limpo (Projetor)** (`/slideshow-hyperframes.html?mode=projector`)
    3. **Modo Só Trilha & Teleprompter (Apresentador)** (`/slideshow-hyperframes.html?mode=presenter`)
    4. **Central de Roteiros HeyGen (3 Vídeos de 2 Min) & Mapa Técnico** (`/roteiros-heygen.html`)
    5. **Central de Ajuda & FAQ da Equipe** (`/faq.html`)
    6. **Folha Oficial do Totem QR Code A4** (`/totem-imprimir`)
    7. **Tutorial do Paciente & Clube Sorriso** (`/tutorial-paciente.html`)
    8. **Manual de Instalação PWA & Notificações Push** (`/manual-instalacao.html`)

#### 2. 🎬 Estúdio de Apresentação 3D & Modo Duas Telas Sincronizadas (`/slideshow-hyperframes.html`)
- **Palco WebGL Three.js + Mockup 3D**:
  - Fundo espacial com **Rede Neural 3D interativa**, **4 Cápsulas de Vidro Fosco Flutuantes (`MeshPhysicalMaterial`)** com bordas luminosas e **celular em perspectiva 3D** que inclina a cada etapa.
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

#### 4. 🔐 Central de Credenciais & Acessos de Clientes (`6.285+ Pacientes`)
- **Carregamento Completo em Lotes (`6.285+ Clientes`)**: Sincronização paginada via `.range()` na tabela `public.patients` do Supabase, trazendo toda a base das unidades **Palmas - TO** e **Paraíso do Tocantins - TO**.
- **Busca Inteligente por Nome & Sobrenome no Topo**: Campo de busca em destaque no topo do modal com normalização automática de acentos, filtro alfabético (`A–Z`), consulta direta em tempo real no Supabase (`ilike`) e envio de credenciais via WhatsApp em 1 clique.

#### 5. 🛡️ Homologação RBAC, Travamento de Unidade & Clube para Dentistas
- **Barra Root Unificada (`👑 MODO SUPERADMIN ROOT`)**: Controle de Escopo de Unidade (`Global / Palmas / Paraíso`), Simulador de Perfis RBAC e atalho **`📚 Central Root & Tutoriais`**.
- **Isolamento Estrito de Unidade**: Perfis de unidade única (`receptionist`, `dentist`, `admin_clinica` local) exibem automaticamente cadeado fixo (`🔒 Palmas - TO` / `🔒 Paraíso - TO`), enquanto `admin_root` e `gerente_atendimento` possuem alternância multi-clínica.
- **Acesso Clube Sorriso para Dentistas**: Botão **Clube Sorriso & Vouchers** habilitado no cabeçalho do perfil `dentist` para consulta de pontos e vouchers dos pacientes.

#### 6. 🎯 Módulo CRM Comercial Multi-Funil (Recall n8n, Campanhas, Orçamentos & Ficha Livre) & Mensageria Interna
- **Varredura Automática n8n (06:00h) + Funis Personalizáveis**: Sincronização direta com `public.crm_leads_recall` no Supabase (180+ dias sem consulta), múltiplos funis com CRUD completo (`crm_pipelines`), etiquetas (`crm_labels`), notas cronológicas, agendamento em 1 clique, drag-and-drop e ficha livre da atendente (`CRMLeadDrawer`).
- **Mensageria Interna Multi-Unidade**: Chat em tempo real entre recepção, dentistas e pacientes com gravação de áudio no navegador, envio de fotos/mídia e contador de mensagens não lidas.

#### 7. 🏢 Gestão Multi-Clínicas (Multi-Tenant)
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
│   │   ├── components/       # Modais e UI (support/SupportCenterView, SupportPrintBooklet, ClientAccountsTab, UserManagementModal, Header, InternalMessagingModal, crm/MiniCRMModal, CRMDashboardView, CRMBirthdayAutomationModal, CRMEstimatesBackfillModal, CRMLabelsManagerModal, CRMLeadDrawer, etc.)
│   │   ├── config/           # Rótulos centralizados de versão (version.ts -> v1.7.0)
│   │   ├── contexts/         # Contexto de Tenant e Filtro de Clínicas (TenantContext)
│   │   ├── data/             # Loader tipado da Central de Suporte (supportKnowledgeBase.ts)
│   │   ├── patient/          # PWA do Paciente e Clube Sorriso Bertuol
│   │   ├── routes/           # Rotas e Guards (RootLayout com Central de Tutoriais, ClinicLayout, ProtectedRoute)
│   │   ├── services/         # DataService, SupabaseService, CRMService, WebAuthn, Messaging
│   │   ├── types/            # Tipagem TypeScript (database.ts, crm.ts, support.ts, Clinic, UserRole, UserPermissions)
│   │   └── utils/            # Scripts SQL, Gerador de Cartilha PDF A4 (supportBookletPdf.ts), Analytics do CRM, Automação de Aniversariantes, Backfill de Orçamentos
├── docs/support-kb/          # Base única versionada de suporte por perfil (meta.json, patient.json, dentist.json, receptionist.json)
├── scripts/
│   ├── backfill-clinicorp-estimates.ts # CLI de carga histórica (1 ano) de orçamentos OPEN do Clinicorp + CSV/JSON
│   └── sync-support-docs.ts            # Automação de detecção de impacto e atualização da Central de Suporte (PR GitHub)
├── server (Node.js Express + TSX Proxy Server)
│   └── server.ts             # APIs REST, Central de Suporte (/api/support/*), Agendador Diário & SSE (/api/clinics, /api/login, /api/crm/birthdays/*, /api/clinicorp/*, Gemini Proxy)
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

-- 2. COLUNAS DE CREDENCIAIS E ACESSO AO APP NA TABELA DE PACIENTES (v1.5.0)
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS app_access_status VARCHAR(40) DEFAULT 'pending_activation',
  ADD COLUMN IF NOT EXISTS activation_token VARCHAR(100),
  ADD COLUMN IF NOT EXISTS activation_token_expires_at TIMESTAMPTZ;

-- 3. CRM COMERCIAL MULTI-FUNIL, RÓTULOS & FICHA LIVRE (v1.5.1)
-- Tabelas: public.crm_pipelines, public.crm_labels e extensões em public.crm_leads_recall
ALTER TABLE public.crm_leads_recall
  ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb;
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
BIRTHDAY_CRON_SECRET=sua_chave_secreta_para_webhook_n8n
```

### 4. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
O servidor de desenvolvimento iniciará em `http://localhost:3000` com o agendador diário de aniversariantes ativo.

### 5. Carga Histórica de Orçamentos em Aberto via CLI (Opcional)
```bash
# Simulação (gera CSV/JSON em exports/ sem gravar no Supabase)
npm run crm:backfill-estimates -- --days=365 --dry-run

# Importação real (grava novos orçamentos OPEN no CRM + gera CSV/JSON em exports/)
npm run crm:backfill-estimates -- --days=365
```

### 6. Automação Diária de Aniversariantes via n8n (Opcional / Redundância)
Configure um nó **Schedule Trigger** diário (ex.: `08:35` em `America/Sao_Paulo`) seguido de um nó **HTTP Request**:
- **Método**: `POST`
- **URL**: `https://bertuolflow.app-bertuol.tech/api/crm/birthdays/run-daily`
- **Header**: `Authorization: Bearer <BIRTHDAY_CRON_SECRET>`
- **Body JSON**: `{"dryRun": false, "clinicScope": "all"}`

---

## 📜 Licença e Propriedade

Desenvolvido para **Bertuol Odontologia Avançada**. Direitos reservados.
- **Versão**: `v1.9.0`
- **Gestão**: Flávio Santiago & Favuca Dias

