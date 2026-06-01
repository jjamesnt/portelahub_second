/**
 * Calendário Eleitoral 2026 - Brasil
 * Baseado na Resolução TSE nº 23.738/2024
 */

export interface ElectoralMilestone {
    id: string;
    title: string;
    date: string; // ISO format
    description: string;
    category: 'Prazo' | 'Votação' | 'Campanha' | 'Registro' | 'Jurídico';
}

export const ELECTORAL_CALENDAR_2026: ElectoralMilestone[] = [
    {
        id: 'party-window',
        title: 'Janela Partidária',
        date: '2026-03-05',
        description: 'Período em que deputadas e deputados podem mudar de partido para concorrer sem perda do mandato. Início do ciclo de transição partidária estratégica.',
        category: 'Prazo'
    },
    {
        id: 'disaffiliation-deadline',
        title: 'Desincompatibilização (6 meses)',
        date: '2026-04-04',
        description: 'Prazo fatal para que ocupantes de cargos no Executivo (Secretários, Ministros, etc.) se afastem definitivamente das funções para estarem aptos a se candidatar a outros cargos (Presidente, Governador, Senador ou Deputado). Requisito essencial para elegibilidade.',
        category: 'Jurídico'
    },
    {
        id: 'closing-registry',
        title: 'Fechamento do Cadastro Eleitoral',
        date: '2026-05-06',
        description: 'Data limite para regularização, transferência ou emissão do título de eleitor. Candidatos também devem observar se possuem domicílio eleitoral na circunscrição em que desejam concorrer até pelo menos 6 meses antes.',
        category: 'Prazo'
    },
    {
        id: 'party-conventions',
        title: 'Convenções Partidárias',
        date: '2026-07-20',
        description: 'Início oficial das convenções. Verifique se a filiação partidária está deferida e regularizada há pelo menos 6 meses antes do pleito para evitar impugnações.',
        category: 'Registro'
    },
    {
        id: 'registration-deadline',
        title: 'Registro de Candidaturas',
        date: '2026-08-15',
        description: 'Prazo final para o registro. Toda a documentação comprobatória de desincompatibilização e quitação eleitoral deve ser anexada ao CANDex.',
        category: 'Registro'
    },
    {
        id: 'campaign-start',
        title: 'Início da Propaganda Eleitoral',
        date: '2026-08-16',
        description: 'Liberação de propaganda nas ruas e internet. Atenção à proibição de participação de candidatos em inaugurações de obras públicas e uso de publicidade institucional nos 3 meses que antecedem o pleito.',
        category: 'Campanha'
    },
    {
        id: 'first-round',
        title: 'Primeiro Turno das Eleições 2026',
        date: '2026-10-04',
        description: 'Votação em todo o país. Ocupantes de cargos que não se desincompatibilizaram nos prazos legais (ex: 6 meses para Executivo) terão seus registros indeferidos se impugnados.',
        category: 'Votação'
    },
    {
        id: 'second-round',
        title: 'Segundo Turno das Eleições 2026',
        date: '2026-10-25',
        description: 'Votação definitiva para Presidente e Governador.',
        category: 'Votação'
    },
    {
        id: 'diplomation',
        title: 'Diplomação dos Eleitos',
        date: '2026-12-18',
        description: 'Confirmação da regularidade do registro e das contas. Último marco antes da posse em 2027.',
        category: 'Prazo'
    }
];


