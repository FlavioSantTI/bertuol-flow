# 📐 Plano de Arquitetura & Separação do PWA do Paciente

> **Escopo:** Isolamento de Arquivos, Tipos, Serviços e Permissões (Roles) do PWA do Paciente  
> **Sistema:** Bertuol Flow v1.1.0  
> **Status:** Executado & Homologado com Sucesso (100% dos componentes e rotas isolados)

---

## 🎯 1. Objetivos da Separação

1. **Desacoplamento Completo:** Separar totalmente a interface do paciente (`PWA Cliente`) dos módulos internos corporativos (`Agenda do Dentista`, `Recepção`, `Gestão de Usuários` e `Multi-Clínicas`).
2. **Segurança & LGPD:** Garantir que o perfil do paciente (`UserRole: 'paciente'`) acesse estritamente seus próprios dados, agendamentos, pontos e vouchers.
3. **Desempenho & PWA Leve:** Permitir que o PWA do paciente seja carregado com bundle otimizado, sem carregar código de administração interna.

---

## 📁 2. Estrutura de Arquivos Proposta (`/src/patient/`)

Organização modular dentro do diretório `/src/patient/`:

```
src/
├── patient/                           # 🟢 Módulo Isolado do PWA do Paciente
│   ├── components/                    # Componentes visuais exclusivos do paciente
│   │   ├── PatientHeader.tsx          # Topbar com identificação e nível de fidelidade
│   │   ├── AppointmentCard.tsx        # Card da próxima consulta e botão de confirmação
│   │   ├── CheckinScanner.tsx         # Leitor de QR Code para validação no Totem
│   │   ├── RewardsCatalog.tsx         # Catálogo de brindes e resgates
│   │   ├── VouchersDrawer.tsx         # Carteira de vouchers ativos
│   │   ├── BirthdayGiftModal.tsx      # Modal de agendamento de cortesia de aniversário
│   │   └── NotificationsDrawer.tsx    # Central de notificações In-App do paciente
│   │
│   ├── services/                      # Serviços de API exclusivos do paciente
│   │   ├── patientApiService.ts       # Chamadas às rotas /api/patient/*
│   │   ├── pushSubscription.ts        # Gestão de Service Worker e VAPID Keys
│   │   └── qrScannerService.ts        # Leitura da câmera e decodificação de QR Code
│   │
│   ├── types/                         # Tipagem TypeScript do paciente
│   │   └── patientTypes.ts            # PatientProfile, PatientVoucher, PointTransaction
│   │
│   ├── hooks/                         # Custom Hooks para reatividade
│   │   ├── usePatientProfile.ts       # Hook de saldo de pontos, nível e histórico
│   │   ├── useWebPush.ts              # Hook de status e inscrição Web Push
│   │   └── useTotemScanner.ts         # Hook de controle da câmera para check-in
│   │
│   └── PatientApp.tsx                 # Entrypoint principal da interface PWA
```

---

## 👤 3. Definição do Perfil de Usuário & Role (`paciente`)

### A. Papel no Sistema
- **`UserRole`**: `'paciente'` (Perfil externo de cliente).
- **Mecanismo de Autenticação**:
  - Identificação primária por **Número de Telefone Celular** (`MobilePhone`).
  - Autenticação via **Token / Link Mágico via WhatsApp** ou **Código OTP por SMS/Push**.
  - Não exige memorização de senhas complexas corporativas.

### B. Tabela de Permissões (`PatientPermissions`)

| Permissão | Status | Descrição |
| :--- | :---: | :--- |
| `canViewOwnAppointments` | `true` | Visualizar apenas suas próprias consultas agendadas |
| `canConfirmAppointment` | `true` | Confirmar presença com 1 clique (+10 pts) |
| `canPerformCheckIn` | `true` | Escanear QR Code no Totem da recepção (+20 pts) |
| `canRedeemRewards` | `true` | Resgatar brindes do Clube Sorriso Bertuol |
| `canScheduleBirthdayGift` | `true` | Agendar cortesia de aniversário no app |
| `canAccessInternalAgenda` | `false` | **Bloqueado:** Sem acesso a agendas corporativas |
| `canAccessOtherPatients` | `false` | **Bloqueado:** Sem acesso a dados de outros pacientes |
| `canAccessConfig` | `false` | **Bloqueado:** Sem acesso a configurações médicas/administrativas |

---

## 🔗 4. Endpoints de API Isolados (`/api/patient/*`)

Todas as rotas do paciente no backend (`server.ts`) usam o prefixo `/api/patient/`:

| Rota HTTP | Método | Descrição |
| :--- | :---: | :--- |
| `/api/patient/profile` | `GET` | Consulta saldo de pontos, nível de fidelidade e vouchers ativos |
| `/api/patient/confirm-appointment` | `POST` | Confirma presença na próxima consulta e credita +10 pts |
| `/api/patient/checkin-totem` | `POST` | Valida QR Code do Totem, registra chegada e credita +20 pts |
| `/api/patient/rewards` | `GET` | Lista o catálogo de brindes e vantagens disponíveis |
| `/api/patient/redeem-reward` | `POST` | Processa o resgate de um prêmio e gera o voucher com QR Code |
| `/api/patient/schedule-birthday-gift` | `POST` | Registra a solicitação de agendamento do presente de aniversário |
| `/api/patient/notifications` | `GET` | Consulta histórico de avisos recebidos no aplicativo |

---

## 🚀 5. Benefícios da Arquitetura Proposta

1. **Manutenção Simplificada:** Alterações na experiência do paciente não impactam a rotina dos dentistas e recepcionistas.
2. **Carregamento PWA Ultra-Rápido:** O paciente baixa estritamente os componentes necessários para sua navegação.
3. **Compliance LGPD:** Barreiras claras de acesso impedem que requisições do paciente acessem dados confidenciais da clínica.

---

*Documentação de Planejamento de Arquitetura — Bertuol Flow v1.1.0*
