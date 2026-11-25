import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const VIDEO_DIR = path.resolve('public/videos');

if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

async function recordTutorial() {
  console.log('====================================================');
  console.log('📹 INICIANDO GRAVAÇÃO DO TUTORIAL DE HOMOLOGAÇÃO');
  console.log('====================================================\n');

  console.log('1. Abrindo navegador...');
  const browser = await chromium.launch({
    headless: true, // Executa em background mas grava o canvas do browser perfeitamente
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 1200, // Efeito câmera lenta para o tutorial ficar totalmente legível e didático!
  });

  // Emulação de iPhone 15 Pro com gravação de vídeo ativada
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 390, height: 844 },
    }
  });

  const page = await context.newPage();

  try {
    // -------------------------------------------------------------------------
    // ETAPA 1: Acesso ao PWA
    // -------------------------------------------------------------------------
    console.log('📱 Gravando ETAPA 1: Acesso ao PWA e Boas-vindas...');
    await page.goto(`${BASE_URL}/paciente?phone=63992474826&name=Alice+P%C3%B3voa`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Pausa para leitura do cabeçalho

    // -------------------------------------------------------------------------
    // ETAPA 2: Lembretes Push
    // -------------------------------------------------------------------------
    console.log('🔔 Gravando ETAPA 2: Simulador de Notificação e Lembretes...');
    const btn1Day = page.locator('button:has-text("📅 1 dia antes")');
    await btn1Day.hover();
    await btn1Day.click();
    await page.waitForTimeout(1500); // Exibe o banner Heads-up fixo na tela

    // Fechando com Escape para demonstrar a facilidade de uso do teclado
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------------------
    // ETAPA 3: Confirmação de Consulta
    // -------------------------------------------------------------------------
    console.log('📅 Gravando ETAPA 3: Aba Consultas e Confirmação de Presença...');
    const navConsultas = page.locator('nav button:has-text("Consulta")');
    await navConsultas.hover();
    await navConsultas.click();
    await page.waitForTimeout(1500);

    const confirmBtn = page.locator('button:has-text("Confirmar Minha Presença")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.hover();
      await confirmBtn.click();
      await page.waitForTimeout(2000); // Pausa para exibir a animação de sucesso
    }

    // -------------------------------------------------------------------------
    // ETAPA 4: Check-in presencial no Totem
    // -------------------------------------------------------------------------
    console.log('📍 Gravando ETAPA 4: Check-in por proximidade na Clínica...');
    const navCheckin = page.locator('nav button:has-text("Check-in")');
    await navCheckin.hover();
    await navCheckin.click();
    await page.waitForTimeout(1500);

    const manualCheckinBtn = page.locator('button:has-text("Estou na Recepção de Palmas")');
    if (await manualCheckinBtn.isVisible()) {
      await manualCheckinBtn.hover();
      await manualCheckinBtn.click();
      await page.waitForTimeout(2000);
    }

    // -------------------------------------------------------------------------
    // ETAPA 5: Dashboard Financeiro e Gráficos
    // -------------------------------------------------------------------------
    console.log('📊 Gravando ETAPA 5: Extrato de Pontos & Dashboard de Economia...');
    const navRewards = page.locator('nav button:has-text("Extrato & Prêmios")');
    await navRewards.hover();
    await navRewards.click();
    await page.waitForTimeout(1500);

    const dashboardTabBtn = page.locator('button:has-text("Dashboard Financeiro")');
    if (await dashboardTabBtn.isVisible()) {
      await dashboardTabBtn.hover();
      await dashboardTabBtn.click();
      await page.waitForTimeout(3000); // Tempo para o gráfico animar e ser visualizado
    }

    // Voltar para a aba de Extrato comum
    const extratoTabBtn = page.locator('button:has-text("Extrato")').first();
    await extratoTabBtn.hover();
    await extratoTabBtn.click();
    await page.waitForTimeout(2000);

    // -------------------------------------------------------------------------
    // ETAPA 6: Catálogo de Prêmios e Resgate de Vouchers
    // -------------------------------------------------------------------------
    console.log('🎁 Gravando ETAPA 6: Catálogo de Prêmios...');
    const catalogTabBtn = page.locator('button:has-text("Catálogo")').first();
    await catalogTabBtn.hover();
    await catalogTabBtn.click();
    await page.waitForTimeout(2000);

    const navVouchers = page.locator('nav button:has-text("Vouchers")');
    await navVouchers.hover();
    await navVouchers.click();
    await page.waitForTimeout(2500);

    // -------------------------------------------------------------------------
    // ETAPA 7: Aniversariante e Agendamento do Presente
    // -------------------------------------------------------------------------
    console.log('🎂 Gravando ETAPA 7: Fluxo de Cortesia de Aniversário...');
    // Transiciona para um paciente aniversariante real
    await page.goto(`${BASE_URL}/paciente?name=Angela+Maria+De+Sousa&phone=6392657183`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(2000);

    // Acessa o Extrato de Prêmios
    await page.locator('nav button:has-text("Extrato & Prêmios")').click();
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("Extrato")').first().click();
    await page.waitForTimeout(1500);

    const scheduleBdayBtn = page.locator('button:has-text("Agendar Presente")');
    if (await scheduleBdayBtn.first().isVisible()) {
      console.log('   Encontrou cupom de aniversário ativo. Agendando...');
      await scheduleBdayBtn.first().hover();
      await scheduleBdayBtn.first().click();
      await page.waitForTimeout(1500);

      // Escolhendo data ideal (5 dias úteis à frente)
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 5);
      const dateStr = targetDate.toISOString().split('T')[0];
      await page.fill('input[type="date"]', dateStr);
      await page.waitForTimeout(1000);

      const confirmScheduleBtn = page.locator('button[type="submit"]:has-text("Confirmar no App")');
      await confirmScheduleBtn.hover();
      await confirmScheduleBtn.click();
      await page.waitForTimeout(3000); // Mantém visível para o vídeo capturar o sucesso
    }

  } catch (err) {
    console.error('🚨 Ocorreu um erro durante a gravação:', err);
  } finally {
    // É obrigatório fechar o contexto e navegador para finalizar a escrita do MP4/WebM
    await context.close();
    await browser.close();
  }

  // Descobre o arquivo gravado e renomeia para um nome fácil de acessar
  const files = fs.readdirSync(VIDEO_DIR);
  const videoFile = files.find(f => f.endsWith('.webm') && f !== 'tutorial_pwa_paciente.webm');

  if (videoFile) {
    const oldPath = path.join(VIDEO_DIR, videoFile);
    const newPath = path.join(VIDEO_DIR, 'tutorial_pwa_paciente.webm');
    if (fs.existsSync(newPath)) {
      fs.unlinkSync(newPath); // Remove versão antiga se houver
    }
    fs.renameSync(oldPath, newPath);
    console.log('\n====================================================');
    console.log('✅ GRAVAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('   Arquivo salvo em: public/videos/tutorial_pwa_paciente.webm');
    console.log('====================================================\n');
  } else {
    console.error('⚠️ Nenhum arquivo de vídeo foi encontrado no diretório de saída.');
  }
}

recordTutorial();
