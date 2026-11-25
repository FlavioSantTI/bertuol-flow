# 👑 Guia Prático de Teste & Homologação — PWA do Admin do Clube

> **Sistema:** Bertuol Flow v1.1.0 — Gestão do Clube Sorriso Bertuol  
> **Público-Alvo:** Gestores da Clínica, Administradores do Clube e Equipe da Recepção  
> **Ambiente:** Homologação Integrada (API Clinicorp + Banco de Gamificação + Web Push)  
> **URL Direta do Admin:** `https://ais-pre-azxs3f6wa2xqxtogd4sk3s-21827226279.us-east5.run.app/?app=dentista`

---

## 🎯 Objetivo do Guia

Este documento orienta o passo a passo completo para homologar todas as funcionalidades do **Painel Administrativo do Clube de Vantagens Bertuol (Admin do Clube)**, desde a instalação como PWA (no celular, tablet da recepção ou computador) até o gerenciamento de prêmios, baixa presencial de vouchers, controle de aniversariantes do Clinicorp e auditoria de pontuação.

---

## 🔑 Credenciais & Formas de Acesso

### Opção 1: Acesso com Credenciais de Administrador
- **URL:** `https://ais-pre-azxs3f6wa2xqxtogd4sk3s-21827226279.us-east5.run.app/?app=dentista`
- **Usuário / E-mail:** `favuca.dias@gmail.com`
- **Senha Inicial:** `Bertuol@2026`
- **Perfil / Role:** `admin_root` (Acesso irrestrito a todas as unidades e módulos)

### Opção 2: Acesso Rápido a partir do App do Paciente
1. Acesse o aplicativo do paciente: `https://ais-pre-azxs3f6wa2xqxtogd4sk3s-21827226279.us-east5.run.app/`
2. No cabeçalho superior, toque no botão com ícone de engrenagem / escudo de gestão **👑 Admin do Clube**.
3. O painel administrativo completo será aberto imediatamente em modal responsivo de tela cheia.

---

## 📱 Instalação como PWA (Mobile, Tablet ou Desktop)

O painel é 100% responsivo e otimizado para tablets de recepção (iPad/Android) e computadores de atendimento:

### No iPhone / iPad (Safari):
1. Acesse o link do sistema no Safari.
2. Toque no ícone de **Compartilhar** 📤.
3. Escolha **"Adicionar à Tela de Início"** ➕ e confirme com o nome **"Admin Clube Bertuol"**.
4. Abra pelo ícone nativo gerado na tela inicial.

### No Android / Chrome:
1. Abra no navegador Chrome.
2. Toque nos 3 pontos verticais no canto superior direito.
3. Selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.

### No Desktop (Chrome / Edge / Safari no Mac ou Windows):
1. Clique no ícone de instalação de aplicativo 💻 localizado na barra de endereço do navegador.
2. O sistema abrirá em janela dedicada, sem barras de endereço, funcionando como software nativo.

---

## 📋 Roteiro de Homologação em 7 Módulos

---

### MÓDULO 1: Painel Executivo & Métricas do Clube (Dashboard BI)

1. No topo do painel do Admin, clique na aba **📊 Métricas & BI**.
2. **O que verificar:**
   - **Pontos em Circulação:** Total de pontos acumulados pelos pacientes ativos.
   - **Vouchers Emitidos vs. Baixados:** Quantidade de prêmios resgatados pelos clientes e quantos já foram entregues na recepção.
   - **Taxa de Conversão:** Porcentagem de pacientes que utilizam o Clube ativamente.
   - **Gráfico Mensal:** Curva de concessão de pontos (confirmações + totem) vs. resgates.
3. **Critério de Sucesso:** Os números são atualizados em tempo real conforme ações dos pacientes.

---

### MÓDULO 2: Gestão do Catálogo de Prêmios (CRUD + Upload de Imagens)

1. Clique na aba **🎁 Catálogo de Prêmios**.
2. Clique no botão verde **`+ Novo Prêmio`**.
3. Preencha o formulário com dados de teste:
   - **Título:** *Kit Higiene Interdental Premium*
   - **Pontos Necessários:** `60`
   - **Estoque Disponível:** `15`
   - **Validade do Voucher:** `30 dias`
   - **Descrição:** *Kit com escova interdental, passa-fio e estojo exclusivo Bertuol.*
