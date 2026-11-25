import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function runWebAuthnTests() {
  console.log('====================================================');
  console.log('🔒 INICIANDO TESTES E2E: WEBAUTHN / BIOMETRIA (FASE 1)');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });

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
    // 1. API: Login options endpoint
    console.log('\n🧪 1. Testando Endpoints de Desafio Criptográfico');
    const optRes = await fetch(`${BASE_URL}/api/auth/webauthn/login/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const optData = await optRes.json();
    assert(optRes.ok && optData.success && optData.options?.challenge, 'Endpoint /api/auth/webauthn/login/options gera desafio válido');

    // 2. API: Register options endpoint
    const regOptRes = await fetch(`${BASE_URL}/api/auth/webauthn/register/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user-id',
        userEmail: 'dr.claudio@bertuolodontologia.com.br',
        userName: 'Dr. Claudio Borba',
      }),
    });
    const regOptData = await regOptRes.json();
    assert(regOptRes.ok && regOptData.success && regOptData.options?.rp?.name, 'Endpoint /api/auth/webauthn/register/options gera desafio de registro');

    // 3. API: Devices list endpoint
    const devRes = await fetch(`${BASE_URL}/api/auth/webauthn/devices?userId=test-user-id`);
    const devData = await devRes.json();
    assert(devRes.ok && devData.success && Array.isArray(devData.devices), 'Endpoint /api/auth/webauthn/devices lista dispositivos');

    // 4. UI: Tela de Login exibe botão de Face ID / Biometria
    console.log('\n🖥️ 2. Testando Interface de Usuário (LoginScreen)');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const bioButton = page.locator('button:has-text("Entrar com Face ID / Biometria")');
    const isBioButtonVisible = await bioButton.isVisible();
    assert(isBioButtonVisible, 'Botão "Entrar com Face ID / Biometria" visível na tela de login');

    const emailInput = page.locator('input[placeholder*="bertuolodontologia.com.br"]');
    assert(await emailInput.isVisible(), 'Campo de e-mail / usuário alternativo visível');

    // 5. Autenticar com credenciais de teste para validar o Header e Modal de Biometria
    console.log('\n👤 3. Testando Acesso do Profissional e Gestão de Dispositivos');
    await emailInput.fill('favuca.dias@gmail.com');
    const passInput = page.locator('input[type="password"]');
    await passInput.fill('Favuca@1970');
    await page.click('button[type="submit"]:has-text("Entrar no Sistema")');

    // Aguardar transição para a tela principal
    await page.waitForTimeout(2000);

    // Verificar se o botão de Biometria está presente no Header
    const biometriaBtn = page.locator('button:has-text("Biometria")');
    const isBiometriaBtnVisible = await biometriaBtn.isVisible();
    assert(isBiometriaBtnVisible, 'Botão de Biometria presente no Header superior do profissional');

    // Abrir o Modal de Gestão de Biometria
    if (isBiometriaBtnVisible) {
      await biometriaBtn.click();
      await page.waitForTimeout(500);

      const modalTitle = page.locator('text=Autenticação Biométrica & Passkeys');
      assert(await modalTitle.isVisible(), 'Modal de Biometria abre com título correto');

      const deviceInput = page.locator('input[placeholder*="iPhone"]');
      assert(await deviceInput.isVisible(), 'Campo para apelido/nome do aparelho visível no modal');

      const activateBtn = page.locator('button:has-text("Ativar Face ID / Biometria Neste Aparelho")');
      assert(await activateBtn.isVisible(), 'Botão de ativação de biometria visível');

      // Fechar modal
      await page.click('button:has-text("Concluir")');
      await page.waitForTimeout(500);
      assert(!(await modalTitle.isVisible()), 'Modal de Biometria fecha corretamente');
    }

  } catch (err) {
    console.error('Erro durante execução dos testes:', err);
  } finally {
    await browser.close();
    console.log('\n====================================================');
    console.log(`📊 RESULTADO DOS TESTES: ${passedTests}/${totalTests} PASSARAM`);
    if (failedTests > 0) {
      console.log(`⚠️ ${failedTests} testes falharam.`);
    } else {
      console.log('🎉 TODOS OS TESTES FORAM CONCLUÍDOS COM SUCESSO!');
    }
    console.log('====================================================\n');
  }
}

runWebAuthnTests().catch(console.error);
