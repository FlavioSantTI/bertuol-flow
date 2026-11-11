# 🐙 Como Subir o Bertuol Flow para o GitHub e Portainer

Este guia mostra como subir o código com segurança (sem vazar chaves de API) e publicar a imagem Docker no GitHub Container Registry (`ghcr.io`) ou Docker Hub para deploy direto no Portainer.

---

## 🔒 1. Segurança e Proteção de Chaves

* O arquivo `.gitignore` já está configurado para **nunca subir arquivos `.env` ou `.env.local`**.
* O arquivo `docker-compose.yml` foi preparado para usar variáveis de ambiente (`${VAR_NAME}`) ou ser alimentado pela seção de **Environment variables** do Portainer.
* Todas as chaves e segredos devem ser configurados no seu ambiente de produção (Portainer ou Secrets do GitHub).

---

## 💻 2. Comandos para Subir o Código no GitHub

Abra o seu terminal na raiz do projeto e execute:

```bash
# 1. Inicializar o repositório git (se ainda não iniciado)
git init

# 2. Adicionar os arquivos (o .gitignore protegerá seus segredos)
git add .

# 3. Criar o commit
git commit -m "feat: release Bertuol Flow com Dockerfile, PWA e Traefik"

# 4. Renomear para a branch principal
git branch -M main

# 5. Adicionar o repositório remoto do seu GitHub
git remote add origin https://github.com/SEU_USUARIO/bertuol-flow.git

# 6. Enviar o código para o GitHub
git push -u origin main
```

---

## 🐳 3. Como Construir e Subir a Imagem Docker

### Opção A: Automático via GitHub Actions (Recomendado)
Já incluímos o arquivo `.github/workflows/docker-publish.yml`. Ao fazer `git push`, o GitHub irá automaticamente:
1. Construir a imagem Docker otimizada.
2. Publicar no **GitHub Packages** (`ghcr.io/seu_usuario/bertuol-flow:latest`).

### Opção B: Manual via Terminal (Local ou Servidor)

```bash
# 1. Login no GitHub Container Registry (use um Personal Access Token com permissão de package:write)
echo $GITHUB_TOKEN | docker login ghcr.io -u SEU_USUARIO --password-stdin

# 2. Construir a imagem Docker
docker build -t ghcr.io/SEU_USUARIO/bertuol-flow:latest .

# 3. Enviar a imagem para o GitHub
docker push ghcr.io/SEU_USUARIO/bertuol-flow:latest
```

---

## 🚀 4. Como Usar a Imagem do GitHub no Portainer

No seu Portainer, basta usar a imagem `ghcr.io/SEU_USUARIO/bertuol-flow:latest`:

```yaml
version: "3.7"

services:
  bertuol_flow:
    image: ghcr.io/SEU_USUARIO/bertuol-flow:latest
    restart: always

    networks:
      - BertuolNet

    environment:
      - NODE_ENV=production
      - PORT=3000
      - WAHA_API_URL=https://go.app-bertuol.tech
      - WAHA_API_KEY=seu_token_waha_api
      - WAHA_SESSION=Atendimento
      - WAHA_DASHBOARD_USERNAME=admin
      - WAHA_DASHBOARD_PASSWORD=sua_senha_dashboard
      - EVOLUTION_API_URL=https://go.app-bertuol.tech
      - GLOBAL_API_KEY=seu_token_waha_api
      - EVOLUTION_INSTANCE_NAME=Atendimento
      - CLINICORP_API_URL=https://api.clinicorp.com/rest/v1
      - CLINICORP_USER=seu_usuario_clinicorp
      - CLINICORP_KEY=sua_chave_clinicorp
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
