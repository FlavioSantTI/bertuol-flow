# 🦷 Bertuol Flow

<div align="center">

![Bertuol Flow Version](https://img.shields.io/badge/version-1.0.0-0D9488?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Production%20Ready-059669?style=for-the-badge)
![License](https://img.shields.io/badge/license-Proprietary-slate?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Ready-4BBCBE?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge)

**Sistema de Gestão Inteligente de Atendimentos Clínicos, Agenda Cronológica, Resumos com IA e Notificações Push & WhatsApp**

*Desenvolvido exclusivamente para a **Bertuol Odontologia Avançada**.*

</div>

---

## 📌 Visão Geral do Projeto

O **Bertuol Flow** é uma plataforma clínica web/PWA de alto desempenho desenvolvida para transformar a rotina dos profissionais da odontologia, recepcionistas e gestores da rede **Bertuol Odontologia Avançada**. 

O sistema integra-se de forma nativa e segura ao **Clinicorp API**, ao banco de dados **Supabase** e à infraestrutura de mensageria **Evolution GO (WhatsApp Gateway)**, permitindo:
- Visualização cronológica rápida de pacientes do dia por profissional e por unidade física.
- Resumos clínicos inteligentes pré-atendimento com orientações de procedimentos e alertas de saúde.
- Notificações instantâneas de chegada/check-in de pacientes na recepção (Push celular e WhatsApp).
- Gestão de acessos hierárquica baseada em perfis (**Admin Root**, **Admin Clínica**, **Dentista**, **Recepção**, **Gerente**).

---

## 🚀 Funcionalidades Principais (v1.0.0)

### 🩺 1. Visão do Profissional / Dentista
* **Timeline Cronológica do Dia:** Lista limpa de horários, procedimentos agendados, convênios e histórico do paciente.
* **Resumo Clínico Executivo:** Síntese rápida dos dados do prontuário, alertas de alergias (látex, antibióticos) e recomendações para o procedimento.
* **Briefing Diário:** Modal executivo com estatísticas da jornada diária, distribuição de procedimentos e avisos importantes.
* **Alertas no Consultório:** Notificações sonoras e visuais em tempo real quando o paciente dá entrada na recepção.

### 🛎️ 2. Módulo de Recepção & Check-in
* **Check-in Instantâneo com 1 Clique:** Marcação de chegada do paciente no consultório.
* **Disparo Automático de Alertas:** Notifica imediatamente o aparelho do dentista responsável via Push e WhatsApp da clínica.
* **Isolamento de Unidade (LGPD):** Operadores de recepção visualizam e operam estritamente sobre a sua respectiva clínica física.

### 🏢 3. Arquitetura Multi-Tenant & Multi-Clínicas
* **Unidades Atendidas:** Palmas (Matriz), Paraíso do Tocantins e Araguaína.
* **Troca Ágil de Unidade:** Gestores corporativos e profissionais que atendem em mais de uma clínica podem alternar o contexto de atendimento com 1 clique.
* **Sincronização em Lote Clinicorp:** Importação e mapeamento de categorias de procedimentos, cores institucionais e profissionais cadastrados.

### 👑 4. Gestão de Usuários & Controle de Acesso (RBAC)
* **Perfis Hierárquicos:**
  * `Admin Root`: Visão corporativa irrestrita de todas as unidades, configurações técnicas e segurança.
  * `Admin Clínica`: Gestor local com autonomia para cadastrar e gerenciar profissionais e recepcionistas da sua unidade.
  * `Gerente de Atendimento`: Monitoramento global de fluxo e tempos de espera.
  * `Dentista`: Acesso à sua própria agenda e notificações.
  * `Recepção`: Gestão de fluxo de recepção e check-in.
* **Pré-Cadastro em Lote:** Importação de profissionais cadastrados no Clinicorp com geração de links de convite e senhas temporárias via WhatsApp.
* **Primeiro Acesso Seguro:** Redefinição obrigatória de senha e suporte a links mágicos com credenciais encriptadas.

### 📱 5. PWA (Progressive Web App) & Mobile-First
* **Instalação Nativa:** Suporte completo a instalação em dispositivos Android, iPhone e iPad (iOS Safari).
* **Service Worker com Cache Inteligente:** Carregamento ultra-rápido mesmo em conexões oscilantes.
* **Notificações Push com Vibração e Áudio:** Alertas configuráveis de acordo com a preferência de cada profissional.
* **Manual de Instalação Integrado:** Guia de instalação interativo disponível em `/manual-instalacao.html` para auxiliar os profissionais na instalação passo a passo, otimizado para celulares e pronto para salvar em PDF.
* **Convites Inteligentes:** Disparo de links pelo WhatsApp com redirecionamento de setup padrão para `https://bertuolflow.app-bertuol.tech/` de ponta a ponta.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Interface reativa, modular e de altíssimo desempenho |
| **Estilização** | Tailwind CSS + Plus Jakarta Sans | Design System exclusivo baseado no manual da marca Bertuol |
| **Backend & Proxy** | Node.js + Express + TSX | Servidor de proxy seguro para rotas REST e orquestração de webhooks |
| **Banco de Dados** | Supabase (PostgreSQL) | Armazenamento relacional, controle de sessões e perfis de usuários |
| **Integração Clínica** | Clinicorp REST API | Sincronização oficial de agendas, categorias e profissionais |
| **WhatsApp Gateway**| Evolution GO API | Disparo de mensagens transacionais, links de convite e alertas |
| **Infraestrutura** | Docker + Traefik + Portainer | Containerização multi-stage e SSL automático Let's Encrypt |

---

## 🎨 Identidade Visual e Paleta de Cores

* **Turquesa Primário Bertuol:** `#4BBCBE` (RGB: `75, 188, 194` | CMYK: `C71 M11 Y33 K0`)
* **Amarelo Dourado Bertuol:** `#FFCC29` (RGB: `255, 204, 41`)
* **Fundo Suave Clínico:** `#F4F7F8`
* **Divisores & Bordas:** `#E2E6E7`
* **Tipografia:** *Plus Jakarta Sans*

---

## ⚙️ Variáveis de Ambiente (`.env`)

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Servidor & Execução
PORT=3000
NODE_ENV=production

# Integração Clinicorp
CLINICORP_API_URL="https://api.clinicorp.com/rest/v1"
CLINICORP_USER="seu_usuario_clinicorp"
CLINICORP_KEY="sua_chave_clinicorp"

# Banco de Dados Supabase
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua_chave_anon_supabase"

# WhatsApp Gateway (Evolution GO)
EVOLUTION_API_URL="https://go.app-bertuol.tech"
GLOBAL_API_KEY="sua_chave_global_evolution"
EVOLUTION_INSTANCE_NAME="atendimento-palmas"
```

---

## 📦 Como Executar o Projeto Localmente

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev

# 3. Gerar a build de produção
npm run build

# 4. Iniciar em modo produção
npm start
```

---

## 🐳 Deploy no Portainer com Traefik

Para implantar no **Portainer**, utilize a Stack abaixo configurada para a rede `BertuolNet` e domínio `bertuolflow.app-bertuol.tech`:

```yaml
version: "3.7"

services:
  bertuol_flow:
    image: bertuolflow:latest
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    networks:
      - BertuolNet
    environment:
      - NODE_ENV=production
      - PORT=3000
      - EVOLUTION_API_URL=${EVOLUTION_API_URL}
      - GLOBAL_API_KEY=${GLOBAL_API_KEY}
      - EVOLUTION_INSTANCE_NAME=${EVOLUTION_INSTANCE_NAME}
      - CLINICORP_API_URL=${CLINICORP_API_URL}
      - CLINICORP_USER=${CLINICORP_USER}
      - CLINICORP_KEY=${CLINICORP_KEY}
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - traefik.enable=true
        - traefik.http.routers.bertuol_flow.rule=Host(`bertuolflow.app-bertuol.tech`)
        - traefik.http.routers.bertuol_flow.entrypoints=websecure
        - traefik.http.routers.bertuol_flow.tls.certresolver=letsencryptresolver
        - traefik.http.routers.bertuol_flow.service=bertuol_flow
        - traefik.http.services.bertuol_flow.loadbalancer.server.port=3000
        - traefik.http.services.bertuol_flow.loadbalancer.passHostHeader=true

networks:
  BertuolNet:
    external: true
    name: BertuolNet
```

---

## 📄 Licença

Software proprietário. Todos os direitos reservados à **Bertuol Odontologia Avançada**.
