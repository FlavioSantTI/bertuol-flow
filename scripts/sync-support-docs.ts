import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

type SupportProfileId = 'patient' | 'dentist' | 'receptionist';

interface SupportArticle {
  id: string;
  profile: SupportProfileId;
  category: string;
  title: string;
  summary: string;
  steps: string[];
  tip?: string;
  keywords: string[];
  includeInPrint: boolean;
  printOrder: number;
  updatedInVersion: string;
  lastReviewedAt: string;
}

interface ImpactRule {
  pattern: string;
  profiles: SupportProfileId[];
  area: string;
}

interface SupportMeta {
  version: string;
  lastSyncedAt: string;
  repository: string;
  branch: string;
  supportUrl: string;
  lastCommitSha?: string;
  lastImpactSummary?: string;
  profiles: Record<SupportProfileId, any>;
  impactMap: ImpactRule[];
}

const ROOT_DIR = process.cwd();
const KB_DIR = path.resolve(ROOT_DIR, 'docs', 'support-kb');
const REPORT_FILE = path.resolve(ROOT_DIR, 'support-sync-report.md');

function runGit(args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function getArgValue(flag: string): string | undefined {
  const match = process.argv.find((a) => a.startsWith(`${flag}=`));
  return match ? match.slice(flag.length + 1).trim() : undefined;
}

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(ROOT_DIR, 'package.json'), 'utf-8'));
    return String(pkg.version || '1.6.0');
  } catch {
    return '1.6.0';
  }
}

function loadProfileArticles(profile: SupportProfileId): SupportArticle[] {
  const filePath = path.resolve(KB_DIR, `${profile}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SupportArticle[];
}

function saveProfileArticles(profile: SupportProfileId, articles: SupportArticle[]) {
  const filePath = path.resolve(KB_DIR, `${profile}.json`);
  const sorted = articles
    .slice()
    .sort((a, b) => (a.printOrder || 999) - (b.printOrder || 999));
  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

async function draftUpdatesWithGemini(params: {
  profile: SupportProfileId;
  profileLabel: string;
  version: string;
  todayYMD: string;
  changedFiles: string[];
  diffExcerpt: string;
  currentArticles: SupportArticle[];
}): Promise<{
  summary: string;
  upsertArticles: SupportArticle[];
} | null> {
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const existingSummary = params.currentArticles
    .map((a) => `- [${a.id}] (${a.category}) ${a.title} — ${a.summary}`)
    .join('\n');

  const prompt = `Analise as mudanças recentes no código do Bertuol Flow (versão ${params.version}) e proponha APENAS atualizações ou novos artigos de FAQ que realmente impactam o uso prático do perfil "${params.profileLabel}" (${params.profile}).

ARQUIVOS ALTERADOS RELEVANTES:
${params.changedFiles.map((f) => `- ${f}`).join('\n')}

RESUMO DO DIFF:
${params.diffExcerpt.slice(0, 9000)}

ARTIGOS ATUAIS DESTE PERFIL:
${existingSummary}

REGRAS:
- Se o diff for apenas técnico/refatoração interna sem mudança perceptível para o perfil "${params.profileLabel}", retorne "upsertArticles": [].
- Para atualizar um artigo existente, reutilize exatamente o mesmo "id".
- Para criar um novo artigo, use prefixo "${params.profile === 'patient' ? 'pat-' : params.profile === 'dentist' ? 'den-' : 'rec-'}" em kebab-case.
- Escreva em português do Brasil claro, direto e prático para uso no FAQ, no Chat de IA e na Cartilha A4 impressa.
- Nunca inclua nomes de arquivos, tokens, chaves de API ou detalhes técnicos de código nas instruções para o usuário final.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: 'Resumo curto das mudanças identificadas para o PR.',
          },
          upsertArticles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                tip: { type: Type.STRING },
                keywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['id', 'category', 'title', 'summary', 'steps', 'keywords'],
            },
          },
        },
        required: ['summary', 'upsertArticles'],
      },
    },
  });

  const parsed = JSON.parse((response.text || '{}').trim());
  const rawList = Array.isArray(parsed.upsertArticles) ? parsed.upsertArticles : [];

  const nextOrderBase =
    params.currentArticles.reduce((max, item) => Math.max(max, item.printOrder || 0), 0) + 1;
  let extraIdx = 0;

  const normalized: SupportArticle[] = rawList
    .filter(
      (item: any) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        Array.isArray(item.steps) &&
        item.steps.length > 0
    )
    .map((item: any) => {
      const existing = params.currentArticles.find((a) => a.id === item.id);
      const printOrder = existing ? existing.printOrder : nextOrderBase + extraIdx++;
      return {
        id: String(item.id).trim(),
        profile: params.profile,
        category: String(item.category || existing?.category || 'Geral').trim(),
        title: String(item.title).trim(),
        summary: String(item.summary || '').trim(),
        steps: item.steps.map((s: any) => String(s || '').trim()).filter(Boolean),
        tip: item.tip ? String(item.tip).trim() : existing?.tip,
        keywords: (Array.isArray(item.keywords) ? item.keywords : [])
          .map((k: any) => String(k || '').trim().toLowerCase())
          .filter(Boolean),
        includeInPrint: existing ? existing.includeInPrint : true,
        printOrder,
        updatedInVersion: params.version,
        lastReviewedAt: params.todayYMD,
      };
    });

  return {
    summary: String(parsed.summary || '').trim(),
    upsertArticles: normalized,
  };
}

