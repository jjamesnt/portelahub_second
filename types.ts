
import React from 'react';

// General Types
export interface AppFilters {
    regiao: string;
    assessor: string;
    municipio: string;
}

export type Theme = 'light' | 'dark';

export interface AppContextType {
    filters: AppFilters;
    setFilters: React.Dispatch<React.SetStateAction<AppFilters>>;
    theme: Theme;
    toggleTheme: () => void;
    selectedMandato: string;
    setSelectedMandato: (mandato: string) => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    user: any | null; // Supabase User
    profile: Profile | null;
    setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
    impersonatedProfile: Profile | null;
    profileError: string | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    impersonateUser: (profile: Profile) => void;
    stopImpersonating: () => void;
    rolePermissions: Record<string, string[]>;
    setRolePermissions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    roleDisplayNames: Record<string, string>;
    setRoleDisplayNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    updateRolePermission: (role: string, itemLabel: string, active: boolean) => Promise<void>;
    bulkUpdateRolePermissions: (role: string, itemLabels: string[]) => Promise<void>;
    createRole: (roleName: string) => Promise<void>;
    deleteRole: (roleName: string) => Promise<void>;
    renameRole: (oldRole: string, newRole: string) => Promise<void>;
}

export interface Profile {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    role: string;
    permissions: string[];
    status: 'pending' | 'active' | 'blocked';
    created_at: string;
}

export interface Municipio {
    id: string;
    nome: string;
    codigoIBGE: string;
    regiao: string;
    influencia: number;
    populacao?: number;
    liderancasAtivas: number;
    statusAtividade: 'Consolidado' | 'Expansão' | 'Manutenção' | 'Atenção';
    totalRecursos?: number;
    totalDemandas?: number;
    latitude?: number;
    longitude?: number;
    // Campos Políticos e de Gestão
    statusPrefeito?: 'Não' | 'Prefeitura Parceira' | 'Prefeitura Fechada';
    idene?: boolean;
    lincolnFechado?: boolean;
    statusAtendimento?: 'Contemplado' | 'Não contemplado';
    tipoAtendimento?: string;
    principalDemanda?: string;
    sugestaoSedese?: string;
    observacao?: string;
    assessorId?: string;
    votacaoAle?: number;
    votacaoLincoln?: number;
}


// Municipality Details Types
export interface Demanda {
    id: string;
    descricao: string;
    subdescricao: string;
    status: 'Em Análise' | 'Em Execução' | 'Concluída';
    prioridade: 'Alta' | 'Média' | 'Baixa';
    origem: 'Alê Portela' | 'Lincoln Portela' | 'Marilda Portela';
}

export interface LiderancaLocal {
    nome: string;
    partido: string;
    cargo: 'Prefeito' | 'Vereador' | 'Vice-Prefeito' | 'Liderança Comunitária';
    avatarInitials: string;
    origem?: 'Alê Portela' | 'Lincoln Portela' | 'Marilda Portela';
}


export interface MunicipioDetalhado extends Municipio {
    populacao: number;
    idh: number;
    pibPerCapita: number;
    demandas: Demanda[];
    liderancas: LiderancaLocal[];
}

// New Types for Expansion
export interface Lideranca {
    id: string;
    nome: string;
    municipio: string;
    regiao: string;
    partido: string;
    cargo: LiderancaLocal['cargo'];
    contato: string;
    email?: string;
    status: 'Ativo' | 'Inativo';
    origem: 'Alê Portela' | 'Lincoln Portela' | 'Marilda Portela';
    avatarUrl?: string;
    endereco?: {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        uf: string;
        cep: string;
    };
    latitude?: number;
    longitude?: number;
}

export interface Assessor {
    id: string;
    nome: string;
    avatarUrl: string;
    cargo: 'Coordenador Político' | 'Assessor Regional' | 'Chefe de Gabinete';
    regiaoAtuacao: string;
    municipiosCobertos: number;
    liderancasGerenciadas: number;
    origem: 'Alê Portela' | 'Lincoln Portela' | 'Marilda Portela';
    telefone?: string;
    email?: string;
    endereco?: {
        logradouro: string;
        numero: string;
        bairro: string;
        cidade: string;
        uf: string;
        cep: string;
    };
    latitude?: number;
    longitude?: number;
}

export interface EventoAgenda {
    id: string;
    titulo: string;
    data: string; // YYYY-MM-DD
    hora: string; // HH:mm
    tipo: 'Reunião' | 'Visita Técnica' | 'Evento Público' | 'Sessão Plenária';
    origem: 'Alê Portela' | 'Lincoln Portela' | 'Marilda Portela' | 'Google Calendar' | 'Justiça Eleitoral';

    local: string;
    descricao?: string;
    privacidade?: 'Público' | 'Particular';
    solicitacao_id?: string;
}

export interface Recurso {
    id: string;
    municipioId: string;
    tipo: string; // Permitir múltiplos tipos separados por vírgula
    descricao: string;
    valor: number;
    origem: 'Alê Portela' | 'Lincoln Portela' | 'Marilda Portela';
    status: 'Aprovado' | 'Em Execução' | 'Concluído';
    dataAprovacao: string;
    responsavel: string;
    observacoes?: string;
}

export interface IBGEIndicator {
    id: number;
    posicao: string;
    valor: string;
}

export interface FormattedIBGEData {
    populacao: string;
    pibPerCapita: string;
    area: string;
    densidade: string;
    pibTotal?: string;
}

export interface SolicitacaoAgenda {
    id: string;
    solicitante: string;
    titulo: string;
    descricao?: string;
    data: string; // YYYY-MM-DD
    hora_inicio: string; // HH:mm
    hora_fim: string; // HH:mm
    local: string;
    estimativa_publico?: number;
    assessor_responsavel?: string;
    tipo_evento?: 'Evento formal (dispositivo de honra)' | 'Encontro' | 'Reunião';
    tipo_local?: 'Igreja' | 'Casa/Apto' | 'Evento de rua';
    tempo_participacao?: string;
    horario_chegada?: string;
    data_aprovacao?: string; // YYYY-MM-DD
    status: 'Pendente' | 'Aprovado' | 'Recusado';
    origem: string;
    municipio_id?: string;
    created_at?: string;
    observacoes_recusa?: string;
    solicitante_telefone?: string;
    solicitante_email?: string;
    criado_por?: string;
    recusado_por?: string;
    resubmissoes?: number;
    observacoes_aprovacao?: string;
}

export interface NotificacaoSistema {
    id: string;
    usuario_id: string;
    titulo: string;
    mensagem: string;
    link?: string;
    lida: boolean;
    created_at: string;
}

export interface NotificationLog {
    id: string;
    created_at: string;
    event_id: string;
    recipient_id: string | null;
    recipient_type: 'assessor' | 'lideranca' | 'apoiador' | 'avulso';
    recipient_name: string | null;
    recipient_phone: string | null;
    channel: 'whatsapp' | 'sms';
    status: 'sent' | 'error' | 'pending';
    error_message: string | null;
    message_sid: string | null;
    content: string;
    agenda?: {
        titulo: string;
        data: string;
        hora: string;
        local: string;
    };
}

export interface Apoiador {
    id: string;
    municipioId: string;
    municipio?: Municipio;
    nome: string;
    cargo: string;
    telefone: string;
    endereco: string;
    email: string;
    fotoUrl: string;
    createdAt: string;
}
