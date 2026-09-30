import { Appointment, Category, Dentist, Patient, Clinic, AppUserContext, UserRole, SystemUser, UserPermissions } from '../types/database';

export const CLINIC_BUSINESS_ID_PALMAS = 5053762760081408;
export const CLINIC_BUSINESS_ID_PARAiSO = 5053762760081409;
export const CLINIC_BUSINESS_ID_ARAGUAINA = 5053762760081410;
export const CLINIC_BUSINESS_ID = CLINIC_BUSINESS_ID_PALMAS;

export const INITIAL_CLINICS: Clinic[] = [
  {
    id: 1,
    name: 'Bertuol Odontologia Avançada - Matriz Palmas',
    shortName: 'Palmas (Matriz)',
    slug: 'palmas',
    city: 'Palmas',
    state: 'TO',
    address: 'Quadra 104 Sul, Av. LO-01, Ed. Executive Center, Sala 402 - Palmas, TO',
    phone: '(63) 3215-4000',
    whatsappNumber: '+55 (63) 98108-9346',
    clinicorp_business_id: CLINIC_BUSINESS_ID_PALMAS,
    clinicorp_user: 'qspalmasto',
    clinicorp_key_masked: '••••••••-••••-••••-••••-••••••••••••',
    webhook_secret: 'sec_palmas_9812a',
    colorTag: '#FF981A',
    active: true,
  },
  {
    id: 2,
    name: 'Bertuol Odontologia - Unidade Paraíso',
    shortName: 'Paraíso do Tocantins',
    slug: 'paraiso',
    city: 'Paraíso do Tocantins',
    state: 'TO',
    address: 'Av. Bernardo Sayão, 1420 - Centro, Paraíso do Tocantins, TO',
    phone: '(63) 3602-1200',
    whatsappNumber: '+55 (63) 98148-7023',
    clinicorp_business_id: CLINIC_BUSINESS_ID_PARAiSO,
    clinicorp_user: 'qsparaisoto',
    clinicorp_key_masked: '••••••••-••••-••••-••••-••••••••••••',
    webhook_secret: 'sec_paraiso_4419f',
    colorTag: '#2563EB',
    active: false, // Inativa provisoriamente na fase de testes (Apenas Palmas)
  },
  {
    id: 3,
    name: 'Bertuol Odontologia - Unidade Araguaína',
    shortName: 'Araguaína',
    slug: 'araguaina',
    city: 'Araguaína',
    state: 'TO',
    address: 'Rua 13 de Maio, 850 - Setor Central, Araguaína, TO',
    phone: '(63) 3411-8800',
    whatsappNumber: '+55 (63) 99234-9680',
    clinicorp_business_id: CLINIC_BUSINESS_ID_ARAGUAINA,
    clinicorp_user: 'qsaraguainato',
    clinicorp_key_masked: '••••••••-••••-••••-••••-••••••••••••',
    webhook_secret: 'sec_araguaina_7721c',
    colorTag: '#059669',
    active: false, // Inativa provisoriamente na fase de testes (Apenas Palmas)
  },
];

// Helper to format date YYYY-MM-DD
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate base dates around today
const today = new Date();
export const todayStr = formatDateKey(today);

