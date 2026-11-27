export const CLUBE_SORRISO_TERMS_VERSION = '1.0-2026-11';
export const CLUBE_SORRISO_TERMS_LABEL = 'Versão 1.0 · Novembro de 2026';
export const CLUBE_SORRISO_OPERATOR = 'Bertuol Coworking Odonto Ltda. (Bertuol Odontologia Avançada)';
export const CLUBE_SORRISO_UNITS = 'Palmas-TO e Paraíso do Tocantins-TO';

export interface ClubeSorrisoLevelRule {
  id: 'bronze' | 'prata' | 'ouro' | 'diamante';
  name: string;
  multiplier: string;
  requirement: string;
  highlight: string;
}

export interface ClubeSorrisoClause {
  number: number;
  title: string;
  text: string;
}

export interface ClubeSorrisoPrivacySection {
  title: string;
  text: string;
}

export interface PatientTermsAcceptanceRecord {
  id: string;
  patientKey: string;
  patientId?: string | null;
  patientName: string;
  patientPhone: string;
  patientDocumentId?: string | null;
  clinicId?: number;
  termsVersion: string;
  termsHash: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  marketingOptIn: boolean;
  acceptedAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  acceptanceChannel: string;
}

export interface PatientTermsStatusResponse {
  success: boolean;
  accepted: boolean;
  requiredVersion: string;
  termsLabel: string;
  acceptance: PatientTermsAcceptanceRecord | null;
  storage?: 'supabase' | 'local_fallback' | 'none';
  supabaseTableReady?: boolean;
}

export const CLUBE_SORRISO_LEVELS: ClubeSorrisoLevelRule[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    multiplier: '1,00x',
    requirement: 'Cadastro no app e 1ª consulta',
    highlight: 'Boas-vindas: 100 pts (perfil completo) + 50 pts (anamnese digital)',
  },
  {
    id: 'prata',
    name: 'Prata',
    multiplier: '1,15x',
    requirement: '2.500 pts de status em 12 meses ou 2 indicações convertidas',
    highlight: 'Brindes de higiene premium e mimos de aniversário',
  },
  {
    id: 'ouro',
    name: 'Ouro',
    multiplier: '1,25x',
    requirement: '7.000 pts de status em 12 meses ou contrato ≥ R$ 7.000',
    highlight: 'Conta Família (até 3 dependentes) e agendamento preferencial',
  },
  {
    id: 'diamante',
    name: 'Diamante',
    multiplier: '1,50x',
    requirement: '15.000 pts de status em 12 meses ou contrato ≥ R$ 15.000',
    highlight: 'Conta Família (até 5 dependentes), atendimento concierge e urgência em 24h',
  },
];

export const CLUBE_SORRISO_KEY_RULES: { title: string; summary: string }[] = [
  {
    title: 'Duas contas: Status e Pontos Sorriso',
    summary:
      'Cada R$ 1,00 efetivamente pago gera 1 ponto de status (últimos 12 meses, sem multiplicador) que define seu nível. O saldo resgatável (Pontos Sorriso) soma os pontos base multiplicados pelo seu nível mais os bônus por comportamento.',
  },
  {
    title: 'Bônus por constância e prevenção',
    summary:
      'Você acumula bônus por perfil completo (+100), anamnese digital (+50), check-in pontual (+20), revisão semestral no prazo (+150, até 2x/ano), parcela em dia (+15), indicação convertida (+500), aniversário (+150) e pesquisa interna (+30). Avaliações em plataformas externas como o Google não são premiadas.',
  },
  {
    title: 'Validade de 24 meses',
    summary:
      'Os pontos valem por 24 meses a partir da data do crédito, com avisos prévios no aplicativo em 60, 30 e 7 dias antes do vencimento.',
  },
  {
    title: 'Crédito Sorriso e resgates',
    summary:
      'Na conversão em Crédito Sorriso, cada 1.000 pontos equivale a R$ 30,00 (mínimo de 3.000 pontos), limitado ao abatimento de até 30% do valor do pagamento.',
  },
  {
    title: 'Regra Clínica Inegociável',
    summary:
      'Todo resgate de serviço clínico gera um voucher condicionado à avaliação e indicação do cirurgião-dentista. Em caso de contraindicação clínica, os pontos utilizados são devolvidos integralmente à sua conta.',
  },
];

/**
 * Texto oficial das 12 cláusulas do Anexo — Regulamento Resumido do Clube Sorriso Bertuol (Versão 1.0 · Novembro de 2026)
 */
