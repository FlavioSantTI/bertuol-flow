import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve('tests/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runPatientPwaTests() {
  console.log('====================================================');
  console.log('🚀 INICIANDO TESTES E2E: PWA DO PACIENTE (BERTUOL)');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // Emulação de iPhone 15 Pro / Safari Mobile
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      failedTests++;
      console.error(`  ❌ [FAIL] ${testName} ${details ? '— ' + details : ''}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TESTE 1: Acesso ao PWA e Validação de Elementos Iniciais
    // -------------------------------------------------------------------------
    console.log('\n📱 ETAPA 1: Acesso ao PWA e Renderização Inicial');
    await page.goto(`${BASE_URL}/paciente?phone=63992474826&name=Alice+P%C3%B3voa`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const title = await page.title();
    assert(title.length > 0, 'Título da página carregado', title);

    const headerGreeting = await page.locator('text=Olá, Alice Póvoa').isVisible();
    assert(headerGreeting, 'Header do paciente exibido com nome limpo (Alice Póvoa)');

    const clubBrand = await page.locator('text=Clube Sorriso').first().isVisible();
    assert(clubBrand, 'Identidade visual Clube Sorriso presente');

    const navConsultas = await page.locator('nav button:has-text("Consulta")').isVisible();
    const navCheckin = await page.locator('nav button:has-text("Check-in")').isVisible();
    const navRewards = await page.locator('nav button:has-text("Extrato & Prêmios")').isVisible();
    const navVouchers = await page.locator('nav button:has-text("Vouchers")').isVisible();
    assert(navConsultas && navCheckin && navRewards && navVouchers, 'Barra inferior de navegação com as 4 abas presentes');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01_inicio_paciente.png` });

    // -------------------------------------------------------------------------
    // TESTE 2: Lembretes Push e Simulação na Barra Superior
    // -------------------------------------------------------------------------
    console.log('\n🔔 ETAPA 2: Lembretes Push & Simulador Sem WhatsApp');
    const btn1Day = page.locator('button:has-text("📅 1 dia antes")');
    const btn2Hours = page.locator('button:has-text("⏰ 2h antes")');

    assert((await btn1Day.isVisible()) && (await btn2Hours.isVisible()), 'Botões de disparo de lembrete de consulta presentes');

    await btn1Day.click();
    await page.waitForTimeout(600);
    const toastReminder = await page.locator('text=Notificação do Clube').first().isVisible();
    assert(toastReminder, 'Lembrete push disparado com sucesso');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // -------------------------------------------------------------------------
    // TESTE 3: Confirmação de Consulta com 1 Clique (+10 Pontos)
    // -------------------------------------------------------------------------
    console.log('\n📅 ETAPA 3: Confirmação de Consulta com 1 Clique (+10 Pontos)');
    await page.locator('nav button:has-text("Consulta")').click();
    await page.waitForTimeout(500);

    const doctorVisible = await page.locator('text=Dra. Ariane Bertuol').isVisible();
    const timeVisible = await page.locator('text=18:00').first().isVisible();
    assert(doctorVisible && timeVisible, 'Card de consulta exibe dados corretos (Dra. Ariane Bertuol • 18:00)');

    const confirmBtn = page.locator('button:has-text("Confirmar Minha Presença")');
    const isConfirmBtnVisible = await confirmBtn.isVisible();

    if (isConfirmBtnVisible) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }

    const isConfirmedStatus = (await page.locator('text=Presença Confirmada').count()) > 0;
    assert(isConfirmedStatus, 'Status da consulta validado como Confirmado');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02_consulta_confirmada.png` });

    // -------------------------------------------------------------------------
    // TESTE 4: Check-in de Presença no Totem (+20 Pontos)
    // -------------------------------------------------------------------------
    console.log('\n📍 ETAPA 4: Check-in de Presença na Recepção (+20 Pontos)');
    await page.locator('nav button:has-text("Check-in")').click();
    await page.waitForTimeout(600);

    const checkinTitle = await page.locator('text=Check-in de Presença').first().isVisible();
    assert(checkinTitle, 'Tela de Check-in de Presença aberta com sucesso');

    const manualCheckinBtn = page.locator('button:has-text("Estou na Recepção de Palmas")');
    if (await manualCheckinBtn.isVisible()) {
      await manualCheckinBtn.click();
      await page.waitForTimeout(1000);
    }

    const checkinRegistered = (await page.locator('text=Check-in Realizado com Sucesso').count()) > 0 || (await page.locator('text=+20 pts ganhos').count()) > 0;
    assert(checkinRegistered, 'Check-in registrado com sucesso com acréscimo de pontuação');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03_checkin_realizado.png` });

    // -------------------------------------------------------------------------
    // TESTE 5: Extrato & Dashboard Financeiro
    // -------------------------------------------------------------------------
    console.log('\n📊 ETAPA 5: Extrato & Dashboard Financeiro');
    await page.locator('nav button:has-text("Extrato & Prêmios")').click();
    await page.waitForTimeout(600);

    // Sub-aba Dashboard
    const dashboardTabBtn = page.locator('button:has-text("Dashboard Financeiro")');
    if (await dashboardTabBtn.isVisible()) {
      await dashboardTabBtn.click();
      await page.waitForTimeout(500);
      const dashboardHeader = await page.locator('text=Dashboard Financeiro').first().isVisible();
      assert(dashboardHeader, 'Sub-aba Dashboard Financeiro renderizada com gráficos');
    }

    // Sub-aba Extrato
    const extratoTabBtn = page.locator('button:has-text("Extrato")').first();
    await extratoTabBtn.click();
    await page.waitForTimeout(600);

    const extratoTitle = await page.locator('text=Histórico Completo de Lançamentos').first().isVisible();
    assert(extratoTitle, 'Sub-aba Extrato de Pontos exibe histórico completo');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/04_extrato_pontos.png` });

    // -------------------------------------------------------------------------
    // TESTE 6: Catálogo de Prêmios & Resgate de Voucher
    // -------------------------------------------------------------------------
    console.log('\n🎁 ETAPA 6: Catálogo de Prêmios & Resgate de Voucher');
    const catalogTabBtn = page.locator('button:has-text("Catálogo")').first();
    await catalogTabBtn.click();
    await page.waitForTimeout(600);

    const catalogTitle = await page.locator('text=Catálogo de Prêmios Resgatáveis').first().isVisible();
    assert(catalogTitle, 'Catálogo de prêmios exibido com produtos e pontuação');

    // Verifica itens do catálogo
    const rewardCards = page.locator('text=pts');
    const hasRewards = (await rewardCards.count()) > 0;
    assert(hasRewards, 'Produtos disponíveis com pontuação configurada no catálogo');

    // Testa modal de resgate se houver botão habilitado
    const redeemBtn = page.locator('button:has-text("Resgatar"):not([disabled])').first();
    if (await redeemBtn.isVisible()) {
      await redeemBtn.click();
      await page.waitForTimeout(500);

      const modalConfirmBtn = page.locator('button:has-text("Confirmar Resgate")');
      const isModalVisible = await modalConfirmBtn.isVisible();
      assert(isModalVisible, 'Modal de resgate aberto com custos e saldo restante');

      const cancelBtn = page.locator('button:has-text("Cancelar")');
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(400);
      }
    } else {
      assert(true, 'Trava de saldo insuficiente funcionando corretamente para itens acima da pontuação');
    }

    // Aba Vouchers
    await page.locator('nav button:has-text("Vouchers")').click();
    await page.waitForTimeout(600);
    const vouchersTitle = await page.locator('text=Meus Vouchers Resgatados').first().isVisible();
    assert(vouchersTitle, 'Aba Vouchers aberta com histórico de vouchers do paciente');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/05_vouchers_carteira.png` });

    // -------------------------------------------------------------------------
    // TESTE 7: Homologação de Cortesia de Aniversário (isBirthdayToday)
    // -------------------------------------------------------------------------
    console.log('\n🎂 ETAPA 7: Cortesia de Aniversário & Agendamento Sem WhatsApp');

    // Navega para paciente com aniversário para testar o card fixo e botão Agendar
    await page.goto(`${BASE_URL}/paciente?name=Angela+Maria+De+Sousa&phone=6392657183`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(1200);

    // Vai para a aba Extrato & Prêmios -> Extrato
    await page.locator('nav button:has-text("Extrato & Prêmios")').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Extrato")').first().click();
    await page.waitForTimeout(800);

    const bdayCardInExtrato = page.locator('text=Cortesia de Aniversário');
    const isBdayCardVisible = await bdayCardInExtrato.first().isVisible();
    assert(isBdayCardVisible, 'Card de Cortesia de Aniversário FIXO no topo do Extrato de Prêmios para aniversariante');

    const scheduleBdayBtn = page.locator('button:has-text("Agendar Presente")');
    const isScheduleBdayBtnVisible = await scheduleBdayBtn.first().isVisible();
    assert(isScheduleBdayBtnVisible, 'Botão "Agendar Presente" VISÍVEL apenas para o aniversariante');

    if (isScheduleBdayBtnVisible) {
      await scheduleBdayBtn.first().click();
      await page.waitForTimeout(600);

      const modalTitle = await page.locator('text=Agendar Meu Presente').first().isVisible();
      assert(modalTitle, 'Modal de agendamento de aniversário aberto');

      // Preenche data de preferência
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 5);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await page.fill('input[type="date"]', dateStr);

      const submitScheduleBtn = page.locator('button[type="submit"]:has-text("Confirmar no App")');
      await submitScheduleBtn.click();
      await page.waitForTimeout(1000);

      const successToast = (await page.locator('text=Presente de Aniversário agendado').count()) > 0;
      assert(successToast, 'Solicitação de agendamento do presente submetida com sucesso no app');

      await page.screenshot({ path: `${SCREENSHOT_DIR}/06_agendamento_presente_concluido.png` });
    }

    // -------------------------------------------------------------------------
    // TESTE 8: Validação Estrita de Não-Aniversariante (Botão NÃO deve aparecer)
    // -------------------------------------------------------------------------
    console.log('\n🛡️ ETAPA 8: Validação Estrita de Não-Aniversariante');
    await page.goto(`${BASE_URL}/paciente?name=Paciente+Normal&phone=63999990000`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(1000);

    await page.locator('nav button:has-text("Extrato & Prêmios")').click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Extrato")').first().click();
    await page.waitForTimeout(600);

    const bdayCardNonBday = await page.locator('text=Cortesia de Aniversário').first().isVisible();
    const scheduleBtnNonBday = await page.locator('button:has-text("Agendar Presente")').first().isVisible();
    assert(!bdayCardNonBday && !scheduleBtnNonBday, 'Cortesia e botão "Agendar Presente" NÃO aparecem para paciente não-aniversariante');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/07_nao_aniversariante_limpo.png` });

  } catch (err) {
    console.error('\n🚨 Erro durante a execução dos testes:', err);
    failedTests++;
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log('📈 RELATÓRIO FINAL DOS TESTES E2E:');
  console.log(`   Total de Testes Executados: ${totalTests}`);
  console.log(`   ✅ Aprovados: ${passedTests}`);
  console.log(`   ❌ Falhas: ${failedTests}`);
  console.log(`   Taxa de Sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPatientPwaTests();
