import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const TEMP_DIR = path.resolve('temp_hyperframes');
const OUTPUT_DIR = path.resolve('public/videos');
const FINAL_MP4 = path.join(OUTPUT_DIR, 'prototipo_tutorial_animado.mp4');

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function runPipeline() {
  console.log('================================================================');
  console.log('🚀 INICIANDO PIPELINE HYPERFRAMES + SLIDESHOW + FFMPEG');
  console.log('   Ecossistema: Bertuol Odontologia (PWA Paciente & Clube)');
  console.log('================================================================\n');

  console.log('🎬 1. Subindo Playwright em resolução Vertical 1080x1920 (9:16)...');
  // Busca binário disponível do Playwright
  const customExecPath = fs.existsSync('/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell')
    ? '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell'
    : undefined;

  const browser = await chromium.launch({
    headless: true,
    executablePath: customExecPath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: TEMP_DIR,
      size: { width: 1080, height: 1920 }
    }
  });

  const page = await context.newPage();

  try {
    console.log('🌐 2. Carregando Palco de Hyperframes (hyperframe-stage.html)...');
    await page.goto(`${BASE_URL}/hyperframe-stage.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.setScene === 'function');
    await page.waitForTimeout(1000);

    // CENA 1: Welcome & Overview
    console.log('   ▶ CENA 1: Apresentação do App & Boas-vindas...');
    await page.evaluate(() => window.setScene('welcome'));
    await page.waitForTimeout(2500);

    // CENA 2: Confirmação de Consulta
    console.log('   ▶ CENA 2: Lembrete e Confirmação de Consulta em 1 Toque...');
    await page.evaluate(() => window.setScene('confirmation'));
    // Simulando toque no botão de confirmação dentro do iframe do app
    await page.evaluate(() => window.triggerTouch(290, 890, 600));
    
    // Tenta clicar no botão dentro do iframe se disponível
    const frame = page.frame({ name: '' }) || page.mainFrame().childFrames()[0];
    if (frame) {
      try {
        const confirmBtn = frame.locator('button:has-text("Confirmar Minha Presença")').first();
        if (await confirmBtn.isVisible({ timeout: 2000 })) {
          await confirmBtn.click();
        }
      } catch (e) {
        console.log('      (Ação de confirmação simulada visualmente)');
      }
    }
    await page.waitForTimeout(3500);

    // CENA 3: Check-in no Totem da Clínica
    console.log('   ▶ CENA 3: Check-in por Aproximação / Totem Silencioso...');
    await page.evaluate(() => window.setScene('checkin'));
    await page.evaluate(() => window.triggerTouch(290, 950, 600));
    if (frame) {
      try {
        const checkinNav = frame.locator('nav button:has-text("Check-in")').first();
        if (await checkinNav.isVisible({ timeout: 1500 })) {
          await checkinNav.click();
        }
      } catch (e) {}
    }
    await page.waitForTimeout(3000);

    // CENA 4: Clube Sorriso de Fidelidade
    console.log('   ▶ CENA 4: Clube de Fidelidade e Resgate de Prêmios...');
    await page.evaluate(() => window.setScene('points'));
    await page.evaluate(() => window.triggerTouch(290, 720, 600));
    if (frame) {
      try {
        const rewardsNav = frame.locator('nav button:has-text("Extrato & Prêmios")').first();
        if (await rewardsNav.isVisible({ timeout: 1500 })) {
          await rewardsNav.click();
        }
      } catch (e) {}
    }
    await page.waitForTimeout(3500);

  } catch (err) {
    console.error('❌ Erro na captura de Hyperframes:', err);
  } finally {
    await context.close();
    await browser.close();
  }

  // Localiza o vídeo gravado pelo Playwright
  const tempFiles = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith('.webm'));
  if (tempFiles.length === 0) {
    throw new Error('Nenhum vídeo foi gerado pelo Playwright!');
  }
  const rawVideoPath = path.join(TEMP_DIR, tempFiles[tempFiles.length - 1]);
  console.log(`\n📹 3. Captura concluída: ${rawVideoPath}`);

  // PÓS-PRODUÇÃO COM FFMPEG
  console.log('🎞️ 4. Executando motor FFmpeg: codificação H.264 + Trilha Sonora Dinâmica...');
  
  if (fs.existsSync(FINAL_MP4)) {
    fs.unlinkSync(FINAL_MP4);
  }

  // Gera áudio sintético harmônico (acorde sutil e ritmo agradável estilo tech) e une com o vídeo H.264
  const ffmpegCommand = `ffmpeg -y -i "${rawVideoPath}" \
    -f lavfi -i "aevalsrc=sin(2*PI*220*t)*0.03*between(mod(t\\,0.5)\\,0\\,0.08) + sin(2*PI*440*t)*0.02*between(mod(t\\,1.0)\\,0\\,0.12) + sin(2*PI*660*t)*0.015:s=44100:d=13" \
    -filter_complex "[0:v]fade=t=in:st=0:d=0.5,fade=t=out:st=12:d=0.8[v]; [1:a]afade=t=in:st=0:d=0.5,afade=t=out:st=12:d=0.8[a]" \
    -map "[v]" -map "[a]" \
    -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p \
    -c:a aac -b:a 128k \
    -shortest "${FINAL_MP4}"`;

  try {
    execSync(ffmpegCommand, { stdio: 'inherit' });
    console.log('\n================================================================');
    console.log('🎉 PROTÓTIPO DE VÍDEO TUTORIAL GERADO COM SUCESSO!');
    console.log(`📁 Arquivo final: ${FINAL_MP4}`);
    console.log(`🌐 Link web: http://localhost:3000/videos/prototipo_tutorial_animado.mp4`);
    console.log('================================================================\n');
  } catch (ffmpegErr) {
    console.error('Erro na etapa do FFmpeg:', ffmpegErr);
  }
}

runPipeline();