4. **Teste de Imagem do Prêmio:**
   - Clique em **"Escolher Foto do Computador/Celular"** para enviar uma foto real.
   - Ou clique em **"Galeria Local"** para escolher uma das imagens já salvas no servidor.
5. Clique em **"Salvar Prêmio"**.
6. **Teste de Edição:**
   - Localize o item cadastrado e clique no botão de **Lápis (Editar)**.
   - Altere a pontuação para `55` e clique em **Salvar**.
7. **Teste de Pausa/Ativação:**
   - Clique no switch de ativação do prêmio para desativá-lo temporariamente.
   - Abra a visão do paciente para comprovar que prêmios inativos não aparecem no catálogo.
8. **Critério de Sucesso:** O prêmio aparece imediatamente no catálogo do app do paciente quando ativo.

---

### MÓDULO 3: Regras de Pontuação & Tiers de Fidelidade

1. Clique na aba **⚙️ Regras & Tiers**.
2. **Sub-seção: Regras de Ganho de Pontos:**
   - Verifique a regra *Presença Confirmada*: `+10 pontos`.
   - Verifique a regra *Check-in no Totem da Recepção*: `+20 pontos`.
   - Teste a criação de uma nova regra avulsa (ex: *Indicação de Familiar*: `+50 pontos`).
3. **Sub-seção: Níveis do Clube (Tiers):**
   - Confira os 4 níveis oficiais:
     - 🥉 **Bronze:** 0 a 99 pontos (Multiplicador 1.0x).
     - 🥈 **Prata:** 100 a 249 pontos (Multiplicador 1.15x).
     - 🥇 **Ouro:** 250 a 499 pontos (Multiplicador 1.25x).
     - 💎 **Diamante:** 500+ pontos (Multiplicador 1.5x + Prioridade de Atendimento).
4. **Critério de Sucesso:** Edições nas regras e tiers salvam sem erros e impactam os cálculos de upgrade do paciente.

---

### MÓDULO 4: Gestão de Pacientes & Lançamento Manual de Pontos

1. Clique na aba **👥 Pacientes & Saldos**.
2. No campo de busca, digite o nome de um paciente de teste (ex: `Alice` ou `63992474826`).
3. Observe o cartão do paciente:
   - Saldo atual de pontos.
   - Nível atual (Bronze/Prata/Ouro/Diamante).
   - Histórico resumido de movimentações.
4. **Teste de Crédito Manual:**
   - Clique no botão **`+ Lançar Pontos`**.
   - Defina **Pontos:** `25`.
   - Motivo / Justificativa: *Cortesia de indicação de paciente novo*.
   - Confirme o lançamento.
5. **Verificação no Extrato:**
   - Clique em **"Ver Extrato Completo"** do paciente.
   - O lançamento de `+25 pts` deve constar com data, hora e motivo especificado.
6. **Critério de Sucesso:** O saldo do paciente aumenta imediatamente em 25 pontos e reflete no PWA do paciente.

---

### MÓDULO 5: Auditoria & Baixa Presencial de Vouchers na Recepção

Quando um paciente chega à recepção para retirar um brinde ou usufruir de um serviço resgatado:

1. Clique na aba **🎟️ Vouchers & Validação**.
2. No campo de busca, digite o código do voucher apresentado pelo paciente (ex: `BT-` ou selecione um da lista).
3. **Conferência de Dados na Tela:**
   - Nome do paciente.
   - Prêmio correspondente.
   - Data do resgate e data de expiração.
   - Status atual: `Pendente de Retirada`.
4. **Ação de Baixa Presencial:**
   - Clique no botão verde **`✓ Confirmar Entrega / Dar Baixa`**.
   - Confirme a caixa de diálogo de confirmação.
5. **Critério de Sucesso:**
   - O status do voucher passa para `Resgatado / Utilizado`.
   - Registra o nome do operador da recepção e o carimbo de data/hora.
   - Impede reutilização fraudulenta do mesmo voucher.

---

### MÓDULO 6: Central de Aniversariantes do Clinicorp & Agendamentos

