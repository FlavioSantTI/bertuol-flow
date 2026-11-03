# 🎯 Tutorial Completo de Uso — Mini-CRM Bertuol (v1.3.0)

> **Guia prático para Recepção, Gerentes de Atendimento, Dentistas e Administradores sobre como operar o Mini-CRM, recuperar pacientes inativos, gerenciar múltiplos funis (Pipelines) e disparar mensagens inteligentes no WhatsApp.**

---

## 📌 1. Visão Geral: O que é o Mini-CRM Bertuol?

O **Mini-CRM Bertuol** ([`MiniCRMModal.tsx`](src/components/crm/MiniCRMModal.tsx)) é a central de relacionamento comercial, reativação preventiva e acompanhamento de orçamentos integrada diretamente à agenda da clínica e ao **Clube Sorriso Bertuol**.

Ele está dividido em **4 pilares (abas)** principais:
1. **🔄 Recall Preventivo (6+m):** Identifica automaticamente pacientes sem consulta há mais de 180 dias e oferece bônus de pontos no Clube Sorriso para agendamento de retorno.
2. **🗂️ Pipeline & Oportunidades (Kanban + Lista):** Quadro visual com múltiplos funis personalizáveis (ex: *Funil Principal*, *Funil de Orçamentos & Implantes*, *Alinhadores*).
3. **💬 Modelos de Mensagens:** Biblioteca de scripts persuasivos com variáveis automáticas (`{nome}`, `{doutor}`, `{clinica}`, `{pontos}`).
4. **📊 Métricas de Conversão:** Painel executivo com receita convertida no mês, taxa de agendamento e desempenho por unidade (Palmas, Paraíso, Araguaína).

---

## 🚀 2. Como Acessar o Mini-CRM

1. Faça login no painel da clínica (`/app`) com perfil **Recepção**, **Gerente**, **Dentista** ou **Admin/Root**.
2. No cabeçalho superior ([`Header.tsx`](src/components/Header.tsx)), clique no botão **Mini-CRM**.
3. No topo do modal, você verá imediatamente os **4 indicadores rápidos**:
   - **Leads Ativos**: Total de oportunidades em negociação ou contato.
   - **Recall 6+ Meses**: Pacientes que precisam de retorno preventivo.
   - **Agendados**: Pacientes que já marcaram horário na agenda.
   - **Convertidos (Mês)**: Quantidade de fechamentos e soma em `R$` dos tratamentos convertidos.

---

## 🔄 3. Aba 1 — Recall Preventivo (6+ Meses)

### Como executar a varredura automática de pacientes inativos:
1. Clique no botão amarelo **"Varredura Recall 6+ Meses"** (no canto superior direito) ou em **"Executar Nova Varredura"** dentro da aba *Recall Preventivo*.
2. O sistema ([`CRMService.syncAutomaticRecalls`](src/services/crmService.ts)) cruza a lista de pacientes com o histórico de consultas:
   - Todo paciente cuja última visita ocorreu há **mais de 180 dias** (e que ainda não esteja ativo no CRM) é adicionado automaticamente como uma oportunidade de **Alta Prioridade**, com bônus sugerido de **+50 pontos** no Clube Sorriso.
3. Para acionar o paciente:
   - Clique no botão verde **"WhatsApp"** no card do paciente.
   - O modal de **Contato Rápido** abrirá com a mensagem de Recall já preenchida com o nome do paciente, nome do dentista, unidade e pontos bônus.

---

## 🗂️ 4. Aba 2 — Pipeline & Oportunidades (Quadro Kanban)

### 4.1. Alternar entre Funis (Pipelines)
Na barra superior da aba **Pipeline & Oportunidades**, você encontra os botões de **Funil Ativo**:
- **Funil Principal (Recall & WhatsApp):** Para captação diária, retorno preventivo e dúvidas gerais.
- **Funil de Orçamentos & Implantes:** Para tratamentos estéticos, reabilitações, alinhadores e planos de maior valor.
- Clique em qualquer funil para visualizar apenas as colunas e oportunidades daquele fluxo.

### 4.2. Cadastrar um Novo Lead / Oportunidade Manualmente
1. Clique no botão verde **"+ Novo Lead"** no topo do Mini-CRM.
2. No modal ([`CRMNewOpportunityModal.tsx`](src/components/crm/CRMNewOpportunityModal.tsx)):
   - Escolha o **Funil (Pipeline)** e a **Etapa Inicial** onde o paciente entrará.
   - Preencha **Nome do Paciente** e **WhatsApp/Celular** (com DDD, ex: `63999887766`).
   - Selecione a **Unidade**, **Tipo de Oportunidade** (*Lead WhatsApp*, *Recall 6+m*, *Orçamento Pendente*, *Indicação*), **Dentista Responsável** e **Prioridade**.
   - Informe o **Tratamento/Interesse**, **Valor Estimado (R$)** e **Bônus Clube Sorriso (Pts)**.
3. Clique em **"Criar Oportunidade"**.

### 4.3. Mover um Paciente de Etapa (Coluna)
- Em qualquer card (no modo Kanban ou Lista), utilize o **seletor de etapa** no rodapé do card para mudar o status do paciente (ex: de *🆕 Novos Leads* para *💬 Em Contato*, *📅 Agendado* ou *✅ Convertido*).
- Quando movido para uma etapa com comportamento **Convertido / Ganho**, o valor estimado em `R$` passa a somar automaticamente no faturamento convertido do mês!