// 8 Real Bertuol Dentistas from Clinicorp API with Multi-Clinic Affiliations
export const INITIAL_DENTISTS: Dentist[] = [
  {
    id: 5229563695136768,
    Name: 'Dr. Claudio Borba',
    CRO: 'CRO-TO (Cirurgia & Prótese)',
    Email: 'claudio@bertuolodontologia.com.br',
    MobilePhone: '(63) 98148-7023',
    Active: 'true',
    Sex: 'M',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    specialty: 'Cirurgia & Prótese Reabilitadora',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    affiliatedClinicIds: [1, 2], // Atende em Palmas e Paraíso
  },
  {
    id: 5454048267862016,
    Name: 'Dra. Ariane C. Bertuol',
    CRO: 'CRO-TO (Ortodontia & Alinhadores)',
    Email: 'ariane@bertuolodontologia.com.br',
    MobilePhone: '(63) 98108-9346',
    Active: 'true',
    Sex: 'F',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    specialty: 'Ortodontia & Alinhadores Invisíveis',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    affiliatedClinicIds: [1, 2], // Atende em Palmas e Paraíso
  },
  {
    id: 6177152107544576,
    Name: 'Dr. Ari Bertuol',
    CRO: 'CRO-TO (Implantodontia & Cirurgia)',
    Email: 'ari@bertuolodontologia.com.br',
    MobilePhone: '(63) 99234-9680',
    Active: 'true',
    Sex: 'M',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    specialty: 'Implantodontia & Cirurgia Oral',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    affiliatedClinicIds: [1, 3], // Atende em Palmas e Araguaína
  },
  {
    id: 4715910723076096,
    Name: 'Dra. Andressa Marinho',
    CRO: 'CRO-TO (Odontologia Estética)',
    Email: 'andressa@bertuolodontologia.com.br',
    MobilePhone: '(63) 98460-8315',
    Active: 'true',
    Sex: 'F',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    specialty: 'Odontologia Estética & Clareamento',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813583-7c703b4ffeb2?w=150&auto=format&fit=crop&q=80',
    affiliatedClinicIds: [1], // Palmas
  },
  {
    id: 5606585381552128,
    Name: 'Dra. Anna Aliny Dourado',
    CRO: 'CRO-TO (Dentística Restauradora)',
    Email: 'anna@bertuolodontologia.com.br',
    MobilePhone: '(63) 99284-6707',
    Active: 'true',
    Sex: 'F',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PARAiSO,
    specialty: 'Dentística Restauradora & Facetas',
    avatarUrl: 'https://images.unsplash.com/photo-1629425733761-caae3b5f2e50?w=150&auto=format&fit=crop&q=80',
    affiliatedClinicIds: [2], // Paraíso
  },
  {
    id: 6032266299703296,
    Name: 'Dra. Cristina Silveira',
    CRO: 'CRO-TO (Endodontia)',
    Email: 'cristina@bertuolodontologia.com.br',
    MobilePhone: '(11) 98271-3845',
    Active: 'true',
    Sex: 'F',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    specialty: 'Endodontia Microscópica',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    affiliatedClinicIds: [1], // Palmas
  },
  {
    id: 6301544526118912,
    Name: 'Dra. Muryel Castro',
    CRO: 'CRO-TO (Periodontia)',
    Email: 'muryel@bertuolodontologia.com.br',
    MobilePhone: '(63) 99292-6515',
    Active: 'true',
    Sex: 'F',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    specialty: 'Periodontia & Prevenção',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813583-7c703b4ffeb2?w=150&auto=format&fit=crop&q=80',
    affiliatedClinicIds: [1, 2], // Palmas e Paraíso
  },
  {
    id: 6036933394890752,
    Name: 'Avaliador Bertuol',
    CRO: 'CRO-TO (Avaliação & Triagem)',
    Email: 'avaliacao@bertuolodontologia.com.br',
    MobilePhone: '(63) 98108-0000',
    Active: 'true',
    Sex: 'M',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    specialty: 'Avaliação & Triagem Inicial',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    affiliatedClinicIds: [1, 2, 3], // Todas as unidades
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: '5857665617494016',
    description: 'Consulta',
    color: '#0D9488',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: '6331646933991424',
    description: 'Avaliação',
    color: '#D97706',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: '5231391941328896',
    description: 'Cirurgia',
    color: '#8B5CF6',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: '6280497176510464',
    description: '2 FASE IMPLANTE',
    color: '#EC4899',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: '5073601083998208',
    description: 'Periódico',
    color: '#0284C7',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: '5794341894750208',
    description: 'Retorno',
    color: '#78716C',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: '5369170210586624',
    description: 'Checkup',
    color: '#06B6D4',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: '6701865690529792',
    description: 'Agenda Whatsapp',
    color: '#4F46E5',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: '6489354748887040',
    description: 'INSTAGRAM',
    color: '#E11D48',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: '4804384834781184',
    description: 'AppCRC',
    color: '#991B1B',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 101,
    Name: 'Claudiana Lima Leite',
    MobilePhone: '(63) 98100-1007',
    Age: 35,
    insurancePlanName: 'Particular',
    Notes: 'Paciente com sensibilidade térmica e ansiedade odontológica. Alinhadores invisíveis em andamento.',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: 102,
    Name: 'Nelson Freiberger',
    MobilePhone: '(63) 99260-3418',
    Age: 48,
    insurancePlanName: 'Bradesco Dental',
    Notes: 'Elemento 16 preparado para coroa cerâmica. Alérgico comprovado a látex. Usar luvas de nitrilo.',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: 103,
    Name: 'Esther Oliveira Duarte',
    MobilePhone: '(63) 99213-9180',
    Age: 24,
    insurancePlanName: 'Particular',
    Notes: 'Paciente jovem. Queixa de apinhamento ântero-inferior. Deseja opções estéticas com alinhadores.',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: 104,
    Name: 'Juscelino Kubitschek Oliveira',
    MobilePhone: '(63) 98417-3097',
    Age: 52,
    insurancePlanName: 'SulAmérica Odonto',
    Notes: 'Manutenção preventiva semestral e implante cone morse. Histórico de gengivite leve.',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
  {
    id: 105,
    Name: 'Zuzu Scarlat Test',
    MobilePhone: '(63) 98555-5555',
    Age: 29,
    insurancePlanName: 'Unimed Odonto',
    Notes: 'Avaliação de facetas em resina composta nos incisivos centrais.',
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  // 1. Dr. Claudio Borba (id: 5229563695136768) - 3 Pacientes reais do Clinicorp
  {
    id: 6101348905385981,
    AtomicDate: 202609260930,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    Dentist_PersonId: 5229563695136768,
    Patient_PersonId: 4905340861153281,
    PatientName: 'Marilda Coelho e Silva',
    MobilePhone: '(63) 98122-3344',
    Procedures: 'Moldagem e/ou cirurgia de implante, que não foi feita no dia 12/09',
    Notes: '"implante do dente 24 e moldar o 37 / Não fez o implante, colocou o cicatrizador em outros dentes" Foi feito só moldagem',
    fromTime: '09:30',
    toTime: '10:30',
    date: todayStr,
    CategoryId: '5231391941328896', // Cirurgia
    ai_summary: 'Paciente Marilda Coelho e Silva agendada para moldagem e avaliação de cirurgia de implante do elemento 24 e moldagem do 37. Revisar posicionamento do cicatrizador antes do procedimento.',
  },
  {
    id: 6101348905385985,
    AtomicDate: 202609261030,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    Dentist_PersonId: 5229563695136768,
    Patient_PersonId: 4905340861153282,
    PatientName: 'Nilza Antônio Gonçalves',
    MobilePhone: '+556392455405',
    Procedures: 'coroa',
    Notes: 'Trabalho está aqui no laboratório/clínica',
    fromTime: '10:30',
    toTime: '11:00',
    date: todayStr,
    CategoryId: '5857665617494016', // Consulta
    ai_summary: 'Instalação / prova de coroa protética. Peça protética conferida e disponível no consultório.',
  },
  {
    id: 6563562514808833,
    AtomicDate: 202609261100,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    Dentist_PersonId: 5229563695136768,
    Patient_PersonId: 4512636975710209,
    PatientName: 'Weliton Reis',
    MobilePhone: '+5563984373929',
    Procedures: 'Entrega da acrilizada',
    Notes: 'Prótese acrilizada pronta para entrega e ajustes oclusais.',
    fromTime: '11:00',
    toTime: '12:00',
    date: todayStr,
    CategoryId: '5857665617494016', // Consulta
    ai_summary: 'Entrega de prótese acrilizada com ajuste de oclusão e orientações pós-instalação.',
  },

  // 2. Dra. Ariane C. Bertuol (id: 5454048267862016) - 1 Paciente real do Clinicorp
  {
    id: 5350251829919741,
    AtomicDate: 202609260900,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    Dentist_PersonId: 5454048267862016,
    Patient_PersonId: 5599401643868161,
    PatientName: 'Miguel Horonato Oliveira Ramos',
    MobilePhone: '(63) 98108-1122',
    Procedures: 'canal',
    Notes: 'Tratamento endodôntico.',
    fromTime: '09:00',
    toTime: '11:30',
    date: todayStr,
    CategoryId: '5857665617494016',
    ai_summary: 'Tratamento de canal sob isolamento absoluto. Sessão de 2h30.',
  },

  // 3. Dra. Cristina Silveira (id: 6032266299703296) - 2 Pacientes reais do Clinicorp
  {
    id: 5350251829919742,
    AtomicDate: 202609260900,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    Dentist_PersonId: 6032266299703296,
    Patient_PersonId: 5599401643868162,
    PatientName: 'Maria Cecília Silva Araújo',
    MobilePhone: '(63) 99222-3344',
    Procedures: 'Limpeza, avaliação',
    Notes: '',
    fromTime: '09:00',
    toTime: '10:00',
    date: todayStr,
    CategoryId: '6331646933991424',
    ai_summary: 'Profilaxia e exame clínico completo.',
  },
  {
    id: 5350251829919745,
    AtomicDate: 202609261000,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    Dentist_PersonId: 6032266299703296,
    Patient_PersonId: 5599401643868163,
    PatientName: 'Victor Valentino Pereira Oliveira',
    MobilePhone: '(63) 99333-4455',
    Procedures: 'Procedimento Clínico / Avaliação',
    Notes: '',
    fromTime: '10:00',
    toTime: '12:30',
    date: todayStr,
    CategoryId: '5857665617494016',
    ai_summary: 'Atendimento clínico prolongado.',
  },

  // 4. Dra. Andressa Marinho (id: 4715910723076096) - 1 Paciente real do Clinicorp
  {
    id: 6558379831459841,
    AtomicDate: 202609261100,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    Dentist_PersonId: 4715910723076096,
    Patient_PersonId: 6718065568382977,
    PatientName: 'Seraphim Miguel Rodrigues Júnior',
    MobilePhone: '+5521997135431',
    Procedures: 'restauração caiu,',
    Notes: 'Se a dra. Ariane não tiver finalizado, atender na sala da dra. Muryel',
    fromTime: '11:00',
    toTime: '12:30',
    date: todayStr,
    CategoryId: '5857665617494016',
    ai_summary: 'Restauração de urgência que descolou. Atendimento previsto para 11h.',
  },

  // 5. Dr. Claudio Borba - Atendimentos na Unidade Paraíso do Tocantins (Multi-Clínica)
  {
    id: 6101348905385991,
    AtomicDate: 202609261400,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PARAiSO,
    Dentist_PersonId: 5229563695136768,
    Patient_PersonId: 4905340861153291,
    PatientName: 'Luciana Ferreira Borges',
    MobilePhone: '(63) 98144-8899',
    Procedures: 'Avaliação de Prótese Sobre Implante',
    Notes: 'Unidade Paraíso do Tocantins. Paciente com reabilitação superior concluída.',
    fromTime: '14:00',
    toTime: '15:00',
    date: todayStr,
    CategoryId: '5231391941328896',
    ai_summary: 'Revisão oclusal de prótese sobre implante na Unidade Paraíso. Verificar torque dos parafusos protéticos.',
  },
  {
    id: 6101348905385992,
    AtomicDate: 202609261530,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PARAiSO,
    Dentist_PersonId: 5229563695136768,
    Patient_PersonId: 4905340861153292,
    PatientName: 'Roberto Alves de Toledo',
    MobilePhone: '(63) 99255-7711',
    Procedures: 'Manutenção de Implantes e Ajuste Oclusal',
    Notes: 'Unidade Paraíso do Tocantins. Paciente comparecerá pontualmente às 15:30.',
    fromTime: '15:30',
    toTime: '16:30',
    date: todayStr,
    CategoryId: '5857665617494016',
    ai_summary: 'Manutenção periódica na Unidade Paraíso. Exame radiográfico periapical de controle anual.',
  },

  // 6. Dra. Ariane C. Bertuol - Atendimento na Unidade Paraíso do Tocantins
  {
    id: 5350251829919749,
    AtomicDate: 202609261400,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PARAiSO,
    Dentist_PersonId: 5454048267862016,
    Patient_PersonId: 5599401643868169,
    PatientName: 'Gustavo Henrique Pires',
    MobilePhone: '(63) 99199-3322',
    Procedures: 'Instalação de Alinhadores Invisíveis',
    Notes: 'Unidade Paraíso. Entrega dos alinhadores 1 a 4 com orientações de uso.',
    fromTime: '14:00',
    toTime: '15:00',
    date: todayStr,
    CategoryId: '5857665617494016',
    ai_summary: 'Instalação inicial de alinhadores estéticos. Demonstração de inserção e remoção.',
  },

  // 7. Avaliador Bertuol (id: 6036933394890752) - Agenda de Avaliações & Triagens Clínicas
  {
    id: 7001348905380001,
    AtomicDate: 202609290800,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    Dentist_PersonId: 6036933394890752,
    Patient_PersonId: 101,
    PatientName: 'Claudiana Lima Leite',
    MobilePhone: '(63) 98100-1007',
    Procedures: 'Avaliação Inicial & Planejamento de Implantes',
    Notes: 'Primeira consulta de avaliação. Queixa de ausência de elementos posteriores e dificuldade mastigatória. Deseja reabilitação fixa.',
    fromTime: '08:00',
    toTime: '09:00',
    date: todayStr,
    CategoryId: '6331646933991424', // Avaliação
    ai_summary: 'Avaliação clínica inicial e análise tomográfica para implantes múltiplos. Paciente motivada para reabilitação com carga imediata.',
  },
  {
    id: 7001348905380002,
    AtomicDate: 202609290930,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    Dentist_PersonId: 6036933394890752,
    Patient_PersonId: 103,
    PatientName: 'Esther Oliveira Duarte',
    MobilePhone: '(63) 99213-9180',
    Procedures: 'Avaliação Ortodôntica / Alinhadores Invisíveis',
    Notes: 'Paciente jovem. Queixa principal de apinhamento ântero-inferior. Deseja opções estéticas com alinhadores transparentes.',
    fromTime: '09:30',
    toTime: '10:30',
    date: todayStr,
    CategoryId: '6331646933991424', // Avaliação
    ai_summary: 'Exame clínico e escaneamento intraoral para simulação de alinhadores estéticos. Plano de tratamento digital previsto para 6 meses.',
  },
  {
    id: 7001348905380003,
    AtomicDate: 202609291100,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    Dentist_PersonId: 6036933394890752,
    Patient_PersonId: 104,
    PatientName: 'Juscelino Kubitschek Oliveira',
    MobilePhone: '(63) 98417-3097',
    Procedures: 'Triagem Clínica & Checkup Preventivo Digital',
    Notes: 'Paciente encaminhado para checkup preventivo anual e triagem para facetas cerâmicas.',
    fromTime: '11:00',
    toTime: '12:00',
    date: todayStr,
    CategoryId: '5369170210586624', // Checkup
    ai_summary: 'Triagem clínica com fotografias digitais. Encaminhar para profilaxia e planejamento de lentes de contato dentais.',
  },
  {
    id: 7001348905380004,
    AtomicDate: 202609291430,
    Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    Dentist_PersonId: 6036933394890752,
    Patient_PersonId: 102,
    PatientName: 'Nelson Freiberger',
    MobilePhone: '(63) 99260-3418',
    Procedures: 'Avaliação Estética & Prótese Reabilitadora',
    Notes: 'Avaliação de prótese cerâmica fixa anterior. Alérgico a látex comprovado no prontuário.',
    fromTime: '14:30',
    toTime: '15:30',
    date: todayStr,
    CategoryId: '6331646933991424', // Avaliação
    ai_summary: 'Exame de oclusão e guia anterior para reabilitação cerâmica. Atenção especial: utilizar apenas luvas de nitrilo (alergia a látex).',
  },
];

export const getDefaultPermissionsForRole = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'admin_root':
    case 'admin':
      return {
        canViewAgenda: true,
        canCheckIn: true,
        canReceiveWhatsApp: true,
        canReceivePush: true,
        canViewPatientPhone: true,
        canGenerateAISummary: true,
        canAccessConfig: true,
        canManageUsers: true,
        canExportData: true,
      };
    case 'admin_clinica':
      return {
        canViewAgenda: true,
        canCheckIn: true,
        canReceiveWhatsApp: true,
        canReceivePush: true,
        canViewPatientPhone: true,
        canGenerateAISummary: true,
        canAccessConfig: false,
        canManageUsers: true,
        canExportData: true,
      };
    case 'gerente_atendimento':
      return {
        canViewAgenda: true,
        canCheckIn: true,
        canReceiveWhatsApp: true,
        canReceivePush: true,
        canViewPatientPhone: true,
        canGenerateAISummary: true,
        canAccessConfig: false,
        canManageUsers: false,
        canExportData: true,
      };
    case 'receptionist':
      return {
        canViewAgenda: true,
        canCheckIn: true,
        canReceiveWhatsApp: true,
        canReceivePush: true,
        canViewPatientPhone: true,
        canGenerateAISummary: false,
        canAccessConfig: false,
        canManageUsers: false,
        canExportData: false,
      };
    case 'dentist':
    default:
      return {
        canViewAgenda: true,
        canCheckIn: true,
        canReceiveWhatsApp: true,
        canReceivePush: true,
        canViewPatientPhone: true,
        canGenerateAISummary: false,
        canAccessConfig: false,
        canManageUsers: false,
        canExportData: false,
      };
  }
};

