# 📱 Guia Prático de Teste & Homologação — PWA do Paciente no iOS (iPhone)

> **Ambiente:** Bertuol Flow v1.1.0  
> **Dispositivo:** Apple iPhone (iOS Safari / PWA Standalone)  
> **URL Direta do PWA do Paciente:** `https://ais-pre-azxs3f6wa2xqxtogd4sk3s-21827226279.us-east5.run.app/paciente` (ou pelo ambiente dev)

---

## 🚀 Sim, o PWA está 100% Gerado e Configurado!

O PWA foi gerado com todas as diretrizes da Apple e dos padrões W3C:
- **`manifest-paciente.json`**: Nome "Clube Sorriso Bertuol", tema `#147A80`, display `standalone`.
- **`apple-touch-icon.png`**: Ícone nativo de alta resolução para a tela de início do iOS.
- **Service Worker (`sw-push.js` e `sw.js`)**: Cache inteligente offline e recepção de Web Push nativo no iPhone (iOS 16.4+).
- **Entrada Independente**: Rota `/paciente` isolada da agenda interna dos dentistas.

---

## 📋 Roteiro de Teste Passo a Passo

### Etapa 1: Instalação do PWA no iPhone (Safari)

1. No seu iPhone, abra o **Safari** (o PWA no iOS precisa ser instalado via Safari).
2. Acesse a URL do paciente:
   ```
   https://ais-pre-azxs3f6wa2xqxtogd4sk3s-21827226279.us-east5.run.app/paciente
   ```
3. Na barra inferior do Safari, toque no botão de **Compartilhar** 📤 (o quadrado com uma seta para cima).
4. Role a lista para baixo e toque em **"Adicionar à Tela de Início"** ➕.
5. Confirme o nome (ex: *Clube Bertuol*) e toque em **"Adicionar"** no canto superior direito.
6. **Pronto!** O ícone oficial do Bertuol Flow aparecerá na tela do seu iPhone como um aplicativo nativo.

---

### Etapa 2: Abertura Nativa & Ativação de Notificações Push

1. Toque no ícone do **Clube Bertuol** na tela de início do iPhone (ele abrirá em tela cheia, sem barra de navegação do Safari).
2. No topo da tela, você verá o banner escuro: **"Ativar Notificações no Celular"**.
3. Toque em **"Ativar Agora"**.
4. O iOS exibirá o popup nativo: *"Deseja que 'Clube Bertuol' envie notificações?"*.
5. Toque em **"Permitir"**.
6. O status mudará imediatamente para **"Ativo no Celular"** com badge verde.

---

### Etapa 3: Teste do Lembrete de Consulta (Disparos Imediatos)

1. Na barra superior de atalhos rápidos ou no botão **Sino 🔔**, você verá os botões de simulação:
   - Toque em **`📅 1 dia antes`**: Receba o lembrete de 24h na tela bloqueada do iPhone.
   - Toque em **`⏰ 2h antes`**: Receba o alerta de consulta em 2 horas.
   - Toque em **`🎂 Aniversário`**: Receba a notificação festiva de aniversário com a Cortesia Sky Câmera.
2. Bloqueie o iPhone para ver a notificação na tela de bloqueio, ou deslize para baixo a Central de Notificações do iOS.

---

### Etapa 4: Confirmação de Consulta com 1 Clique (+10 Pontos)

1. Na aba **Consulta** (primeira aba inferior):
   - Visualize os dados da consulta (Dr. Claudio Borba ou Dra. Ariane Bertuol, horário, procedimentos).
2. Toque no botão grande azul: **"Confirmar Minha Presença (+10 pts)"**.
3. **Resultado Imediato:**
   - O botão se transforma no badge verde **"✓ Presença Confirmada"**.
   - Notificação no app: *"+10 pontos adicionados ao Clube Sorriso"*.
   - O saldo de pontos sobe instantaneamente na barra superior.

---

### Etapa 5: Check-in de Presença na Recepção (+20 Pontos)

1. No computador ou tablet da recepção, abra a agenda do Bertuol Flow e clique em **"Totem Balcão"** (ou use o botão "Ver Totem" no próprio app para testes).
2. No seu iPhone, toque na segunda aba: **"Check-in"**.
3. Toque em:
   - **"📸 Abrir Câmera do Celular (Tirar Foto do Totem)"** para usar a lente nativa do iOS; **OU**
   - **"🎥 Escanear com Câmera ao Vivo no Navegador"** (autorize a permissão da câmera); **OU**
   - Toque em **"Estou na Recepção de Palmas (+20 pts)"** para simulação rápida com 1 toque.
4. **Resultado Imediato:**
   - O app exibe: *"Check-in Realizado com Sucesso!"* com o horário registrado.
   - Você ganha **+20 pontos**.
   - No painel da clínica/dentista, o paciente muda para o status **"Presente na Recepção"**!

---

### Etapa 6: Resgate de Prêmios & Vouchers (Clube Sorriso)

1. Toque na terceira aba: **"Extrato & Prêmios"**.
2. Veja as 3 sub-abas:
   - **📊 Dashboard:** Gráfico com evolução mensal de pontos e metas do mês.
   - **📜 Extrato:** Histórico completo com os +10 pts da confirmação e +20 pts do check-in.
   - **🎁 Prêmios:** Catálogo de brindes (ex: Escova Curaprox, Kit Clareador, Fio Dental).
3. Toque em **"Resgatar"** em um dos brindes disponíveis.
4. Confirme no popup de resgate.
5. **Resultado Imediato:**
   - O app gera o voucher com código amigável (ex: `BT-4892`) e QR Code.
   - O voucher vai automaticamente para a quarta aba: **"Vouchers"**, pronto para ser apresentado à recepcionista na saída!

---

### Etapa 7: Cortesia de Aniversário (100% no App, Sem WhatsApp)

1. Se o paciente for aniversariante de hoje (ou ao clicar no teste de aniversário):
   - Surge o banner dourado: **"🎁 Cortesia Exclusiva de Aniversário • Fora do Clube (0 Pontos)"**.
2. Toque em **"Agendar Meu Presente no App"**.
3. Escolha a unidade (Palmas, Paraíso ou Araguaína), a data desejada e o período (Manhã ou Tarde).
4. Toque em **"Confirmar no App"**.
5. O agendamento é registrado internamente com confirmação imediata!