1. Clique na aba **🔔 Notificações & Campanhas**.
2. Selecione a sub-aba **🎂 Aniversariantes do Mês**.
3. **Conferência em Tempo Real com o Clinicorp:**
   - A lista carrega os pacientes aniversariantes oficiais sincronizados via API do Clinicorp (ex: `Angela Maria`, `Francisco José`, etc.).
   - Exibe idade, telefone e data de nascimento.
4. **Disparo de Cortesia Individual:**
   - Escolha um paciente e clique no botão **`🎂 Enviar Parabéns (Push)`**.
   - O sistema envia a notificação nativa para o smartphone do paciente liberando a cortesia.
5. **Disparo em Lote:**
   - Clique no botão superior **`🚀 Disparar para Todos do Mês`**.
   - Acompanhe a barra de progresso do disparo automatizado.
6. **Sub-aba Solicitações de Agendamento:**
   - Clique na sub-aba **📅 Solicitações de Presente**.
   - Veja as solicitações enviadas pelos pacientes pelo botão "Agendar Presente" no app.
   - Visualize a unidade escolhida (ex: *Matriz Palmas*), data preferida e período (Manhã/Tarde).
   - Clique em **"Confirmar na Agenda Clinicorp"**.
7. **Critério de Sucesso:** Aniversariantes recebem a cortesia sem duplicidade e a recepção recebe as solicitações sem necessidade de WhatsApp.

---

### MÓDULO 7: Monitoramento de Web Push & Aparelhos Ativos

1. Na aba **🔔 Notificações & Campanhas**, clique na sub-aba **📱 Aparelhos Conectados**.
2. Veja a relação de telefones e navegadores que autorizaram notificações no aparelho (iPhone Safari, Android Chrome, etc.).
3. **Teste de Push Imediato:**
   - Digite o telefone do aparelho de teste no campo de disparo.
   - Clique em **"Disparar Push de Teste"**.
   - Confira o toque sonoro e a notificação no aparelho do testador em menos de 3 segundos.
4. **Critério de Sucesso:** Confirmação de recebimento com título, ícone oficial Bertuol e abertura no app.

---

## 📊 Matriz de Homologação (Checklist de Aceite)

| Item | Funcionalidade Testada | Critério de Aceite | Status |
| :---: | :--- | :--- | :---: |
| **01** | Instalação PWA do Admin | Abre em tela cheia com ícone oficial na home do dispositivo | [ ] |
| **02** | Login e Segurança RBAC | Apenas usuários autorizados (`admin_root`, `admin_clinica`) acessam | [ ] |
| **03** | Cadastro de Prêmio com Foto | Prêmio salvo com imagem local do servidor e visível ao paciente | [ ] |
| **04** | Edição de Pontos e Estoque | Alterações refletem em tempo real no catálogo do paciente | [ ] |
| **05** | Crédito Manual de Pontos | Saldo creditado e registrado no extrato auditado | [ ] |
| **06** | Baixa Presencial de Voucher | Voucher validado e marcado como utilizado com registro de operador | [ ] |
| **07** | Sincronização Clinicorp | Aniversariantes carregados em tempo real diretamente da API Clinicorp | [ ] |
| **08** | Solicitações de Cortesia | Recepção recebe data/período solicitados pelo paciente no app | [ ] |
| **09** | Envio de Web Push | Lembretes e avisos chegam na tela bloqueada do celular | [ ] |
| **10** | Isolamento de Dados | Pacientes não veem o painel gerencial sem credenciais de staff | [ ] |

---

## 🛠️ Dúvidas Frequentes & Procedimentos Rápidos

### 1. Como projetar o QR Code do Totem para os pacientes lerem na recepção?
- No menu do cabeçalho do sistema, clique em **`📱 Totem QR Code`**.
- O QR Code oficial da clínica correspondente será projetado em tela cheia.
- Os pacientes apontam a câmera pelo PWA e realizam o check-in automático em 1 segundo (+20 pontos).

### 2. O que fazer se um paciente informar que trocou de celular?
- Na aba **Pacientes**, localize o cadastro pelo telefone anterior ou nome.
- No botão de edição, atualize o telefone. Todos os pontos, histórico e vouchers resgatados permanecem intactos.

### 3. As fotos dos prêmios dependem de servidores externos?
- Não. O Bertuol Flow possui sistema de upload e armazenamento 100% autônomo no próprio servidor da aplicação, garantindo velocidade instantânea e sem custos adicionais de CDN ou S3.