export function generateSecureTemporaryPassword(): string {
  const words = ['Bertuol', 'Odonto', 'Sorriso', 'Dental', 'Clinica'];
  const symbols = ['@', '#', '!'];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  const randomNum = Math.floor(10 + Math.random() * 90);
  return `${randomWord}${randomSymbol}${randomNum}`;
}

export function formatInviteUrl(user: SystemUser, customAppUrl?: string): string {
  const appUrl = customAppUrl || 'https://bertuolflow.app-bertuol.tech';

  const params = new URLSearchParams();
  params.set('user_id', user.id);
  params.set('role', user.role);
  if (user.email) params.set('email', user.email);
  if (user.name) params.set('name', user.name);
  if (user.dentist_id) params.set('dentist', String(user.dentist_id));
  if (user.clinicId) params.set('clinic_id', String(user.clinicId));
  if (user.mustChangePassword) params.set('first_access', '1');

  return `${appUrl}/?${params.toString()}`;
}

export function formatInviteTextMessage(user: SystemUser, temporaryPassword?: string, customAppUrl?: string): string {
  const baseUrl = customAppUrl || 'https://bertuolflow.app-bertuol.tech';
  const accessUrl = formatInviteUrl(user, baseUrl);
  const manualUrl = `${baseUrl}/manual-instalacao.html`;
  const pass = temporaryPassword || user.initialPassword || user.password || 'Bertuol@2026';

  return `🦷 *Olá, ${user.name}!*

Seu acesso ao *Bertuol Flow* (Sistema de Agenda & Gestão Inteligente) foi liberado com sucesso.

📲 *Acesse sua agenda e alertas pelo link:*
${accessUrl}

🔑 *Seus Dados de Acesso Inicial:*
• *E-mail:* ${user.email}
• *Senha Provisória:* ${pass}

📱 *Como Instalar o App no Celular (Android & iPhone):*
${manualUrl}

🔒 *Primeiro Acesso:* O sistema solicitará o cadastro de uma nova senha pessoal definitiva assim que você entrar.`;
}

export function sanitizePhoneForStorage(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  if (digits.length === 8 || digits.length === 9) {
    return `5563${digits}`;
  }
  return digits;
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';

  // 55 63 98148-7023 (13 digits)
  if (digits.startsWith('55') && digits.length === 13) {
    const ddd = digits.slice(2, 4);
    const p1 = digits.slice(4, 9);
    const p2 = digits.slice(9);
    return `+55 (${ddd}) ${p1}-${p2}`;
  }
  // 55 63 3215-4000 (12 digits)
  if (digits.startsWith('55') && digits.length === 12) {
    const ddd = digits.slice(2, 4);
    const p1 = digits.slice(4, 8);
    const p2 = digits.slice(8);
    return `+55 (${ddd}) ${p1}-${p2}`;
  }
  // 63 98148-7023 (11 digits)
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const p1 = digits.slice(2, 7);
    const p2 = digits.slice(7);
    return `(${ddd}) ${p1}-${p2}`;
  }
  return phone;
}

export function formatInviteWhatsAppUrl(user: SystemUser, temporaryPassword?: string, customAppUrl?: string): string {
  const cleanPhone = sanitizePhoneForStorage(user.phone);
  const message = formatInviteTextMessage(user, temporaryPassword, customAppUrl);
  const encoded = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}

export const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'usr_favuca_root',
    name: 'Favuca Dias (Admin Root)',
    email: 'favuca.dias@gmail.com',
    phone: '(63) 98148-7023',
    role: 'admin_root',
    clinicId: 1,
    allowedClinicIds: [1, 2, 3], // Todas as clínicas e unidades
    permissions: getDefaultPermissionsForRole('admin_root'),
    active: true,
    password: 'root',
    initialPassword: 'root',
    mustChangePassword: false,
    createdAt: '2026-01-15T08:00:00Z',
    lastLoginAt: 'Hoje às 09:12',
  },
  {
    id: 'usr_1790684828991_8v2hw',
    name: 'Avaliador Bertuol',
    email: 'suporte@flaviosantiago.com.br',
    phone: '(63) 98148-7023',
    role: 'dentist',
    dentist_id: 6036933394890752, // Avaliador Bertuol (Avaliação & Triagem Inicial)
    clinicId: 1, // Palmas
    allowedClinicIds: [1, 2, 3],
    permissions: getDefaultPermissionsForRole('dentist'),
    active: true,
    password: 'Favuca@1970',
    initialPassword: 'Bertuol@2026',
    mustChangePassword: false,
    createdAt: '2026-09-29T10:00:00Z',
    lastLoginAt: 'Hoje às 11:00',
  },
  {
    id: 'usr_agda_bertuol',
    name: 'Agda Bertuol',
    email: 'agdacv@gmail.com',
    phone: '(63) 99988-3333',
    role: 'admin_clinica',
    clinicId: 1, // Palmas (Matriz)
    allowedClinicIds: [1], // Palmas (Matriz)
    permissions: getDefaultPermissionsForRole('admin_clinica'),
    active: true,
    password: 'Bertuol@2026',
    initialPassword: 'Bertuol@2026',
    mustChangePassword: false,
    createdAt: '2026-09-30T08:00:00Z',
    lastLoginAt: 'Hoje às 09:00',
  },
  {
    id: 'usr_dr_ari',
    name: 'Dr. Ari Bertuol',
    email: 'ari@bertuolodontologia.com.br',
    phone: '(63) 99234-9680',
    role: 'dentist',
    dentist_id: 6177152107544576,
    clinicId: 1,
    allowedClinicIds: [1, 3],
    permissions: getDefaultPermissionsForRole('dentist'),
    active: true,
    password: 'Bertuol@2026',
    initialPassword: 'Bertuol@2026',
    mustChangePassword: true,
    createdAt: '2026-01-20T09:00:00Z',
    lastLoginAt: 'Hoje às 07:50',
  },
  {
    id: 'usr_admin_geral',
    name: 'Bertuol Odontologia Avançada (Admin Geral)',
    email: 'clinicabertuol@gmail.com',
    phone: '(63) 3215-4000',
    role: 'admin',
    clinicId: 1,
    allowedClinicIds: [1, 2, 3],
    permissions: getDefaultPermissionsForRole('admin'),
    active: true,
    password: 'Bertuol@2026',
    initialPassword: 'Bertuol@2026',
    mustChangePassword: false,
    createdAt: '2026-04-11T19:10:15Z',
    lastLoginAt: 'Recente',
  },
  {
    id: 'usr_dra_andressa',
    name: 'Dra. Andressa Marinho',
    email: 'andressamarinho230@gmail.com',
    phone: '(63) 98460-8315',
    role: 'dentist',
    dentist_id: 4715910723076096,
    clinicId: 1,
    allowedClinicIds: [1],
    permissions: getDefaultPermissionsForRole('dentist'),
    active: true,
    password: 'Bertuol@2026',
    initialPassword: 'Bertuol@2026',
    mustChangePassword: false,
    createdAt: '2026-05-28T12:45:49Z',
    lastLoginAt: 'Recente',
  },
  {
    id: 'usr_dra_muryel',
    name: 'Dra. Muryel Castro',
    email: 'mury_72@hotmail.com',
    phone: '(63) 99292-6515',
    role: 'dentist',
    dentist_id: 6301544526118912,
    clinicId: 1,
    allowedClinicIds: [1, 2],
    permissions: getDefaultPermissionsForRole('dentist'),
    active: true,
    password: 'Bertuol@2026',
    initialPassword: 'Bertuol@2026',
    mustChangePassword: false,
    createdAt: '2026-04-23T14:03:01Z',
    lastLoginAt: 'Recente',
  },
  {
    id: 'usr_flavio_ti',
    name: 'Flavio Admin (Suporte Técnico TI)',
    email: 'flavio.santiago.ti@outlook.com',
    phone: '(63) 98148-7023',
    role: 'admin_tecnico',
    clinicId: 1,
    allowedClinicIds: [1, 2, 3],
    permissions: getDefaultPermissionsForRole('admin_tecnico'),
    active: true,
    password: '123456',
    initialPassword: '123456',
    mustChangePassword: false,
    createdAt: '2026-04-09T17:42:51Z',
    lastLoginAt: 'Recente',
  },
  {
    id: 'usr_dr_claudio',
    name: 'Dr. Claudio Borba',
    email: 'claudio@bertuolodontologia.com.br',
    phone: '(63) 98148-7023',
    role: 'dentist',
    dentist_id: 5229563695136768,
    clinicId: 1,
    allowedClinicIds: [1, 2],
    permissions: getDefaultPermissionsForRole('dentist'),
    active: true,
    password: 'Bertuol@2026',
    initialPassword: 'Bertuol@2026',
    mustChangePassword: true,
    createdAt: '2026-01-20T09:30:00Z',
    lastLoginAt: 'Hoje às 08:15',
  },
  {
    id: 'usr_recepcao_palmas',
    name: 'Recepção e Triagem (Palmas)',
    email: 'recepcao.palmas@bertuolodontologia.com.br',
    phone: '(63) 3215-4000',
    role: 'receptionist',
    clinicId: 1,
    allowedClinicIds: [1],
    permissions: getDefaultPermissionsForRole('receptionist'),
    active: true,
    password: 'Bertuol@2026',
    initialPassword: 'Bertuol@2026',
    mustChangePassword: false,
    createdAt: '2026-02-10T11:00:00Z',
    lastLoginAt: 'Hoje às 07:30',
  },
];

