# Autenticação Biométrica WebAuthn para Profissionais (Fase 1)

Implementação de acesso rápido e seguro sem digitação de senha via WebAuthn / Passkeys nativas (Face ID, Touch ID, Windows Hello) para dentistas e equipe do Bertuol Flow, com suporte a múltiplos dispositivos e redundância por credenciais convencionais.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Decisões arquiteturais e de UX validadas na Fase 1 de alinhamento com a diretoria:

- **Login Direto sem Digitação de Email (Passkey Discoverable)**: O fluxo de autenticação utilizará *Resident Keys* (`requireResidentKey: true` no registro). O dentista clica diretamente em **"Entrar com Biometria"**, o navegador abre a folha nativa do sistema operacional (Face ID/Touch ID) e localiza a identidade do profissional automaticamente sem forçá-lo a preencher campos de texto antes.
- **Múltiplos Dispositivos com Identificação Visual**: Cada profissional poderá cadastrar múltiplos aparelhos (ex: "iPhone Pessoal - Dr. Favuca", "iPad Consultório 01", "MacBook Recepção"). Cada credencial possuirá nome amigável, data do último acesso e botão para revogação unitária.
- **Fallback Tradicional Garantido**: Computadores sem sensores biométricos continuarão com a opção regular de login por senha e link mágico, sem quebrar o acesso em nenhum posto de trabalho.

---

## 1. Overview & Core Concept

- **O que faz**: Oferece aos dentistas e à equipe clínica uma experiência de login instantânea de 1 toque no celular ou no computador do consultório, utilizando o chip de segurança do aparelho (Secure Enclave no iOS/macOS ou TPM no Windows/Android) através do padrão W3C WebAuthn.
- **Público-Alvo**: Dentistas, cirurgiões, secretárias e administradores das unidades de Palmas e Paraíso do Tocantins.
- **Valor Principal**: Elimina a fricção de digitar senhas repetidas vezes ao longo do dia com luvas ou na correria entre atendimentos, ao mesmo tempo em que eleva a segurança contra ataques de phishing e vazamento de senhas a um patamar bancário.

---

## 2. User Experience & Visual Design

### Fluxos Principais do Usuário

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. FLUXO DE LOGIN BIOMÉTRICO (TELA DE ENTRADA)                              │
│                                                                             │
│ [Tela de Login]                                                             │
│ ┌──────────────────────────────────────────────────────────────┐            │
│ │  Bertuol Odontologia Avançada                                │            │
│ │                                                              │            │
│ │  ┌────────────────────────────────────────────────────────┐  │            │
│ │  │ 🪪  Entrar com Face ID / Biometria                     │  │ (1 Toque)  │
│ │  └────────────────────────────────────────────────────────┘  │            │
│ │                                                              │            │
│ │  ─────────────── ou entre com seus dados ─────────────────   │            │
│ │                                                              │            │
│ │  [ Email ] [ Senha ]  -> [ Entrar ]                          │            │
│ └──────────────────────────────────────────────────────────────┘            │
│                                                                             │
│ 2. FLUXO DE CADASTRO DE DISPOSITIVO (PAINEL DO DENTISTA)                    │
│                                                                             │
│ [Configurações do Perfil > Segurança Biométrica]                            │
│ ┌──────────────────────────────────────────────────────────────┐            │
│ │  Dispositivos Conectados:                                    │            │
│ │  • iPhone 15 Pro (Dr. Favuca) · Adicionado em 14/10/2026 [X] │            │
│ │                                                              │            │
│ │  [+ Cadastrar este Dispositivo / Biometria]                  │            │
│ └──────────────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Identidade Visual & Design System
- **Botão Primário Biométrico**: Destaque visual sofisticado com borda e ícone em Turquesa Institucional Bertuol (`#4BBCBE`), micro-animação de toque e estado de carregamento com spinner refinado.
- **Feedback Sensorial e Tratamento de Erros**:
  - Cancelamento pelo usuário no prompt do sistema: Mensagem suave e discreta ("Autenticação biométrica cancelada. Você pode tentar novamente ou usar senha").
  - Dispositivo sem biometria: Exibição automática e elegante apenas do formulário tradicional de login.
- **Painel de Gestão de Chaves**: Lista limpa de aparelhos cadastrados, sem cápsulas pill poluídas, exibindo o ícone do sistema (Apple, Windows, Android), o apelido customizado e o botão discreto de revogação.

---

## 3. Key Product Decisions & Trade-Offs