async function main() {
  const baseRef = getArgValue('--base') || process.env.SYNC_BASE_SHA || 'HEAD~1';
  const headRef = getArgValue('--head') || process.env.SYNC_HEAD_SHA || 'HEAD';
  const forcedProfile = getArgValue('--profile') as SupportProfileId | 'all' | undefined;
  const dryRun = process.argv.includes('--dry-run');

  const metaPath = path.resolve(KB_DIR, 'meta.json');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as SupportMeta;
  const version = readPackageVersion();
  const todayYMD = new Date().toISOString().slice(0, 10);
  const headSha = runGit(['rev-parse', '--short', 'HEAD']) || 'local';

  let changedFiles = runGit(['diff', '--name-only', baseRef, headRef])
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);

  if (changedFiles.length === 0) {
    changedFiles = runGit(['show', '--pretty=', '--name-only', 'HEAD'])
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
  }

  const impactedByProfile: Record<SupportProfileId, { files: Set<string>; areas: Set<string> }> = {
    patient: { files: new Set(), areas: new Set() },
    dentist: { files: new Set(), areas: new Set() },
    receptionist: { files: new Set(), areas: new Set() },
  };

  for (const file of changedFiles) {
    if (file.startsWith('docs/support-kb/')) continue;
    for (const rule of meta.impactMap || []) {
      if (file.includes(rule.pattern)) {
        for (const prof of rule.profiles) {
          impactedByProfile[prof].files.add(file);
          impactedByProfile[prof].areas.add(rule.area);
        }
      }
    }
  }

  let targetProfiles: SupportProfileId[] = (['patient', 'dentist', 'receptionist'] as SupportProfileId[]).filter(
    (p) => impactedByProfile[p].files.size > 0
  );

  if (forcedProfile === 'all') {
    targetProfiles = ['patient', 'dentist', 'receptionist'];
  } else if (forcedProfile && ['patient', 'dentist', 'receptionist'].includes(forcedProfile)) {
    targetProfiles = [forcedProfile];
  }

  // Validação estrutural de todos os arquivos da KB
  for (const prof of ['patient', 'dentist', 'receptionist'] as SupportProfileId[]) {
    const articles = loadProfileArticles(prof);
    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error(`Base de conhecimento inválida ou vazia para o perfil: ${prof}`);
    }
  }

  const reportLines: string[] = [
    `# Sincronização da Central de Suporte (v${version})`,
    '',
    `- **Commit analisado**: \`${headSha}\``,
    `- **Data**: \`${todayYMD}\``,
    `- **Perfis impactados**: ${
      targetProfiles.length > 0
        ? targetProfiles.map((p) => `\`${meta.profiles[p]?.label || p}\``).join(', ')
        : 'Nenhum perfil funcional impactado neste diff'
    }`,
    '',
  ];

  let totalUpserted = 0;

  if (targetProfiles.length > 0) {
    const diffExcerpt = runGit(['diff', '--unified=2', baseRef, headRef]);
    const hasGemini = Boolean(String(process.env.GEMINI_API_KEY || '').trim());

    for (const prof of targetProfiles) {
      const files = Array.from(impactedByProfile[prof].files);
      const areas = Array.from(impactedByProfile[prof].areas);
      const profileLabel = meta.profiles[prof]?.label || prof;

      reportLines.push(`## Perfil: ${profileLabel}`);
      if (areas.length > 0) {
        reportLines.push(`- **Áreas alteradas**: ${areas.join(', ')}`);
      }
      if (files.length > 0) {
        reportLines.push(`- **Arquivos detectados**: ${files.slice(0, 10).map((f) => `\`${f}\``).join(', ')}`);
      }

      if (hasGemini) {
        const currentArticles = loadProfileArticles(prof);
        const aiResult = await draftUpdatesWithGemini({
          profile: prof,
          profileLabel,
          version,
          todayYMD,
          changedFiles: files.length > 0 ? files : changedFiles.slice(0, 10),
          diffExcerpt,
          currentArticles,
        });

        if (aiResult && aiResult.upsertArticles.length > 0) {
          const mergedMap = new Map(currentArticles.map((a) => [a.id, a]));
          for (const up of aiResult.upsertArticles) {
            mergedMap.set(up.id, up);
          }
          totalUpserted += aiResult.upsertArticles.length;
          if (!dryRun) {
            saveProfileArticles(prof, Array.from(mergedMap.values()));
          }
          reportLines.push(`- **Resumo IA**: ${aiResult.summary || 'Artigos atualizados com base no diff.'}`);
          reportLines.push(
            `- **Artigos propostos (${aiResult.upsertArticles.length})**: ${aiResult.upsertArticles
              .map((a) => `\`${a.id}\` (${a.title})`)
              .join('; ')}`
          );
        } else {
          reportLines.push(
            `- **Análise IA**: ${aiResult?.summary || 'Nenhuma alteração visível ao usuário final exigiu reescrita do FAQ.'}`
          );
        }
      } else {
        reportLines.push(
          '- **Modo Checklist (sem `GEMINI_API_KEY` no GitHub Secrets)**: revise os arquivos de FAQ deste perfil caso haja nova rotina para o usuário final.'
        );
      }

      reportLines.push('');
    }

    if (!dryRun) {
      meta.version = version;
      meta.lastSyncedAt = new Date().toISOString();
      meta.lastCommitSha = headSha;
      meta.lastImpactSummary =
        totalUpserted > 0
          ? `${totalUpserted} artigo(s) sugerido(s) para revisão (${targetProfiles.join(', ')})`
          : `Impacto detectado para revisão (${targetProfiles.join(', ')})`;
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8');
    }
  }

  reportLines.push('### Checklist antes do Merge');
  reportLines.push('- [ ] Conferir se os passos refletem fielmente as telas atuais da clínica e do portal');
  reportLines.push('- [ ] Garantir que nenhum conteúdo interno de equipe foi inserido na base de `patient`');
  reportLines.push('- [ ] Conferir a prévia de impressão A4 da cartilha dos perfis alterados');

  const reportContent = reportLines.join('\n') + '\n';
  if (!dryRun) {
    fs.writeFileSync(REPORT_FILE, reportContent, 'utf-8');
  }

  console.log(reportContent);
}

main().catch((err) => {
  console.error('[sync-support-docs] Erro:', err?.message || err);
  process.exit(1);
});