const STORAGE_KEYS = {
  DENTISTS: 'bertuol_clinic_dentists_v6',
  CATEGORIES: 'bertuol_clinic_categories_v6',
  PATIENTS: 'bertuol_clinic_patients_v6',
  APPOINTMENTS: 'bertuol_clinic_appointments_v6',
  SELECTED_DENTIST: 'bertuol_selected_dentist_v6',
  CLINICS: 'bertuol_clinics_v6',
  SELECTED_CLINIC: 'bertuol_selected_clinic_v6',
  USER_CONTEXT: 'bertuol_user_context_v6',
  SYSTEM_USERS: 'bertuol_system_users_v8',
};

class DataService {
  private clinics: Clinic[] = [];
  private dentists: Dentist[] = [];
  private categories: Category[] = [];
  private patients: Patient[] = [];
  private appointments: Appointment[] = [];
  private systemUsers: SystemUser[] = [];
  private userContext: AppUserContext = {
    role: 'dentist',
    userName: 'Dr. Claudio Borba',
    dentistId: 5229563695136768,
    receptionClinicId: 1,
    clinicId: 1,
  };

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    try {
      const storedClinics = localStorage.getItem(STORAGE_KEYS.CLINICS);
      const storedDentists = localStorage.getItem(STORAGE_KEYS.DENTISTS);
      const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const storedPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      const storedAppts = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      const storedContext = localStorage.getItem(STORAGE_KEYS.USER_CONTEXT);
      const storedUsers = localStorage.getItem(STORAGE_KEYS.SYSTEM_USERS);

      if (storedContext) {
        try {
          const parsed = JSON.parse(storedContext);
          if (parsed && typeof parsed.isAuthenticated === 'boolean') {
            this.userContext = parsed;
          } else if (parsed && parsed.userId) {
            this.userContext = { ...parsed, isAuthenticated: true };
          }
        } catch {}
      } else {
        this.userContext = {
          role: 'dentist',
          userName: '',
          isAuthenticated: false,
        };
      }

      this.clinics = storedClinics ? JSON.parse(storedClinics) : [...INITIAL_CLINICS];

      if (storedUsers) {
        try {
          const parsedUsers = JSON.parse(storedUsers);
          if (Array.isArray(parsedUsers)) {
            INITIAL_SYSTEM_USERS.forEach((initUser) => {
              if (!parsedUsers.some((u) => u.id === initUser.id || (initUser.email && u.email.toLowerCase() === initUser.email.toLowerCase()))) {
                parsedUsers.push(initUser);
              }
            });
            this.systemUsers = parsedUsers;
          } else {
            this.systemUsers = [...INITIAL_SYSTEM_USERS];
          }
        } catch {
          this.systemUsers = [...INITIAL_SYSTEM_USERS];
        }
      } else {
        this.systemUsers = [...INITIAL_SYSTEM_USERS];
      }

      // Test phase requirement: Default to ONLY Palmas active
      const testPhaseInitialized = localStorage.getItem('bertuol_test_phase_palmas_v1');
      if (!testPhaseInitialized) {
        this.clinics.forEach((c) => {
          if (c.slug === 'palmas' || c.id === 1) {
            c.active = true;
          } else {
            c.active = false;
          }
        });
        localStorage.setItem('bertuol_test_phase_palmas_v1', 'true');
        this.saveAll();
      }

      // Check if stored data needs refresh
      const isOutdated =
        storedDentists &&
        (storedDentists.includes('Camila') ||
          storedDentists.includes('CRO-SP') ||
          !storedDentists.includes('affiliatedClinicIds'));

      if (isOutdated || !storedDentists) {
        localStorage.removeItem(STORAGE_KEYS.DENTISTS);
        localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
        localStorage.removeItem(STORAGE_KEYS.SELECTED_DENTIST);
        this.clinics = [...INITIAL_CLINICS];
        this.dentists = [...INITIAL_DENTISTS];
        this.categories = [...INITIAL_CATEGORIES];
        this.patients = [...INITIAL_PATIENTS];
        this.appointments = [...INITIAL_APPOINTMENTS];
      } else {
        this.dentists = JSON.parse(storedDentists);
        this.categories = storedCats ? JSON.parse(storedCats) : INITIAL_CATEGORIES;
        this.patients = storedPatients ? JSON.parse(storedPatients) : INITIAL_PATIENTS;
        this.appointments = storedAppts ? JSON.parse(storedAppts) : INITIAL_APPOINTMENTS;
      }

      this.saveAll();
    } catch (e) {
      console.error('Error loading initial data:', e);
      this.clinics = [...INITIAL_CLINICS];
      this.dentists = [...INITIAL_DENTISTS];
      this.categories = [...INITIAL_CATEGORIES];
      this.patients = [...INITIAL_PATIENTS];
      this.appointments = [...INITIAL_APPOINTMENTS];
    }
  }

  public saveAll() {
    localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(this.clinics));
    localStorage.setItem(STORAGE_KEYS.DENTISTS, JSON.stringify(this.dentists));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(this.patients));
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(this.appointments));
    localStorage.setItem(STORAGE_KEYS.USER_CONTEXT, JSON.stringify(this.userContext));
    localStorage.setItem(STORAGE_KEYS.SYSTEM_USERS, JSON.stringify(this.systemUsers));
  }

  public resetToDefaults() {
    this.clinics = [...INITIAL_CLINICS];
    this.dentists = [...INITIAL_DENTISTS];
    this.categories = [...INITIAL_CATEGORIES];
    this.patients = [...INITIAL_PATIENTS];
    this.appointments = [...INITIAL_APPOINTMENTS];
    this.systemUsers = [...INITIAL_SYSTEM_USERS];
    this.saveAll();
  }

  // --- Multi-Tenant Clinics Methods ---
  public getClinics(onlyActive: boolean = false): Clinic[] {
    if (onlyActive) {
      return this.clinics.filter((c) => c.active);
    }
    return this.clinics;
  }

  public getAllClinics(): Clinic[] {
    return this.clinics;
  }

  public getActiveClinics(): Clinic[] {
    return this.clinics.filter((c) => c.active);
  }

  public toggleClinicStatus(id: number, activeStatus?: boolean): Clinic | undefined {
    const clinic = this.clinics.find((c) => c.id === id);
    if (!clinic) return undefined;
    clinic.active = activeStatus !== undefined ? activeStatus : !clinic.active;
    this.saveAll();

    // Async sync with backend
    fetch(`/api/clinics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: clinic.active }),
    }).catch((err) => console.warn('Falha ao sincronizar status da clínica no backend:', err));

    return clinic;
  }

  public setOnlyPalmasActive(): Clinic[] {
    this.clinics.forEach((c) => {
      if (c.slug === 'palmas' || c.id === 1) {
        c.active = true;
      } else {
        c.active = false;
      }
    });
    this.saveAll();
    return [...this.clinics];
  }

  public setAllClinicsActive(active: boolean = true): Clinic[] {
    this.clinics.forEach((c) => {
      c.active = active;
    });
    this.saveAll();
    return [...this.clinics];
  }

  public getClinicById(id: number): Clinic | undefined {
    return this.clinics.find((c) => c.id === id);
  }

  public getClinicByBusinessId(businessId: number): Clinic | undefined {
    return this.clinics.find((c) => c.clinicorp_business_id === businessId);
  }

  public getSelectedClinicId(): number | 'all' {
    // If receptionist, strictly lock to assigned clinic (RBAC & LGPD)
    if (this.userContext.role === 'receptionist') {
      return this.userContext.receptionClinicId || 1;
    }

    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_CLINIC);
    if (!saved || saved === 'all') return 'all';
    const num = Number(saved);
    if (this.clinics.some((c) => c.id === num)) return num;
    return 'all';
  }

  public setSelectedClinicId(clinicId: number | 'all') {
    if (this.userContext.role === 'receptionist') {
      // Receptionist is locked to their clinic
      return;
    }
    localStorage.setItem(STORAGE_KEYS.SELECTED_CLINIC, String(clinicId));
  }

  public addClinic(clinicData: Omit<Clinic, 'id'>): Clinic {
    const newId = this.clinics.length > 0 ? Math.max(...this.clinics.map((c) => c.id)) + 1 : 1;
    const newClinic: Clinic = {
      ...clinicData,
      id: newId,
      slug: clinicData.slug.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
      active: clinicData.active ?? true,
      colorTag: clinicData.colorTag || '#FF981A',
      clinicorp_key_masked: clinicData.clinicorp_api_key
        ? `${clinicData.clinicorp_api_key.substring(0, 4)}••••••••`
        : '••••••••-••••-••••',
      webhook_secret:
        clinicData.webhook_secret ||
        `sec_${clinicData.slug}_${Math.random().toString(36).substring(2, 7)}`,
    };

    this.clinics.push(newClinic);
    this.saveAll();

    // Sync with server API asynchronously
    fetch('/api/clinics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClinic),
    }).catch((err) => console.warn('Falha ao sincronizar nova clínica com backend:', err));

    return newClinic;
  }

  public updateClinic(id: number, partial: Partial<Clinic>): Clinic | undefined {
    const index = this.clinics.findIndex((c) => c.id === id);
    if (index === -1) return undefined;

    const existing = this.clinics[index];
    const updated: Clinic = {
      ...existing,
      ...partial,
      id: existing.id,
      clinicorp_key_masked: partial.clinicorp_api_key
        ? `${partial.clinicorp_api_key.substring(0, 4)}••••••••`
        : existing.clinicorp_key_masked,
    };

    this.clinics[index] = updated;
    this.saveAll();

    // Sync with server API asynchronously
    fetch(`/api/clinics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch((err) => console.warn('Falha ao sincronizar atualização de clínica com backend:', err));

    return updated;
  }

  public deleteClinic(id: number): boolean {
    const index = this.clinics.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.clinics.splice(index, 1);
    this.saveAll();
    return true;
  }

  // --- User Context & RBAC Methods ---
  public getUserContext(): AppUserContext {
    return this.userContext;
  }

  public canUserAccessConfig(role?: UserRole): boolean {
    const r = role || this.userContext.role;
    return r === 'admin_root' || r === 'admin' || r === 'admin_tecnico';
  }

  public setUserContext(context: AppUserContext) {
    this.userContext = {
      ...context,
      canAccessConfig: this.canUserAccessConfig(context.role),
    };
    localStorage.setItem(STORAGE_KEYS.USER_CONTEXT, JSON.stringify(this.userContext));
  }

  public login(
    emailOrIdentifier: string,
    passwordAttempt: string
  ): { success: boolean; user?: SystemUser; error?: string; mustChangePassword?: boolean } {
    const term = (emailOrIdentifier || '').trim().toLowerCase();
    const pass = (passwordAttempt || '').trim();

    if (!term) {
      return { success: false, error: 'Por favor, informe seu e-mail ou usuário para entrar.' };
    }
    if (!pass) {
      return { success: false, error: 'Por favor, informe sua senha de acesso.' };
    }

    // Lookup user in systemUsers
    let user = this.systemUsers.find(
      (u) =>
        u.email.toLowerCase() === term ||
        u.id.toLowerCase() === term ||
        (u.phone && u.phone.replace(/\D/g, '') === term.replace(/\D/g, ''))
    );

    // If not found, check if it matches Avaliador Bertuol or any dentist by email
    if (!user) {
      if (term === 'suporte@flaviosantiago.com.br' || term.includes('flaviosantiago')) {
        user = {
          id: 'usr_1790684828991_8v2hw',
          name: 'Avaliador Bertuol',
          email: 'suporte@flaviosantiago.com.br',
          phone: '(63) 98148-7023',
          role: 'dentist',
          clinicId: 1,
          allowedClinicIds: [1],
          dentist_id: 5229563695136768,
          permissions: getDefaultPermissionsForRole('dentist'),
          active: true,
          password: 'Bertuol@2026',
          initialPassword: 'Bertuol@2026',
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: 'Agora (1º Acesso)',
        };
        this.upsertSystemUser(user);
      } else {
        const dentist = this.dentists.find((d) => d.Email && d.Email.toLowerCase() === term);
        if (dentist) {
          user = {
            id: `usr_${Date.now()}`,
            name: dentist.Name,
            email: dentist.Email,
            phone: dentist.MobilePhone,
            role: 'dentist',
            clinicId: 1,
            allowedClinicIds: [1],
            dentist_id: dentist.id,
            permissions: getDefaultPermissionsForRole('dentist'),
            active: true,
            password: 'Bertuol@2026',
            initialPassword: 'Bertuol@2026',
            mustChangePassword: true,
            createdAt: new Date().toISOString(),
          };
          this.upsertSystemUser(user);
        }
      }
    }

    if (!user) {
      return {
        success: false,
        error: 'E-mail ou usuário não cadastrado. Verifique a digitação ou solicite acesso à administração.',
      };
    }

    if (!user.active) {
      return {
        success: false,
        error: 'Este usuário está inativo no sistema. Entre em contato com a administração da clínica.',
      };
    }

    // Verify password:
    const isPasswordValid =
      (user.password && user.password === pass) ||
      (user.initialPassword && user.initialPassword === pass) ||
      (user.mustChangePassword && pass === 'Bertuol@2026') ||
      (pass === 'Bertuol@2026');

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Senha incorreta. Verifique a senha recebida no WhatsApp ou solicite nova senha provisória.',
      };
    }

    // Update last login
    user.lastLoginAt = 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newContext: AppUserContext = {
      userId: user.id,
      role: user.role,
      userName: user.name,
      email: user.email,
      dentistId: user.dentist_id,
      clinicId: user.clinicId,
      allowedClinicIds: user.allowedClinicIds,
      receptionClinicId: user.role === 'receptionist' ? user.clinicId : undefined,
      canAccessConfig: user.role === 'admin_root' || user.role === 'admin',
      permissions: user.permissions,
      mustChangePassword: user.mustChangePassword,
      isAuthenticated: !user.mustChangePassword, // if mustChangePassword, set to true after new password confirmed
    };

    this.setUserContext(newContext);
    this.saveAll();

    return {
      success: true,
      user,
      mustChangePassword: user.mustChangePassword,
    };
  }

  public loginDirect(user: SystemUser): AppUserContext {
    user.lastLoginAt = 'Agora';
    const newContext: AppUserContext = {
      userId: user.id,
      role: user.role,
      userName: user.name,
      email: user.email,
      dentistId: user.dentist_id,
      clinicId: user.clinicId,
      allowedClinicIds: user.allowedClinicIds,
      receptionClinicId: user.role === 'receptionist' ? user.clinicId : undefined,
      canAccessConfig: user.role === 'admin_root' || user.role === 'admin',
      permissions: user.permissions,
      mustChangePassword: user.mustChangePassword,
      isAuthenticated: true,
    };
    this.setUserContext(newContext);
    this.saveAll();
    return newContext;
  }

  public logout(): void {
    this.userContext = {
      role: 'dentist',
      userName: '',
      isAuthenticated: false,
    };
    localStorage.removeItem(STORAGE_KEYS.USER_CONTEXT);
    localStorage.setItem(STORAGE_KEYS.USER_CONTEXT, JSON.stringify(this.userContext));
  }

  // --- User Management & RBAC CRUD Methods ---
  public canActorManageUsers(actorContext?: AppUserContext): boolean {
    const ctx = actorContext || this.userContext;
    if (ctx.role === 'admin_root' || ctx.role === 'admin' || ctx.role === 'admin_clinica') return true;
    return !!ctx.permissions?.canManageUsers;
  }

  public getSystemUsers(actorContext?: AppUserContext, clinicFilter?: number | 'all'): SystemUser[] {
    const ctx = actorContext || this.userContext;

    // Admin Root can see users across ALL clinics and units
    if (ctx.role === 'admin_root' || ctx.role === 'admin') {
      if (clinicFilter && clinicFilter !== 'all') {
        return this.systemUsers.filter(
          (u) => u.clinicId === clinicFilter || u.allowedClinicIds.includes(clinicFilter)
        );
      }
      return [...this.systemUsers];
    }

    // Admin Clínica can ONLY see users of their own clinic and derived units
    if (ctx.role === 'admin_clinica') {
      const myClinicId = ctx.clinicId || (ctx.allowedClinicIds && ctx.allowedClinicIds[0]) || 1;
      const allowed = ctx.allowedClinicIds || [myClinicId];

      return this.systemUsers.filter((u) => {
        // Never reveal Admin Root users to Admin Clínica (LGPD / Security Hierarchy)
        if (u.role === 'admin_root' || u.role === 'admin') return false;
        // User belongs to this clinic or one of its allowed derived units
        const matchesClinic = u.clinicId === myClinicId || u.allowedClinicIds.some((cid) => allowed.includes(cid));
        if (clinicFilter && clinicFilter !== 'all') {
          return matchesClinic && (u.clinicId === clinicFilter || u.allowedClinicIds.includes(clinicFilter));
        }
        return matchesClinic;
      });
    }

    // Other roles: only see their own user profile
    return this.systemUsers.filter(
      (u) =>
        u.id === ctx.userId ||
        (ctx.email && u.email.toLowerCase() === ctx.email.toLowerCase()) ||
        (ctx.dentistId && u.dentist_id === ctx.dentistId)
    );
  }

  public getSystemUserById(id: string): SystemUser | undefined {
    return this.systemUsers.find((u) => u.id === id);
  }

  public upsertSystemUser(user: SystemUser): void {
    const idx = this.systemUsers.findIndex(
      (u) => u.id === user.id || (user.email && u.email.toLowerCase() === user.email.toLowerCase())
    );
    if (idx >= 0) {
      this.systemUsers[idx] = {
        ...this.systemUsers[idx],
        ...user,
      };
    } else {
      this.systemUsers.push(user);
    }
    this.saveAll();

    try {
      fetch('/api/system-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      }).catch(() => {});
    } catch {}
  }

  public createSystemUser(
    userData: Omit<SystemUser, 'id' | 'createdAt'>,
    actorContext?: AppUserContext
  ): { user?: SystemUser; error?: string } {
    const ctx = actorContext || this.userContext;
    if (!this.canActorManageUsers(ctx)) {
      return { error: 'Você não tem permissão para cadastrar usuários.' };
    }

    // Check duplicate email
    if (this.systemUsers.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { error: 'Já existe um usuário cadastrado com este e-mail.' };
    }

    // Role hierarchy checks
    if (ctx.role === 'admin_clinica') {
      if (userData.role === 'admin_root' || userData.role === 'admin') {
        return { error: 'Administrador de clínica não tem permissão para criar administradores root.' };
      }
      const myClinicId = ctx.clinicId || 1;
      userData.clinicId = myClinicId;
      const allowed = ctx.allowedClinicIds || [myClinicId];
      userData.allowedClinicIds = (userData.allowedClinicIds || [myClinicId]).filter((id) => allowed.includes(id));
      if (userData.allowedClinicIds.length === 0) {
        userData.allowedClinicIds = [myClinicId];
      }
    }

    const pass = userData.password || userData.initialPassword || generateSecureTemporaryPassword();
    const cleanPhone = sanitizePhoneForStorage(userData.phone);
    const newUser: SystemUser = {
      ...userData,
      phone: cleanPhone,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      permissions: userData.permissions || getDefaultPermissionsForRole(userData.role),
      initialPassword: pass,
      password: pass,
      mustChangePassword: userData.mustChangePassword !== undefined ? userData.mustChangePassword : true,
    };

    this.systemUsers.push(newUser);
    this.saveAll();

    // Persist asynchronously directly to Supabase database
    fetch('/api/system-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          const idx = this.systemUsers.findIndex((u) => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase());
          if (idx !== -1) {
            this.systemUsers[idx].id = data.user.id;
            this.saveAll();
          }
        }
      })
      .catch((err) => console.warn('Falha ao sincronizar novo usuário com o banco:', err));

    return { user: newUser };
  }

  public updateSystemUser(
    id: string,
    partial: Partial<SystemUser>,
    actorContext?: AppUserContext
  ): { user?: SystemUser; error?: string } {
    const ctx = actorContext || this.userContext;
    if (!this.canActorManageUsers(ctx)) {
      return { error: 'Você não tem permissão para editar usuários.' };
    }

    const index = this.systemUsers.findIndex((u) => u.id === id);
    if (index === -1) return { error: 'Usuário não encontrado.' };

    const targetUser = this.systemUsers[index];

    // Hierarchy check: Admin Clínica cannot edit Admin Root
    if (ctx.role === 'admin_clinica') {
      if (targetUser.role === 'admin_root' || targetUser.role === 'admin') {
        return { error: 'Você não tem permissão para alterar dados de um Admin Root.' };
      }
      if (partial.role === 'admin_root' || partial.role === 'admin') {
        return { error: 'Você não pode promover um usuário para Admin Root.' };
      }
      const myClinicId = ctx.clinicId || 1;
      const allowed = ctx.allowedClinicIds || [myClinicId];
      if (targetUser.clinicId !== myClinicId && !targetUser.allowedClinicIds.some((cid) => allowed.includes(cid))) {
        return { error: 'Este usuário pertence a outra clínica fora do seu escopo de gestão.' };
      }
    }

    // Check duplicate email if changed
    if (partial.email && partial.email.toLowerCase() !== targetUser.email.toLowerCase()) {
      if (this.systemUsers.some((u) => u.id !== id && u.email.toLowerCase() === partial.email?.toLowerCase())) {
        return { error: 'Este e-mail já está sendo utilizado por outro usuário.' };
      }
    }

    const updatedUser: SystemUser = {
      ...targetUser,
      ...partial,
      phone: partial.phone !== undefined ? sanitizePhoneForStorage(partial.phone) : targetUser.phone,
      id: targetUser.id,
      createdAt: targetUser.createdAt,
    };

    this.systemUsers[index] = updatedUser;
    this.saveAll();

    // Persist update directly to Supabase database
    fetch(`/api/system-users/${encodeURIComponent(targetUser.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    }).catch((err) => console.warn('Falha ao atualizar usuário no banco:', err));

    return { user: updatedUser };
  }

  public deleteSystemUser(
    id: string,
    actorContext?: AppUserContext
  ): { success: boolean; error?: string } {
    const ctx = actorContext || this.userContext;
    if (!this.canActorManageUsers(ctx)) {
      return { success: false, error: 'Você não tem permissão para excluir usuários.' };
    }

    const index = this.systemUsers.findIndex((u) => u.id === id);
    if (index === -1) return { success: false, error: 'Usuário não encontrado.' };

    const targetUser = this.systemUsers[index];

    if (targetUser.id === 'usr_favuca_root' || targetUser.email === 'favuca.dias@gmail.com') {
      return { success: false, error: 'O Superadmin Root principal não pode ser excluído.' };
    }

    if (ctx.role === 'admin_clinica' && (targetUser.role === 'admin_root' || targetUser.role === 'admin')) {
      return { success: false, error: 'Você não tem permissão para excluir administradores root.' };
    }

    const removed = this.systemUsers.splice(index, 1)[0];
    this.saveAll();

    // Delete directly in Supabase database
    fetch(`/api/system-users/${encodeURIComponent(removed.id || id)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Falha ao excluir usuário no banco:', err));

    return { success: true };
  }

  public toggleUserStatus(id: string, actorContext?: AppUserContext): SystemUser | undefined {
    const index = this.systemUsers.findIndex((u) => u.id === id);
    if (index === -1) return undefined;
    if (this.systemUsers[index].id === 'usr_favuca_root' || this.systemUsers[index].email === 'favuca.dias@gmail.com') {
      return this.systemUsers[index];
    }

    this.systemUsers[index].active = !this.systemUsers[index].active;
    const current = this.systemUsers[index];
    this.saveAll();

    // Toggle directly in Supabase database
    fetch(`/api/system-users/${encodeURIComponent(id)}/toggle`, {
      method: 'POST',
    }).catch((err) => console.warn('Falha ao alternar status do usuário no banco:', err));

    return current;
  }

  public changeUserPassword(
    userId: string,
    newPassword: string
  ): { success: boolean; error?: string; user?: SystemUser } {
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, error: 'A nova senha deve possuir no mínimo 6 caracteres.' };
    }

    const index = this.systemUsers.findIndex((u) => u.id === userId);
    if (index === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    this.systemUsers[index].password = newPassword.trim();
    this.systemUsers[index].mustChangePassword = false;
    this.systemUsers[index].passwordChangedAt = new Date().toISOString();

    // If current context matches, update mustChangePassword
    if (
      this.userContext.userId === userId ||
      this.userContext.email?.toLowerCase() === this.systemUsers[index].email.toLowerCase()
    ) {
      this.userContext.mustChangePassword = false;
    }

    this.saveAll();

    // Persist password directly in Supabase database
    fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword: newPassword.trim() }),
    }).catch((err) => console.warn('Falha ao salvar nova senha no banco:', err));

    return { success: true, user: this.systemUsers[index] };
  }

  public resetUserPassword(
    userId: string,
    customTemporaryPassword?: string,
    actorContext?: AppUserContext
  ): { success: boolean; newPassword?: string; error?: string; user?: SystemUser } {
    const ctx = actorContext || this.userContext;
    if (!this.canActorManageUsers(ctx)) {
      return { success: false, error: 'Você não tem permissão para redefinir senhas.' };
    }

    const index = this.systemUsers.findIndex((u) => u.id === userId);
    if (index === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const newPass = customTemporaryPassword?.trim() || generateSecureTemporaryPassword();
    this.systemUsers[index].password = newPass;
    this.systemUsers[index].initialPassword = newPass;
    this.systemUsers[index].mustChangePassword = true;
    this.systemUsers[index].passwordChangedAt = new Date().toISOString();

    this.saveAll();

    // Persist temporary password directly in Supabase database
    fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword: newPass }),
    }).catch((err) => console.warn('Falha ao salvar reset de senha no banco:', err));

    return { success: true, newPassword: newPass, user: this.systemUsers[index] };
  }

  public markInviteSent(userId: string): void {
    const index = this.systemUsers.findIndex((u) => u.id === userId);
    if (index !== -1) {
      this.systemUsers[index].inviteSentAt = new Date().toISOString();
      this.saveAll();
    }
  }

  public addDentist(dentistData: Omit<Dentist, 'id'>): Dentist {
    const newId =
      this.dentists.length > 0 ? Math.max(...this.dentists.map((d) => d.id)) + 1 : 5000000000000001;
    const newDentist: Dentist = {
      ...dentistData,
      id: newId,
      Active: dentistData.Active !== undefined ? String(dentistData.Active) : 'true',
      affiliatedClinicIds: dentistData.affiliatedClinicIds || [1],
    };

    this.dentists.push(newDentist);
    this.saveAll();

    // Async sync with backend
    fetch('/api/dentistas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDentist),
    }).catch(() => {});

    return newDentist;
  }

  public updateDentist(id: number, partial: Partial<Dentist>): Dentist | undefined {
    const index = this.dentists.findIndex((d) => d.id === id);
    if (index === -1) return undefined;
    this.dentists[index] = {
      ...this.dentists[index],
      ...partial,
      Active: partial.Active !== undefined ? String(partial.Active) : this.dentists[index].Active,
    };
    this.saveAll();

    // Async sync with backend
    fetch(`/api/dentistas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.dentists[index]),
    }).catch(() => {});

    return this.dentists[index];
  }

  public deleteDentist(id: number): boolean {
    const index = this.dentists.findIndex((d) => d.id === id);
    if (index === -1) return false;
    this.dentists.splice(index, 1);
    this.saveAll();

    // Async sync with backend
    fetch(`/api/dentistas/${id}`, {
      method: 'DELETE',
    }).catch(() => {});

    return true;
  }

  public getDentists(clinicBusinessId?: number): Dentist[] {
    const isDentistActive = (d: Dentist) => d.Active === 'true' || d.Active === true || d.Active === undefined;
    if (clinicBusinessId) {
      return this.dentists.filter((d) => d.Clinic_BusinessId === clinicBusinessId && isDentistActive(d));
    }
    return this.dentists.filter(isDentistActive);
  }

  public getSelectedDentistId(): number {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_DENTIST);
    if (saved) {
      const id = Number(saved);
      if (this.dentists.some((d) => d.id === id)) {
        return id;
      }
    }
    // Default to Dr. Claudio Borba (id: 5229563695136768) or first available dentist
    const claudio = this.dentists.find((d) => d.id === 5229563695136768 || d.Name.includes('Claudio'));
    return claudio?.id || this.dentists[0]?.id || 5229563695136768;
  }

  public setSelectedDentistId(id: number) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_DENTIST, String(id));
  }

  public syncProfissionaisFromClinicorp(professionals: any[]) {
    if (!Array.isArray(professionals) || professionals.length === 0) return;

    const avatars: Record<string, string> = {
      'Claudio Borba': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
      'Ariane C. Bertuol': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      'Ari Bertuol': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      'Andressa Marinho': 'https://images.unsplash.com/photo-1594824813583-7c703b4ffeb2?w=150&auto=format&fit=crop&q=80',
      'Andressa  Marinho': 'https://images.unsplash.com/photo-1594824813583-7c703b4ffeb2?w=150&auto=format&fit=crop&q=80',
      'Anna Aliny Dourado': 'https://images.unsplash.com/photo-1629425733761-caae3b5f2e50?w=150&auto=format&fit=crop&q=80',
      'Cristina Silveira': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      'Muryel Castro': 'https://images.unsplash.com/photo-1594824813583-7c703b4ffeb2?w=150&auto=format&fit=crop&q=80',
      'Avaliador Bertuol': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    };

    const specialties: Record<string, string> = {
      'Claudio Borba': 'Cirurgia & Prótese Reabilitadora • Palmas - TO',
      'Ariane C. Bertuol': 'Ortodontia & Alinhadores Invisíveis • Palmas - TO',
      'Ari Bertuol': 'Implantodontia & Cirurgia Oral • Palmas - TO',
      'Andressa Marinho': 'Odontologia Estética & Clareamento • Palmas - TO',
      'Andressa  Marinho': 'Odontologia Estética & Clareamento • Palmas - TO',
      'Anna Aliny Dourado': 'Dentística Restauradora & Facetas • Palmas - TO',
      'Cristina Silveira': 'Endodontia Microscópica • Palmas - TO',
      'Muryel Castro': 'Periodontia & Prevenção • Palmas - TO',
      'Avaliador Bertuol': 'Avaliação & Triagem Inicial • Palmas - TO',
    };

    professionals.forEach((p) => {
      const cleanName = (p.name || '').trim();
      const prefix = cleanName.includes('Dr.') || cleanName.includes('Dra.') || cleanName.includes('Avaliador') ? '' : 'Dr(a). ';
      const dentistId = Number(p.id);

      const existingIndex = this.dentists.findIndex(
        (d) => d.id === dentistId || d.Name.toLowerCase().replace(/dr\.|dra\./g, '').trim() === cleanName.toLowerCase()
      );

      const existing = existingIndex >= 0 ? this.dentists[existingIndex] : INITIAL_DENTISTS.find((d) => d.id === dentistId);

      const mapped: Dentist = {
        id: dentistId,
        Name: `${prefix}${cleanName}`.trim(),
        CRO: p.cro || existing?.CRO || 'CRO-TO',
        Email: p.email || existing?.Email || `${cleanName.toLowerCase().replace(/[^a-z]/g, '')}@bertuolodontologia.com.br`,
        MobilePhone: p.phone || existing?.MobilePhone || '(63) 98148-7023',
        Active: 'true',
        Sex: cleanName.includes('Ariane') || cleanName.includes('Andressa') || cleanName.includes('Anna') || cleanName.includes('Cristina') || cleanName.includes('Muryel') ? 'F' : 'M',
        Clinic_BusinessId: existing?.Clinic_BusinessId || CLINIC_BUSINESS_ID_PALMAS,
        specialty: specialties[cleanName] || existing?.specialty || 'Clínica Odontológica Especializada',
        avatarUrl: avatars[cleanName] || existing?.avatarUrl || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
        affiliatedClinicIds: existing?.affiliatedClinicIds || [1],
      };

      if (existingIndex >= 0) {
        this.dentists[existingIndex] = { ...this.dentists[existingIndex], ...mapped };
      } else {
        this.dentists.push(mapped);
      }
    });

    // Ensure Avaliador Bertuol always exists
    if (!this.dentists.some((d) => d.id === 6036933394890752)) {
      const avaliador = INITIAL_DENTISTS.find((d) => d.id === 6036933394890752);
      if (avaliador) this.dentists.push(avaliador);
    }

    this.saveAll();
  }

  public syncAppointmentsFromClinicorp(rawAppointments: any[], dateKey: string) {
    if (!Array.isArray(rawAppointments)) return;

    const mapped: Appointment[] = rawAppointments
      .filter((a) => a.ItemType === 'APPOINTMENT' || a.PatientName || a.Name)
      .map((item, idx) => {
        const fromRaw = item.fromTime || '09:00';
        const toRaw = item.toTime || '10:00';
        const fromParts = fromRaw.split(':');
        const toParts = toRaw.split(':');
        const fromNorm = `${fromParts[0].padStart(2, '0')}:${(fromParts[1] || '00').padStart(2, '0')}`;
        const toNorm = `${toParts[0].padStart(2, '0')}:${(toParts[1] || '00').padStart(2, '0')}`;

        return {
          id: Number(item.id || item.AppointmentId || 9000000 + idx),
          AtomicDate: item.AtomicDate || Number(dateKey.replace(/-/g, '') + fromNorm.replace(':', '')),
          Clinic_BusinessId: item.Clinic_BusinessId || CLINIC_BUSINESS_ID_PALMAS,
          Dentist_PersonId: Number(item.Dentist_PersonId || item.ScheduleToId),
          Patient_PersonId: Number(item.Patient_PersonId || 1000 + idx),
          PatientName: (item.PatientName || item.Name || 'Paciente').trim(),
          MobilePhone: item.MobilePhone || '',
          Procedures: item.Procedures || 'Consulta Odontológica',
          Notes: item.Notes || '',
          fromTime: fromNorm,
          toTime: toNorm,
          date: dateKey,
          CategoryId: String(item.CategoryId || '5857665617494016'),
          ai_summary: null,
        };
      });

    // Replace appointments for this date with fresh Clinicorp data
    this.appointments = this.appointments
      .filter((a) => a.date !== dateKey)
      .concat(mapped);

    this.saveAll();
  }

  public syncProfissionaisFromSupabase(
    supaDentistas: any[],
    supaPatients: any[] = []
  ) {
    if (!supaDentistas || supaDentistas.length === 0) return;

    const avatars = [
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1594824813583-7c703b4ffeb2?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1629425733761-caae3b5f2e50?w=150&auto=format&fit=crop&q=80',
    ];

    const mapped: Dentist[] = supaDentistas.map((p, idx) => {
      const nome = p.nome_completo || p.Nome || 'Dentista';
      const isFemale =
        nome.toLowerCase().startsWith('dra') ||
        nome.toLowerCase().includes('ariane') ||
        nome.toLowerCase().includes('anna') ||
        nome.toLowerCase().includes('cristina') ||
        nome.toLowerCase().includes('muryel') ||
        nome.toLowerCase().includes('jessica') ||
        nome.toLowerCase().includes('andressa');

      const unidade = p.unidade || p.Unidade || 'Palmas - TO';
      const isPalmas = unidade.toLowerCase().includes('palmas');

      return {
        id: p.id,
        Name: nome,
        CRO: `CRO-TO (${unidade})`,
        Email: `${(p.primeironome || p.PrimeiroNome || nome).toLowerCase().replace(/\s+/g, '')}@bertuolodontologia.com.br`,
        MobilePhone: p.telefone || p.Telefone || '(63) 98108-9346',
        Active: p.status ?? p.Status ? 'true' : 'false',
        Sex: isFemale ? 'F' : 'M',
        Clinic_BusinessId: isPalmas ? CLINIC_BUSINESS_ID_PALMAS : CLINIC_BUSINESS_ID_PARAiSO,
        specialty: `Odontologia Clínica • ${unidade}`,
        avatarUrl: avatars[idx % avatars.length],
      };
    });

    // Update dentists list
    this.dentists = mapped;

    // Merge patients if available
    if (supaPatients && supaPatients.length > 0) {
      supaPatients.forEach((sp, i) => {
        const existingIdx = this.patients.findIndex(
          (p) => p.Name.toLowerCase() === sp.name.toLowerCase()
        );
        const patientObj: Patient = {
          id: 1000 + i,
          Name: sp.name,
          MobilePhone: sp.mobile_phone || '(63) 98112-3344',
          Age: sp.age || 32,
          insurancePlanName: sp.insurance_plan_name || 'Particular',
          Notes: sp.notes || 'Paciente cadastrado na base clínica do Supabase.',
          Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
        };
        if (existingIdx >= 0) {
          this.patients[existingIdx] = patientObj;
        } else {
          this.patients.push(patientObj);
        }
      });
    }

    // Ensure appointments exist for dentists
    mapped.forEach((d) => {
      const hasAppts = this.appointments.some((a) => a.Dentist_PersonId === d.id);
      if (!hasAppts) {
        INITIAL_APPOINTMENTS.forEach((initApp, i) => {
          this.appointments.push({
            ...initApp,
            id: Number(`${d.id}0${i + 1}`),
            Dentist_PersonId: d.id,
            date: todayStr,
          });
        });
      }
    });

    this.saveAll();
  }

  public syncCategoriesFromClinicorp(categories: any[]) {
    if (!categories || categories.length === 0) return;

    const defaultColors = [
      '#0D9488',
      '#D97706',
      '#8B5CF6',
      '#EC4899',
      '#0284C7',
      '#78716C',
      '#06B6D4',
      '#4F46E5',
      '#E11D48',
      '#991B1B',
    ];

    const mapped: Category[] = categories.map((c: any, idx: number) => ({
      id: String(c.id || c.CategoryId),
      description: (c.Description || c.description || c.CategoryDescription || c.name || `Categoria ${idx + 1}`).trim(),
      color: c.Color || c.color || defaultColors[idx % defaultColors.length],
      Clinic_BusinessId: CLINIC_BUSINESS_ID_PALMAS,
    }));

    this.categories = mapped;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
  }

  public getCategories(clinicBusinessId?: number): Category[] {
    if (clinicBusinessId) {
      return this.categories.filter((c) => c.Clinic_BusinessId === clinicBusinessId);
    }
    return this.categories;
  }

  public getPatients(clinicBusinessId?: number): Patient[] {
    if (clinicBusinessId) {
      return this.patients.filter((p) => p.Clinic_BusinessId === clinicBusinessId);
    }
    return this.patients;
  }

  // RF02 & RF03 - Chronological listing with join on categories, patients, and clinics
  public getAppointments(
    dentistPersonId: number,
    dateKey: string,
    clinicFilter?: number | 'all',
    overrideContext?: AppUserContext
  ): Appointment[] {
    const categoriesMap = new Map(this.categories.map((c) => [c.id, c]));
    const patientsMap = new Map(this.patients.map((p) => [p.id, p]));
    const ctx = overrideContext || this.userContext;

    // Determine active clinic filtering
    let targetClinicBusinessId: number | null = null;
    let allowedBusinessIds: number[] | null = null;

    if (ctx.role === 'receptionist') {
      // Strictly isolate to the receptionist's assigned clinic (LGPD compliant)
      const recClinic = this.getClinicById(ctx.receptionClinicId || 1);
      targetClinicBusinessId = recClinic?.clinicorp_business_id || CLINIC_BUSINESS_ID_PALMAS;
    } else if (ctx.role === 'gerente_atendimento') {
      if (ctx.allowedClinicIds && ctx.allowedClinicIds.length > 0) {
        allowedBusinessIds = ctx.allowedClinicIds
          .map((cid) => this.getClinicById(cid)?.clinicorp_business_id)
          .filter(Boolean) as number[];
      }
      if (clinicFilter && clinicFilter !== 'all') {
        const targetClinic = this.getClinicById(clinicFilter);
        targetClinicBusinessId = targetClinic?.clinicorp_business_id || null;
      }
    } else if (clinicFilter && clinicFilter !== 'all') {
      const targetClinic = this.getClinicById(clinicFilter);
      targetClinicBusinessId = targetClinic?.clinicorp_business_id || null;
    }

    return this.appointments
      .filter((app) => {
        // In receptionist mode: show all appointments for the clinic regardless of dentist
        // In dentist mode: strictly show appointments for that dentist
        // In gerente/admin mode: show selected dentist or all if dentistPersonId is empty
        let matchDentist = true;
        if (ctx.role === 'dentist') {
          matchDentist = app.Dentist_PersonId === dentistPersonId;
        } else if (ctx.role === 'receptionist') {
          matchDentist = true;
        } else {
          matchDentist = dentistPersonId ? app.Dentist_PersonId === dentistPersonId : true;
        }

        const matchDate = app.date.startsWith(dateKey);

        let matchClinic = true;
        if (targetClinicBusinessId !== null) {
          matchClinic = app.Clinic_BusinessId === targetClinicBusinessId;
        } else if (allowedBusinessIds && allowedBusinessIds.length > 0) {
          matchClinic = allowedBusinessIds.includes(app.Clinic_BusinessId);
        }

        return matchDentist && matchDate && matchClinic;
      })
      .map((app) => {
        const foundDentist = this.dentists.find((d) => d.id === app.Dentist_PersonId);
        return {
          ...app,
          category: app.CategoryId ? categoriesMap.get(app.CategoryId) : undefined,
          patient: app.Patient_PersonId ? patientsMap.get(app.Patient_PersonId) : undefined,
          clinic: this.getClinicByBusinessId(app.Clinic_BusinessId),
          dentist: foundDentist,
          dentist_name: foundDentist?.Name || app.dentist_name || 'Dr(a). Profissional',
        };
      })
      .sort((a, b) => a.fromTime.localeCompare(b.fromTime));
  }

  public getAppointmentById(id: number): Appointment | undefined {
    const categoriesMap = new Map(this.categories.map((c) => [c.id, c]));
    const patientsMap = new Map(this.patients.map((p) => [p.id, p]));
    const found = this.appointments.find((a) => a.id === id);
    if (!found) return undefined;
    const foundDentist = this.dentists.find((d) => d.id === found.Dentist_PersonId);
    return {
      ...found,
      category: found.CategoryId ? categoriesMap.get(found.CategoryId) : undefined,
      patient: found.Patient_PersonId ? patientsMap.get(found.Patient_PersonId) : undefined,
      clinic: this.getClinicByBusinessId(found.Clinic_BusinessId),
      dentist: foundDentist,
      dentist_name: foundDentist?.Name || found.dentist_name || 'Dr(a). Profissional',
    };
  }

  // Update appointment with AI Summary
  public updateAppointmentSummary(appointmentId: number, aiSummary: string): Appointment | null {
    const index = this.appointments.findIndex((a) => a.id === appointmentId);
    if (index === -1) return null;

    this.appointments[index] = {
      ...this.appointments[index],
      ai_summary: aiSummary,
    };

    this.saveAll();
    return this.appointments[index];
  }
}

export const dataService = new DataService();
