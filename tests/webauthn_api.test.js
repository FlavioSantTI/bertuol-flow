const BASE_URL = 'http://localhost:3000';

async function testWebAuthn() {
  console.log('====================================================');
  console.log('🔒 VERIFICAÇÃO AUTOMATIZADA: WEBAUTHN / BIOMETRIA');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details ? '— ' + details : ''}`);
    }
  }

  // 1. GET /api/auth/webauthn/devices
  console.log('📡 Testando endpoints de API:');
  const resDev = await fetch(`${BASE_URL}/api/auth/webauthn/devices?userId=favuca.dias@gmail.com`);
  const dataDev = await resDev.json();
  assert(resDev.ok && dataDev.success, 'GET /api/auth/webauthn/devices retorna status 200 com array de dispositivos');

  // 2. POST /api/auth/webauthn/login/options
  const resLoginOpt = await fetch(`${BASE_URL}/api/auth/webauthn/login/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const dataLoginOpt = await resLoginOpt.json();
  assert(
    resLoginOpt.ok && dataLoginOpt.success && typeof dataLoginOpt.options?.challenge === 'string',
    'POST /api/auth/webauthn/login/options gera desafio para passkey de 1 toque sem e-mail obrigatório'
  );

  // 3. POST /api/auth/webauthn/register/options
  const resRegOpt = await fetch(`${BASE_URL}/api/auth/webauthn/register/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'test_user_favuca',
      userEmail: 'favuca.dias@gmail.com',
      userName: 'Favuca Dias',
    }),
  });
  const dataRegOpt = await resRegOpt.json();
  assert(
    resRegOpt.ok && dataRegOpt.success && dataRegOpt.options?.rp?.name.includes('Bertuol'),
    'POST /api/auth/webauthn/register/options gera desafio FIDO2 com nome da clínica e usuário'
  );
  assert(
    dataRegOpt.options?.authenticatorSelection?.residentKey === 'preferred',
    'Configuração residentKey: "preferred" configurada para suporte a Passkeys nativas'
  );

  // 4. Testar verificação da tela de entrada (HTML index)
  console.log('\n🖥️ Testando assets e tela:');
  const resHtml = await fetch(`${BASE_URL}/`);
  const html = await resHtml.text();
  assert(resHtml.ok && html.includes('Bertuol Odontologia'), 'Página principal carrega com sucesso');

  console.log('\n====================================================');
  console.log(`📊 RESULTADO FINAL: ${passed}/${total} TESTES PASSARAM COM SUCESSO!`);
  console.log('====================================================\n');
}

testWebAuthn().catch(console.error);