export const CLUBE_SORRISO_CLAUSES: ClubeSorrisoClause[] = [
  {
    number: 1,
    title: 'Do programa',
    text: 'O Clube Sorriso Bertuol é o programa de relacionamento da Bertuol Coworking Odonto Ltda. (Bertuol Odontologia Avançada), gratuito e de adesão voluntária, destinado a pacientes pessoas físicas.',
  },
  {
    number: 2,
    title: 'Da adesão',
    text: 'A adesão ocorre pelo cadastro no aplicativo e pelo aceite eletrônico deste regulamento e da política de privacidade.',
  },
  {
    number: 3,
    title: 'Da pontuação',
    text: 'Cada R$ 1,00 efetivamente pago gera 1 ponto base, multiplicado pelo fator do nível vigente na data do pagamento, além dos bônus previstos na tabela oficial publicada no aplicativo.',
  },
  {
    number: 4,
    title: 'Dos níveis',
    text: 'Os níveis Bronze, Prata, Ouro e Diamante são definidos pelos pontos de status dos últimos 12 meses ou pelos critérios de entrada acelerada, e revisados anualmente.',
  },
  {
    number: 5,
    title: 'Da validade',
    text: 'Os pontos valem 24 meses a partir do crédito, vencendo automaticamente após esse prazo.',
  },
  {
    number: 6,
    title: 'Dos resgates',
    text: 'Os resgates dependem de saldo suficiente e do nível mínimo exigido. Resgates de serviços clínicos estão condicionados à avaliação e à indicação profissional; havendo contraindicação, os pontos são devolvidos.',
  },
  {
    number: 7,
    title: 'Da natureza dos pontos',
    text: 'Os pontos não têm valor monetário, não são conversíveis em dinheiro e são intransferíveis, salvo dentro da Conta Família.',
  },
  {
    number: 8,
    title: 'Do cancelamento e do estorno',
    text: 'Pagamentos cancelados, estornados ou inadimplentes por mais de 60 dias implicam a retirada dos pontos correspondentes e o recálculo do nível.',
  },
  {
    number: 9,
    title: 'Das condutas vedadas',
    text: 'Fraudes, indicações fictícias ou uso indevido do programa autorizam o cancelamento da conta e dos pontos, após notificação ao titular.',
  },
  {
    number: 10,
    title: 'Das alterações',
    text: 'A clínica pode alterar este regulamento mediante aviso prévio de 30 dias no aplicativo, preservando os pontos já creditados. O encerramento do programa garante o prazo mínimo de 90 dias para o resgate do saldo.',
  },
  {
    number: 11,
    title: 'Dos dados pessoais',
    text: 'O tratamento de dados segue a Lei 13.709/2018 (LGPD), conforme a política de privacidade da clínica.',
  },
  {
    number: 12,
    title: 'Do foro',
    text: 'Fica eleito o foro do domicílio do consumidor, nos termos do Código de Defesa do Consumidor.',
  },
];

export const CLUBE_SORRISO_PRIVACY_SECTIONS: ClubeSorrisoPrivacySection[] = [
  {
    title: 'Coleta mínima e finalidade (LGPD · Lei 13.709/2018)',
    text: 'Tratamos apenas os dados necessários para identificação do paciente, gestão de consultas, check-in na recepção e operação do Clube Sorriso Bertuol (nome, telefone, CPF quando informado, unidade de atendimento e histórico de pontos e vouchers).',
  },
  {
    title: 'Separação entre prontuário clínico e programa de fidelidade',
    text: 'Seus dados de saúde e prontuário odontológico permanecem protegidos sob sigilo profissional e são mantidos de forma separada das informações de pontuação, nível e resgates do Clube Sorriso.',
  },
  {
    title: 'Comunicações de marketing com consentimento específico',
    text: 'O envio de novidades, campanhas promocionais e comunicações de marketing depende da sua autorização opcional e específica, que pode ser concedida ou revogada a qualquer momento sem prejuízo ao acesso ao aplicativo ou ao atendimento clínico.',
  },
  {
    title: 'Ética odontológica e defesa do consumidor',
    text: 'Este programa observa o Código de Defesa do Consumidor (arts. 30 e 31) e o Código de Ética Odontológica (Resolução CFO 271/2025). Não há venda de serviços odontológicos por pontos sem avaliação profissional, nem sorteios ou leilões de procedimentos.',
  },
  {
    title: 'Registro eletrônico de aceite e direitos do titular',
    text: 'Para sua segurança jurídica, registramos a versão aceita, data e hora, canal de acesso e identificação técnica da sessão. Você pode solicitar confirmação, correção de dados ou exclusão da sua conta do programa junto à recepção ou pelos canais oficiais da Bertuol Odontologia Avançada.',
  },
];

export function getCanonicalTermsText(): string {
  const clausesBlock = CLUBE_SORRISO_CLAUSES.map(
    (c) => `Cláusula ${c.number}. ${c.title}. ${c.text}`
  ).join('\n');

  const privacyBlock = CLUBE_SORRISO_PRIVACY_SECTIONS.map(
    (s) => `${s.title}: ${s.text}`
  ).join('\n');

  return [
    `CLUBE SORRISO BERTUOL — REGULAMENTO E POLÍTICA DE PRIVACIDADE`,
    `Versão: ${CLUBE_SORRISO_TERMS_VERSION} (${CLUBE_SORRISO_TERMS_LABEL})`,
    `Operadora: ${CLUBE_SORRISO_OPERATOR} — ${CLUBE_SORRISO_UNITS}`,
    '',
    clausesBlock,
    '',
    privacyBlock,
  ].join('\n');
}