---

## ⚙️ 5. Como Criar, Editar e Excluir Funis e Etapas (CRUD Completo)

Você pode personalizar 100% dos funis e colunas da clínica:

1. Clique no botão **"Gerenciar Funis"** (no topo escuro do Mini-CRM) ou em **"Configurar Funis e Etapas"** dentro da aba Kanban (ou ainda no card pontilhado **"+ Nova Etapa / Coluna"** ao final das colunas).
2. O **Gerenciador de Funis & Etapas** ([`CRMPipelineManagerModal.tsx`](src/components/crm/CRMPipelineManagerModal.tsx)) será aberto:

### A) Gerenciar Funis (Coluna da Esquerda)
- **Criar Novo Funil:** Clique em **"+ Novo Funil"**, digite o nome (ex: *Funil de Alinhadores Invisíveis*) e uma descrição opcional. Ele copiará a estrutura base de etapas para você começar rápido.
- **Renomear Funil:** Selecione o funil e clique em **"Renomear Funil"** no painel da direita.
- **Definir como Padrão:** Clique no ícone de estrela (**⭐**) no card do funil para torná-lo o funil principal da clínica.
- **Excluir Funil:** Clique no ícone de lixeira (**🗑️**). Caso existam pacientes naquele funil, o sistema transfere todos automaticamente para o funil padrão para que nenhum lead seja perdido.

### B) Gerenciar Etapas / Colunas do Kanban (Painel da Direita)
- **Adicionar Nova Etapa:**
  1. Digite o **Nome da Coluna / Etapa** (ex: *Aguardando Raio-X*, *Proposta Enviada*).
  2. Escolha o **Comportamento no Funil**:
     - `🔵 Em Aberto / Negociação`: Contabiliza como Lead Ativo.
     - `📅 Agendado na Agenda`: Contabiliza nos indicadores de Agendados.
     - `✅ Ganho / Convertido (R$)`: Contabiliza como venda fechada e soma o valor na Receita do Mês.
     - `❌ Perdido / Arquivado`: Finaliza o ciclo sem somar receita.
  3. Escolha a **Cor da Coluna** (Azul, Âmbar, Índigo, Teal Bertuol, Roxo, Verde, Rosa ou Cinza) e o **Ícone**.
  4. Clique em **"+ Adicionar Etapa"**.
- **Editar Etapa Existente:** Clique em **"Editar"** na linha da etapa, ajuste nome/cor/ícone/comportamento e clique em **"Atualizar Etapa"**.
- **Reordenar Colunas:** Use os botões de seta (**↑** / **↓**) ao lado de cada etapa para alterar a ordem em que as colunas aparecem da esquerda para a direita no Kanban.
- **Excluir Etapa:** Clique na lixeira (**🗑️**) da etapa. Os pacientes que estavam nela serão movidos em segurança para a primeira coluna do funil.

---

## 💬 6. Disparo Rápido no WhatsApp e Modelos de Mensagens

### Disparo em 1 Clique ([`CRMQuickContactModal.tsx`](src/components/crm/CRMQuickContactModal.tsx))
1. Ao clicar em **"WhatsApp"** em qualquer card, o sistema seleciona automaticamente o modelo ideal de acordo com o tipo de oportunidade (*Recall*, *Orçamento* ou *Boas-Vindas*).
2. As variáveis são trocadas automaticamente pelos dados reais do paciente:
   - `{nome}` → Nome do paciente
   - `{doutor}` → Nome do dentista responsável
   - `{clinica}` → Nome da unidade (ex: *Clínica Bertuol (Palmas)*)
   - `{pontos}` → Quantidade de pontos bônus oferecidos
3. Você pode editar o texto livremente antes de enviar, copiar ou clicar em **"Abrir e Disparar no WhatsApp"**.
4. **Automação Inteligente:** Se o paciente estava na etapa inicial (`new`), assim que você dispara o WhatsApp, o sistema move o card automaticamente para **Em Contato (`contacted`)** e registra a data do último contato!

### Criar ou Editar Modelos (Aba 3 — Modelos de Mensagens)
- Acesse a aba **"Modelos de Mensagens"** para criar novos scripts de atendimento (ex: *Campanha Mês das Mães*, *Pós-Operatório Implante*).
- Clique nos botões `+ {nome}`, `+ {doutor}`, `+ {clinica}`, `+ {pontos}` para inserir as variáveis dinâmicas com 1 clique.

---

## 📊 7. Boas Práticas Diárias para a Recepção e Comercial

1. **Início do Expediente (08h00):**
   - Abrir o Mini-CRM e clicar em **"Varredura Recall 6+ Meses"**.
   - Disparar convites no WhatsApp para os pacientes de **Alta Prioridade**.
2. **Meio do Expediente (11h00 e 16h00):**
   - Abrir o **Funil de Orçamentos & Implantes** e fazer follow-up com pacientes na coluna *Em Negociação* ou *Orçamento Apresentado*.
3. **Final do Dia (18h00):**
   - Atualizar a etapa dos pacientes que confirmaram horário para **📅 Agendado** e dos que iniciaram tratamento para **✅ Convertido**.
   - Conferir a aba **Métricas de Conversão** para acompanhar a meta mensal de receita recuperada por unidade.
