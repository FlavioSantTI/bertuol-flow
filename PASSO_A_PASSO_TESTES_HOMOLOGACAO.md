# 🧪 Guia Passo a Passo de Testes para Homologação — Bertuol Flow

> **Ambiente:** Homologação com Dados Reais (Clinicorp REST API & Supabase)  
> **Objetivo:** Roteiro prático para validação completa dos fluxos administrativos e da jornada do paciente (da instalação PWA ao Check-in na clínica).

---

## 📋 Sumário
1. [👑 PARTE 1: Teste como Administrador do Clube](#-parte-1-teste-como-administrador-do-clube)
   - [Passo 1.1: Abertura do Painel Administrativo](#passo-11-abertura-do-painel-administrativo)
   - [Passo 1.2: Gerenciamento do Catálogo de Prêmios (CRUD)](#passo-12-gerenciamento-do-catálogo-de-prêmios-crud)
   - [Passo 1.3: Configuração de Regras de Pontuação & Tiers](#passo-13-configuração-de-regras-de-pontuação--tiers)
   - [Passo 1.4: Lançamento Manual de Pontos para Pacientes](#passo-14-lançamento-manual-de-pontos-para-pacientes)
   - [Passo 1.5: Envio e Teste de Notificações Push](#passo-15-envio-e-teste-de-notificações-push)
2. [📱 PARTE 2: Teste como Paciente (Da Instalação ao Check-in)](#-parte-2-teste-como-paciente-da-instalação-ao-check-in)
   - [Passo 2.1: Acesso e Instalação PWA no Celular](#passo-21-acesso-e-instalação-pwa-no-celular)
   - [Passo 2.2: Ativação das Notificações Push Nativas](#passo-22-ativação-das-notificações-push-nativas)
   - [Passo 2.3: Consulta de Agenda, Prontuário e Dashboard IA](#passo-23-consulta-de-agenda-prontuário-e-dashboard-ia)
   - [Passo 2.4: Resgate de Vouchers e Cortesia de Aniversário](#passo-24-resgate-de-vouchers-e-cortesia-de-aniversário)
   - [Passo 2.5: Realização de Check-in Digital no Totem da Clínica](#passo-25-realização-de-check-in-digital-no-totem-da-clínica)

---

## 👑 PARTE 1: Teste como Administrador do Clube

Nesta etapa, você validará a área de gestão do **Clube de Vantagens Bertuol**, responsável por configurar regras de fidelidade, lançar pontos e disparar avisos clínicos.

### Passo 1.1: Abertura do Painel Administrativo
1. Acesse o sistema e certifique-se de estar no Portal da Clínica ou na barra superior do aplicativo.
2. Clique no botão amarelo **`👑 Gestão do Clube`** (ou acesse via modal de Administração).
3. O painel global do **Admin do Clube Sorriso** será aberto em tela cheia com abas de controle.

### Passo 1.2: Gerenciamento do Catálogo de Prêmios (CRUD)
1. No modal do Admin, selecione a sub-aba **🎁 Catálogo de Prêmios**.
2. Clique no botão **`+ Novo Prêmio`**.
3. Preencha os dados do teste:
   - **Título:** *Kit Especial Higiene Ortodôntica*
   - **Pontos Necessários:** `50`
   - **Validade:** `30 dias`
   - **Descrição:** *Kit completo com escova interdental, passador de fio e cera protetora.*
4. Clique em **Salvar Prêmio**.
5. **Validação:** Verifique se o novo prêmio aparece instantaneamente na lista com status **Ativo** e opção de edição/exclusão.

### Passo 1.3: Configuração de Regras de Pontuação & Tiers
1. Selecione a sub-aba **⚙️ Regras & Tiers**.
2. Configure as regras institucionais:
   - **Confirmar Presença na Consulta:** `10 pontos`
   - **Pré-Check-in Digital no Totem:** `20 pontos`
   - **Aniversário do Paciente:** `30 pontos`
3. Ajuste os limites dos Tiers de Fidelidade:
   - 🥉 **Bronze:** 0 a 99 pts
   - 🥈 **Prata:** 100 a 249 pts
   - 🥇 **Ouro:** 250 a 499 pts
   - 💎 **Diamante:** 500+ pts
4. Salve as alterações.

### Passo 1.4: Lançamento Manual de Pontos para Pacientes
1. Acesse a sub-aba **👤 Pacientes & Lançamentos**.
2. No campo de busca, digite o nome ou telefone de um paciente real do Clinicorp (ex: `63981001007` ou nome do paciente de teste).
3. Clique em **`+ Adicionar Lançamento`**.
4. Selecione o tipo: **Crédito (+)**.
5. Digite a quantidade de pontos: `15`.
6. Insira o motivo: *Bônus por pontualidade no atendimento*.
7. Clique em **Confirmar Lançamento**.
8. **Validação:** O extrato do paciente atualizará automaticamente registrando a nova entrada e ajustando o saldo em tempo real.

### Passo 1.5: Envio e Teste de Notificações Push
1. Acesse a sub-aba **🔔 Central de Push & Lembretes**.
2. Na lista de consultas do dia vindas do Clinicorp, escolha um agendamento.
3. Clique em **Disparar Lembrete Push (2 Horas)** ou **Lembrete (1 Dia)**.
4. **Validação do Banner Fixo:** O banner de confirmação aparecerá no topo da tela com suporte à tecla **`ESC`** ou clique no botão **`Sair (Esc)`** para fechar.

---

## 📱 PARTE 2: Teste como Paciente (Da Instalação ao Check-in)

Nesta etapa, você vivenciará a experiência completa do paciente, desde salvar o app no celular até o atendimento presencial no consultório.

### Passo 2.1: Acesso e Instalação PWA no Celular
1. Abra a URL do aplicativo no navegador do smartphone:
   - **Android:** Google Chrome
   - **iOS (iPhone/iPad):** Safari
2. **Instalação no Android:**
   - O aplicativo exibirá o banner **"Instalar Bertuol Flow"**. Clique em **Instalar**.
   - Ou toque no menu de 3 pontos do Chrome ➔ **"Adicionar à Tela Inicial"**.
3. **Instalação no iOS (iPhone):**
   - Toque no botão de **Compartilhar** (ícone do quadrado com seta para cima no Safari).
   - Role para baixo e selecione **"Adicionar à Tela de Início"**.
4. Abra o ícone do **Bertuol Flow** direto na tela inicial do celular. Ele abrirá sem barras de navegador, como um aplicativo nativo.

### Passo 2.2: Ativação das Notificações Push Nativas
1. No topo da tela do aplicativo do paciente, localize o card de notificações Web Push.
2. Clique no botão **`Ativar Notificações no Celular`**.
3. O sistema operacional solicitará permissão. Clique em **Permitir / Autorizar**.
4. Para testar o recebimento com o app minimizado ou fechado:
   - Clique em **`Disparar Notificação de Teste`**.
   - Minimize a janela do navegador ou bloqueie a tela do celular.
   - O alerta chegará com som e vibração clínica diretamente no aparelho.

### Passo 2.3: Consulta de Agenda, Prontuário e Dashboard IA
1. Na aba principal **Minha Consulta**, veja os detalhes do seu agendamento vindo do Clinicorp (Profissional, Horário, Procedimento e Unidade).
2. Toque em **Confirmar Presença (+10 pts)**.
3. Acesse a aba **Extrato & Prêmios** e selecione a sub-aba **📊 Dashboard**.
4. **Validação do Gráfico Recharts:**
   - Visualize o histórico de **Pontos Acumulados vs. Prêmios Resgatados**.
   - Analise a seção **"Metas do Mês"** com a barra de progresso em porcentagem calculando quantos pontos faltam para evoluir para o próximo nível (Prata, Ouro ou Diamante).

### Passo 2.4: Resgate de Vouchers e Cortesia de Aniversário
1. Na aba **Extrato & Prêmios**, selecione a sub-aba **🎁 Catálogo de Prêmios**.
2. Escolha um prêmio disponível para o seu saldo e toque em **Resgatar Prêmio**.
3. O sistema gerará um **Voucher com QR Code** e código de validação (ex: `BERTUOL-VOUCHER-8491`).
4. **Cortesia de Aniversário:** Se for aniversariante no mês (conforme cadastro no Clinicorp), abra o card especial de aniversário e clique em **Agendar Presente** (Profilaxia + Câmera Sky) escolhendo a data e período desejados no aplicativo sem depender de WhatsApp.

### Passo 2.5: Realização de Check-in Digital no Totem da Clínica
1. Ao chegar na recepção da clínica Bertuol:
2. Abra o aplicativo no celular e acesse a aba **📲 Check-in**.
3. Clique em **"Escanear QR Code no Totem"**.
4. A câmera do seu smartphone abrirá. Aponte a câmera para o QR Code exibido na tela acrílica do Totem na recepção.
   *(Para testar no computador, clique no botão top bar `📲 Ver QR Code Totem` para abrir o código de demonstração do totem na tela).*
5. **Confirmação Instantânea:**
   - O aplicativo do paciente exibirá a animação de sucesso: **"Check-in Realizado! +20 Pontos Creditados"**.
   - **Alerta do Consultório:** No computador e celular do dentista responsável na recepção, soarão o sinal sonoro e a notificação instantânea informando que o paciente acabou de dar entrada e aguarda na recepção!

---

## 🛠️ Suporte e Dicas de Teste

- **Teclado:** Pressione a tecla **`ESC`** a qualquer momento para fechar notificações fixas em tela.
- **Ajuda e Dúvidas:** Acesse a Central de Ajuda do app em `/faq.html` ou consulte o manual de instalação em `/manual-instalacao.html`.

*Bertuol Odontologia Avançada • Sistema Bertuol Flow v1.1.0*