- **Uso de `@simplewebauthn/server` e `@simplewebauthn/browser`**:
  - *Abordagem Escolhida*: Utilizar a suíte de bibliotecas padrão da comunidade `@simplewebauthn` recomendada pela FIDO Alliance e W3C.
  - *Por quê*: Implementar o parsing manual de buffers CBOR, assinaturas COSE e atestações de segurança na mão é propenso a falhas criptográficas graves. O `@simplewebauthn` lida com conversões Base64URL e compatibilidade entre navegadores com segurança estrita.
- **Armazenamento de Credenciais**:
  - *Abordagem Escolhida*: Tabela dedicada `webauthn_credentials` com chave estrangeira vinculada ao usuário (`user_id`), guardando `credential_id`, `public_key`, `counter` anti-replay e `device_label`.
  - *Por quê*: Permite múltiplos aparelhos por dentista com rastreabilidade e revogação individual caso um celular seja perdido ou trocado.
- **Sessões e Emissão de Token**:
  - *Abordagem Escolhida*: Após a validação criptográfica do desafio (`assertion`), o servidor gera o token de sessão legítimo correspondente ao perfil do profissional, idêntico ao fluxo de login tradicional, garantindo paridade em todas as telas e permissões.

---

## 4. Technical Architecture & Data Strategy

### Arquitetura de Comunicação e Endpoints

```
┌─────────────────┐                        ┌──────────────────┐                      ┌────────────────────┐
│   Navegador /   │                        │  Servidor Express│                      │  Banco de Dados /  │
│ Dispositivo Web │                        │   (server.ts)    │                      │  Supabase Postgres │
└────────┬────────┘                        └────────┬─────────┘                      └─────────┬──────────┘
         │                                          │                                          │
         │  1. POST /api/auth/webauthn/login/options│                                          │
         │─────────────────────────────────────────>│                                          │
         │                                          │  Gera challenge criptográfico            │
         │  2. Retorna PublicKeyCredentialRequest   │  e salva na sessão temporária            │
         │<─────────────────────────────────────────│                                          │
         │                                          │                                          │
         │  Dispara Biometria Nativa                │                                          │
         │  (navigator.credentials.get)             │                                          │
         │                                          │                                          │
         │  3. POST /api/auth/webauthn/login/verify │                                          │
         │─────────────────────────────────────────>│                                          │
         │     (envia credencial assinada)          │  Busca chave pública da credencial       │
         │                                          │─────────────────────────────────────────>│
         │                                          │<─────────────────────────────────────────│
         │                                          │  Valida assinatura com                   │
         │                                          │  verifyAuthenticationResponse            │
         │                                          │  Atualiza counter anti-replay            │
         │                                          │─────────────────────────────────────────>│
         │  4. Retorna Token JWT e Perfil Logado    │                                          │
         │<─────────────────────────────────────────│                                          │
```

### Endpoints da API a Implementar
1. `GET /api/auth/webauthn/registration-options`: Gera as opções de criação de credencial (`generateRegistrationOptions`) para o profissional autenticado.
2. `POST /api/auth/webauthn/verify-registration`: Valida a assinatura com `verifyRegistrationResponse`, registra o dispositivo com o apelido informado e grava na tabela `webauthn_credentials`.
3. `POST /api/auth/webauthn/authentication-options`: Gera as opções de desafio para login direto sem email (`generateAuthenticationOptions` com `allowCredentials: []`).
4. `POST /api/auth/webauthn/verify-authentication`: Valida o token biométrico com `verifyAuthenticationResponse`, localiza o usuário dono da chave, incrementa o contador e emite o token de acesso.
5. `GET /api/auth/webauthn/devices`: Retorna a lista de dispositivos cadastrados pelo usuário autenticado.
6. `DELETE /api/auth/webauthn/devices/:id`: Revoga a credencial de um dispositivo específico.

### Tabela de Dados (`webauthn_credentials`)
```sql
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    public_key BYTEA NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    device_name TEXT NOT NULL,
    transports TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials(user_id);
```

### Componentes de Interface
1. **`Login.tsx` / Modal de Autenticação**:
   - Detecção prévia de suporte biométrico com `browserSupportsWebAuthn()`.
   - Botão em destaque *"Entrar com Face ID / Biometria"*.
   - Estado de carregamento com tratamento de recusa nativa do usuário.
2. **`WebAuthnDeviceManager.tsx` (Configurações do Dentista)**:
   - Seção no perfil do dentista para cadastrar o aparelho atual.
   - Campo para nomear o aparelho (ex: "Meu iPhone 15").
   - Listagem com data de uso e exclusão segura.
