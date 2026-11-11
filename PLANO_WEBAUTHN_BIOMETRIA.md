# 🔒 Plano de Implementação: Autenticação Biométrica com WebAuthn

Este documento descreve a arquitetura, o fluxo de experiência do usuário (UX) e o roteiro detalhado (TO-DO) para a implementação da camada de autenticação biométrica nativa (WebAuthn API - Face ID, Touch ID, Windows Hello) no ecossistema **Bertuol Flow**.

Conforme direcionamento estratégico, **a primeira etapa de implementação será totalmente focada nos profissionais (Dentistas, Secretárias e Administradores)**, garantindo agilidade e segurança interna no acesso ao painel clínico. **A segunda etapa contemplará os pacientes** no PWA e no totem de check-in.

---

## 🧠 Como Funciona o WebAuthn? (Conceito Geral)

A API de **Web Authentication (WebAuthn)** é um padrão global da W3C suportado nativamente por todos os navegadores modernos (Safari, Chrome, Edge, Firefox) em dispositivos móveis e desktops. Ela permite que aplicações web se autentiquem de forma extremamente segura utilizando o hardware do próprio dispositivo (leitores de impressão digital, reconhecimento facial, ou chaves físicas de segurança) sem que nenhuma senha trafegue pela rede.

### 🛡️ Segurança Criptográfica de Chave Pública
O WebAuthn utiliza **criptografia de chave pública** assimétrica:
1. **Registro:** O dispositivo do usuário gera um par de chaves exclusivo para o domínio da aplicação (`bertuolflow.app-bertuol.tech`). A **chave pública** é enviada ao servidor e salva no banco de dados. A **chave privada** fica permanentemente trancada no chip de segurança física do aparelho (Secure Enclave no iOS/macOS ou TPM no Windows/Android) e só pode ser acessada após a biometria com sucesso.
2. **Autenticação:** O servidor gera um desafio único (challenge). O navegador solicita a biometria do usuário. Ao validar, o chip assina o desafio com a chave privada e envia a assinatura digital de volta. O servidor valida a assinatura com a chave pública guardada e autoriza o login.

---

## 👥 Fluxos de Autenticação Propostos

### 🦷 1. Para Profissionais (Dentistas e Equipe) — 🚀 Fase 1 (Prioridade Máxima)
Os dentistas precisam visualizar sua agenda e timeline cronológica dezenas de vezes ao dia, frequentemente pelo celular. Digitar senhas complexas ou aguardar links mágicos toda hora no consultório drena produtividade.

* **Fluxo de Registro (Vínculo):**
  1. O profissional acessa o sistema normalmente pela primeira vez usando sua senha padrão ou link mágico enviado pelo WhatsApp.
  2. No cabeçalho ou nas configurações de perfil, um banner sugere: *"🔒 Deseja acessar com um clique? Ativar Biometria (FaceID / TouchID)"*.
  3. Ao clicar, o navegador exibe a folha nativa do sistema operacional (ex: *"Deseja permitir que Bertuol Flow use o Face ID?"*).
  4. O usuário confirma com sua biometria. A chave pública gerada é enviada e salva no perfil do usuário no banco de dados.
* **Fluxo de Login de Altíssima Velocidade:**
  1. Na tela de login principal do aplicativo, ao lado do campo de senha, haverá o botão **`Entrar com Biometria 👤`**.
  2. Ao clicar, o navegador aciona instantaneamente o Face ID/Touch ID.
  3. Sendo autenticado com sucesso, a sessão do profissional é iniciada instantaneamente no navegador e ele é direcionado diretamente para a sua timeline diária.

---

### 🎁 2. Para Pacientes — 📱 Fase 2
Os pacientes utilizam o PWA móvel do Clube Sorriso e realizam o check-in presencial no Totem da recepção.

* **No Dispositivo do Paciente (PWA Próprio):**
  * **Registro:** Ao preencher seu cadastro ou primeiro acesso via código enviado pelo WhatsApp, um convite oferece: *"Ative a biometria para resgatar seus prêmios e agendar mais rápido"*.
  * **Uso Diário:** O paciente abre o PWA e faz login instantaneamente com sua biometria para acompanhar o extrato de pontos, vouchers acumulados e metas de fidelidade, sem necessidade de logins repetitivos.
* **No Totem de Check-in Presencial (Tablet Compartilhado):**
  * *Atenção de Segurança:* Por se tratar de um tablet público e compartilhado na recepção, o totem **nunca** armazena biometrias ou credenciais locais no navegador do totem (isso violaria a LGPD).
  * **O Fluxo Seguro de Check-in:**
    1. O paciente chega à recepção e digita apenas as iniciais ou seu CPF/Telefone no totem.
    2. O totem exibe um **QR Code Dinâmico e Temporário** na tela.
    3. O paciente aponta a câmera do seu celular (com o PWA instalado) para o QR Code.
    4. O celular do paciente solicita a **sua biometria local** via WebAuthn.
    5. Uma vez confirmado biometricamente no próprio aparelho dele, o servidor sinaliza o totem e o check-in é confirmado na hora, notificando o painel e o WhatsApp do dentista automaticamente.

