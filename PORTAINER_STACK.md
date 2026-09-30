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

      ## 🟢 Evolution GO (WhatsApp API Integrada)
      - EVOLUTION_API_URL=https://go.app-bertuol.tech
      - GLOBAL_API_KEY=5b273097198071e4861fcad05316383b
      - EVOLUTION_INSTANCE_NAME=atendimento-palmas

      ## 🦷 Clinicorp API
      - CLINICORP_API_URL=https://api.clinicorp.com/rest/v1
      - CLINICORP_USER=qsparaisoto
      - CLINICORP_KEY=f77112ec-f697-4e2e-8966-f18f8826d4c6

      ## 🗄️ Supabase Database
      - VITE_SUPABASE_URL=https://sswbkfrpxboxmjvunhzt.supabase.co
      - VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzd2JrZnJweGJveG1qdnVuaHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4Nzc5OTcsImV4cCI6MjA5MDQ1Mzk5N30.-z9guq5XL6274zDsgMGWvXQ2XKHH-ZvwsN70sLjnfNA

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
