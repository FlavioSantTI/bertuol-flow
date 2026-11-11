# 🚀 Deploy do Bertuol Flow no Portainer

Este arquivo contém o modelo de **Docker Compose / Stack** pronto para implantação no **Portainer** (Docker Swarm ou Standalone) integrado com o **Traefik**, **Evolution GO** e **Clinicorp**.

---

## 🌐 Informações de Domínio e Rede
* **Domínio:** `bertuolflow.app-bertuol.tech`
* **Rede Interna:** `BertuolNet` (já existente no seu Docker)
* **Certificado SSL:** Automático via Let's Encrypt (`letsencryptresolver`)

---

## 📋 Docker Compose para colar no Portainer (Web Editor)

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
      ## 🚀 Servidor & Ambiente
      - NODE_ENV=production
      - PORT=3000

      ## 🟢 WAHA / Evolution Gateway (WhatsApp API Conectada)
      - WAHA_API_URL=https://go.app-bertuol.tech
      - WAHA_API_KEY=seu_token_waha_api
      - WAHA_SESSION=Atendimento
      - WAHA_DASHBOARD_USERNAME=admin
      - WAHA_DASHBOARD_PASSWORD=sua_senha_dashboard
      - EVOLUTION_API_URL=https://go.app-bertuol.tech
      - GLOBAL_API_KEY=seu_token_waha_api
      - EVOLUTION_INSTANCE_NAME=Atendimento

      ## 🦷 Clinicorp API
      - CLINICORP_API_URL=https://api.clinicorp.com/rest/v1
      - CLINICORP_USER=seu_usuario_clinicorp
      - CLINICORP_KEY=sua_chave_clinicorp

      ## 🗄️ Supabase Database
      - VITE_SUPABASE_URL=https://sua_instancia.supabase.co
      - VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase

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

## 🛠️ Passo a Passo no Portainer:

1. Acesse o seu painel do **Portainer** (`https://portainer.seu-dominio.com`).
2. No menu lateral, clique em **Stacks** > **+ Add stack**.
3. Dê o nome para a Stack: `bertuol-flow`.
4. Cole o conteúdo YAML acima no **Web editor**.
5. Clique em **Deploy the stack**.
6. Aguarde alguns segundos enquanto o Traefik gera o certificado SSL gratuito e o container inicia.
7. Acesse: `https://bertuolflow.app-bertuol.tech`.