---

## 📋 TO-DO List: Cronograma de Implementação

Aqui está o planejamento estruturado em ordem sequencial de execução:

### 🟩 PARTE 1: IMPLEMENTAÇÃO PARA PROFISSIONAIS (✅ CONCLUÍDA)

#### [x] 1. Configuração do Backend e Banco de Dados (Supabase & Persistência Local)
* [x] **Criação da tabela de credenciais WebAuthn:** Modelada em `SUPABASE_DDL_SCRIPT` (`webauthn_credentials`) e persistência em `webauthn_credentials.json` para alta resiliência e disponibilidade imediata.
  * *Campos:* `id` (credential ID Base64URL), `user_id` (ID do profissional), `public_key` (Base64URL do Uint8Array), `counter` (int - contador anti-replay), `device_name` (text - ex: 'iPhone de Dr. Favuca'), `device_type`, `created_at`, `last_used_at`.
* [x] **Instalação das bibliotecas no projeto:** `@simplewebauthn/server` no backend Express e `@simplewebauthn/browser` no frontend React.

#### [x] 2. Rota de Registro de Biometria (Professional Register)
* [x] Endpoint `POST /api/auth/webauthn/register/options` implementado com suporte a Resident Key (Passkeys) e challenge criptográfico com TTL de 5 minutos.
* [x] Endpoint `POST /api/auth/webauthn/register/verify` implementado com validação matemática de atestação FIDO2 e salvamento da chave pública associada ao dentista/administrador.

#### [x] 3. Rota de Login Biométrico (Professional Login)
* [x] Endpoint `POST /api/auth/webauthn/login/options` implementado com suporte a descoberta direta de credencial (login de 1 toque sem exigir digitação prévia de e-mail).
* [x] Endpoint `POST /api/auth/webauthn/login/verify` implementado com verificação de assinatura digital, atualização do contador anti-replay, auditoria no log de acessos (`access_logs`) e emissão da sessão completa do profissional.

#### [x] 4. Interface do Usuário (UI/UX) para Profissionais
* [x] **No Painel do Profissional (`WebAuthnModal.tsx` & `Header.tsx`):**
  * [x] Modal dedicado acessível no Header desktop e mobile com ícone de impressão digital (`Fingerprint`).
  * [x] Formulário de ativação biométrica para o aparelho atual com sugestão de apelido inteligente baseada no dispositivo.
  * [x] Listagem com múltiplos dispositivos cadastrados, data de criação, último acesso e botão de revogação unitária.
* [x] **Na Tela de Login Principal (`LoginScreen.tsx`):**
  * [x] Botão primário elegante **`Entrar com Face ID / Biometria`** com feedback de 1 toque e micro-animação.
  * [x] Separador limpo com fallback automático e instantâneo para formulário tradicional de login (e-mail e senha).
  * [x] Tratamento amigável de recusa ou cancelamento de biometria nativa.

---

### 🟨 PARTE 2: IMPLEMENTAÇÃO PARA PACIENTES (FASE POSTERIOR)

#### [ ] 5. Registro de Biometria no Portal do Paciente (`PatientApp.tsx`)
* [ ] Criar banner de indução no dashboard do paciente convidando para cadastro biométrico.
* [ ] Integrar chamadas frontend para autenticar o paciente no PWA usando a mesma infraestrutura desenvolvida na Parte 1.

#### [ ] 6. Fluxo de Totem Seguro via QR Code
* [ ] Implementar geração de QR Code seguro (com validade de 60 segundos) na tela do Totem para check-in sem contato.
* [ ] Desenvolver scanner de QR Code no PWA do paciente.
* [ ] Ligar a leitura do código à validação biométrica local do aparelho do paciente, efetuando o check-in remoto e seguro no painel da recepção em tempo real.

---

## 🛠️ Tecnologias e Dependências Sugeridas

Para quando for dada a autorização de início de codificação:
* **Frontend:** Nativamente suportado por navegadores via `navigator.credentials.create` e `navigator.credentials.get`. Pode-se usar a biblioteca utilitária leve `@simplewebauthn/browser` para padronizar e facilitar o parse de payloads Base64url.
* **Backend:** `@simplewebauthn/server` para validação matemática de assinaturas, attestation e assertion.
* **Banco de Dados:** Postgres nativo no Supabase para salvar credenciais em tabelas estruturadas.

---

*Planejamento elaborado e pronto para execução. Para iniciar o desenvolvimento do fluxo para profissionais, basta dar o sinal verde.*
