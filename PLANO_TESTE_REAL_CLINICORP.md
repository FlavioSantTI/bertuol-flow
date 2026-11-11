# 📋 Plano de Transição para Dados Reais do Clinicorp & Roteiro do Grande Teste
**Bertuol Odontologia Avançada • Sistema Bertuol Flow**  
*Data de Criação: 02 de Outubro de 2026*  
*Versão do Documento: 1.0 (Oficial)*

---

## 🎯 1. Sumário Executivo & Diagnóstico Atual

O objetivo deste documento é planejar a **remoção total dos dados simulados (mocks)** do sistema Bertuol Flow e orientar a execução de um **Grande Teste de Homologação em Ambiente Real**, consumindo diretamente a **API Oficial do Clinicorp** das unidades **Matriz Palmas** e **Paraíso do Tocantins**.

### 🔍 Resultado da Auditoria ao Vivo da API do Clinicorp
Em validação técnica executada via proxy backend com a API oficial do Clinicorp (`https://api.clinicorp.com/rest/v1`):

| Componente | Status na API Oficial | Dados Reais Validados | Ação Necessária |
| :--- | :---: | :--- | :--- |
| **Profissionais / Dentistas** | **100% Real** | **8 profissionais ativos** retornados pelo Clinicorp: Dr. Ari Bertuol, Dra. Ariane C. Bertuol, Dr. Claudio Borba, Dra. Anna Aliny Dourado, Dra. Cristina Silveira, Dra. Muryel Castro, Dra. Andressa Marinho e Avaliador Bertuol. | Remover array de mock estático `INITIAL_DENTISTS`. |
| **Categorias de Procedimento** | **100% Real** | **12 categorias oficiais** com cores originais: *Cirurgia (#e1bee7), Consulta (#b2dfdb), Periódico (#bbdefb), Retorno (#bcaaa4), Avaliação (#fff9c4), 2 Fase Implante (#ffc0cb), Checkup (#00ffff), etc.* | Utilizar exclusivamente as categorias recebidas da API. |
| **Agendamentos do Dia** | **100% Real** | **19 consultas reais** mapeadas para o dia de hoje (ex: pacientes reais *Waldaires Bezerra Cruz, Marileia Caetana Xavier Alves, Odair Doniseti, Maria Creuza dos Santos de Souza*, etc.), registradas por secretárias reais (*Samara, Kaillany*). | Desativar o array `INITIAL_APPOINTMENTS` de consultas fictícias. |
| **Pacientes & Contatos** | **100% Real** | Nomes completos, telefones celulares e notas clínicas provenientes dos prontuários do Clinicorp. | Substituir a lista estática de pacientes de teste pelo formulário de busca por Telefone/CPF. |
| **Check-in no Totem (Recepção)** | **Híbrido** | Funcionava tanto com pacientes simulados quanto com qualquer número. | Amarrar a validação do totem às consultas do dia do Clinicorp. |

---

## 🗺️ 2. As 4 Fases da Transição (Mocks ➔ 100% Real)

```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  FASE 1: Limpeza Geral │ ───► │ FASE 2: Live Sync Puro │ ───► │ FASE 3: O Grande Teste │ ───► │  FASE 4: Validação     │
│  Remover Mocks & Cache │      │  Clinicorp Real-Time   │      │ 5 Cenários Clínicos    │      │  Emissão & Totem Real  │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

---

### 🧹 FASE 1: Limpeza & Desativação Definitiva dos Mocks
1. **Eliminar `INITIAL_APPOINTMENTS`:**
   * O sistema passará a renderizar **estritamente** o que existir no endpoint `/api/clinicorp/appointments`.
   * Caso um dentista não possua agendamentos marcados no Clinicorp em determinada data, a interface exibirá o estado vazio elegante: *"Nenhum agendamento marcado no Clinicorp para este profissional nesta data"*.
2. **Atualização da Barra de Pacientes de Teste no App do Paciente:**
   * Substituir os pacientes de mentira fixos por um campo de busca direto:
     - Digitação do **Telefone Celular** ou **CPF** do paciente real.
     - Ou seleção rápida entre os **pacientes agendados hoje no Clinicorp** para facilitar os testes da equipe.
3. **Higienização de Cache Local (LocalStorage):**
   * Script automático que limpa chaves de agendamentos e pacientes antigos cacheados no navegador, mantendo apenas credenciais de login e permissões.

---

### ⚡ FASE 2: Sincronização em Tempo Real (Clinicorp Live Sync)
1. **Suporte Multi-Unidade Oficial:**
   * Ao selecionar **Matriz Palmas** (BusinessId: `5053762760081408`), as requisições utilizam o usuário `qspalmasto`.
   * Ao selecionar **Unidade Paraíso** (BusinessId: `5053762760081409`), as requisições utilizam o usuário `qsparaisoto`.
2. **Auto-Refresh Inteligente (60 segundos):**
   * A cada 60 segundos (ou ao clicar no botão de recarregar), o backend consulta o Clinicorp para sincronizar novos encaixes, remarcações ou desmarcações feitas pela recepção no software de balcão.
3. **Mapeamento de Status do Clinicorp:**
   * Leitura dos status reais do Clinicorp (`Agendado`, `Confirmado`, `Na Sala de Espera`, `Em Atendimento`, `Atendido`, `Faltou`) e tradução para os cards visuais do Bertuol Flow.

---

### 📋 FASE 3: Roteiro do "Grande Teste Real" (5 Cenários de Ponta a Ponta)

Este roteiro deve ser seguido passo a passo durante a sessão de testes da equipe:

#### 🔹 Cenário 1: Visualização da Agenda Real pelo Dentista
* **Ação:** O Dr. Claudio Borba ou a Dra. Ariane Bertuol realizam login com suas contas.
* **O que verificar:**
  - A agenda exibe exatamente os pacientes reais marcados no Clinicorp para o dia selecionado.
  - Horários de início e fim (`fromTime` e `toTime`) batem milimetricamente com o Clinicorp.
  - Procedimentos e notas clínicas aparecem com as tags de cores oficiais (*ex: Cirurgia em lilás, Avaliação em amarelo*).

#### 🔹 Cenário 2: Validação de Presença no Totem da Recepção com Bertuol Bot
* **Ação:** Um paciente real marcado para hoje (ex: *Waldaires* ou *Odair*) acessa o portal do paciente pelo celular e valida o check-in no totem via QR Code ou toque na unidade.
* **O que verificar:**
  - O sistema reconhece a consulta real do paciente no Clinicorp.
  - O **Bertuol Bot** (com as bordas douradas e antena piscando) surge imediatamente no computador da recepção e do consultório com a notificação:
    `Bertuol Bot • Check-in na Recepção • O paciente [Nome Real] aguarda atendimento!`
  - O sinal sonoro suave toca no consultório avisando o dentista sem ruído de campainha incômoda.

#### 🔹 Cenário 3: Pontuação Real no Clube Sorriso Bertuol
* **Ação:** No momento da validação do check-in presencial no horário correto, o sistema processa a regra de pontualidade.
* **O que verificar:**
  - O paciente recebe **+20 pontos** creditados na sua carteira virtual.
  - O saldo é salvo no banco de dados e persistido para as próximas visitas.
  - A barra de progresso avança em direção ao próximo nível (Bronze ➔ Prata ➔ Ouro ➔ Diamante).

#### 🔹 Cenário 4: Resgate & Baixa de Voucher Físico na Recepção
* **Ação:** O paciente utiliza seus pontos para resgatar um brinde no catálogo (ex: *Escova de Dentes Curaprox Bertuol* ou *Kit Clareamento*).
* **O que verificar:**
  - O celular do paciente gera o voucher com código de segurança (ex: `BT-8491`) e QR Code.
  - A recepcionista abre a janela de **Vouchers & Prêmios**, digita o código `BT-8491` e clica em **Dar Baixa**.
  - O brinde é entregue em mãos, o voucher é marcado como **"Utilizado"** e o estoque no Admin é reduzido em 1 unidade.

#### 🔹 Cenário 5: Trava de Segurança do WhatsApp (Sandbox vs. Produção)
* **Ação:** Simular o envio de lembretes e confirmações de presença.
* **O que verificar:**
  - Garantir que a trava `SANDBOX_DISPATCH = true` esteja ativada durante a primeira rodada de testes para que **nenhum WhatsApp seja enviado por engano a pacientes reais** até a aprovação final da diretoria.
  - Verificar no painel de auditoria o log do texto que seria enviado e para qual número.

---

## 🛡️ 4. Segurança, LGPD & Salvaguardas do Clinicorp

1. **Modo Read-Only (Apenas Leitura no Clinicorp):**
   * O sistema Bertuol Flow realiza apenas operações `HTTP GET` nos endpoints do Clinicorp.
   * **Nenhum agendamento, prontuário ou histórico do paciente é apagado ou sobrescrito dentro do Clinicorp.** A integridade do software original é 100% preservada.
2. **Isolamento de Alertas:**
   * Os alertas sonoros e o visual animado do **Bertuol Bot** operam em rede interna da clínica, mantendo o ambiente calmo e profissional.
3. **Auditoria Geral:**
   * Todas as ações de login, check-in e resgates de brindes ficam gravadas no Relatório de Auditoria e Implantação.

---

## ✅ 5. Checklist Prático de Execução

- [ ] **Passo 1:** Substituir `INITIAL_APPOINTMENTS` estáticos pela busca viva `/api/clinicorp/appointments`.
- [ ] **Passo 2:** Atualizar a aba de testes do paciente para buscar consultas reais por telefone ou CPF.
- [ ] **Passo 3:** Confirmar o credenciamento das credenciais de Palmas (`qspalmasto`) e Paraíso (`qsparaisoto`).
- [ ] **Passo 4:** Rodar o teste assistido com 1 dentista e 1 paciente real agendado hoje.
- [ ] **Passo 5:** Validar a aparição do **Bertuol Bot dourado** no computador do consultório.
- [ ] **Passo 6:** Homologar o resgate e baixa de voucher na recepção.
- [ ] **Passo 7:** Habilitar o envio oficial de mensagens de WhatsApp após o aval da diretoria.

---

*Arquivo salvo para consulta no repositório: `PLANO_TESTE_REAL_CLINICORP.md`*
