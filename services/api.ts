import { apiClient } from './apiClient';
import { MunicipioDetalhado, Lideranca, Assessor, EventoAgenda, Demanda, LiderancaLocal, Recurso, SolicitacaoAgenda, NotificationLog, Apoiador } from '../types';
import { mockLiderancas } from '../data/mockLiderancas';
import { mockAssessores } from '../data/mockAssessores';

// Helper to map snake_case to CamelCase for Municipality
const mapMunicipio = (m: any) => ({
    id: m.id,
    nome: m.nome,
    codigoIBGE: m.codigo_ibge,
    regiao: m.regiao,
    populacao: m.populacao,
    idh: m.idh,
    pibPerCapita: m.pib_per_capita,
    influencia: m.influencia,
    liderancasAtivas: m.liderancas_ativas,
    statusAtividade: m.status_atividade,
    // Novos campos políticos
    statusPrefeito: m.status_prefeito,
    idene: m.idene,
    lincolnFechado: m.lincoln_fechado,
    statusAtendimento: m.status_atendimento,
    tipoAtendimento: m.tipo_atendimento,
    principalDemanda: m.principal_demanda,
    sugestaoSedese: m.sugestao_sedese,
    observacao: m.observacao,
    assessorId: m.assessor_id,
    votacaoAle: m.votacao_ale,
    votacaoLincoln: m.votacao_lincoln,
});
// --- Otimização Global ---
export async function getDashboardCounts() {
    try {
        const response = await apiClient.post<any>('/api/admin/sql', {
            sql: `
                SELECT 
                    (SELECT COUNT(*) FROM hub.municipios) as municipios_count,
                    (SELECT COUNT(*) FROM hub.liderancas) as liderancas_count,
                    (SELECT COUNT(*) FROM hub.assessores) as assessores_count,
                    (SELECT SUM(valor) FROM hub.recursos) as recursos_total,
                    (SELECT COUNT(*) FROM hub.demandas) as demandas_total,
                    (SELECT COUNT(*) FROM hub.demandas WHERE origem = 'Alê Portela') as ale_demandas,
                    (SELECT COUNT(*) FROM hub.demandas WHERE origem = 'Lincoln Portela') as lincoln_demandas
            `
        });
        
        if (response && response.rows && response.rows[0]) {
            const row = response.rows[0];
            return {
                municipiosCount: parseInt(row.municipios_count) || 0,
                liderancasCount: parseInt(row.liderancas_count) || 0,
                assessoresCount: parseInt(row.assessores_count) || 0,
                recursosTotal: parseFloat(row.recursos_total) || 0,
                demandasTotal: parseInt(row.demandas_total) || 0,
                aleDemandasCount: parseInt(row.ale_demandas) || 0,
                lincolnDemandasCount: parseInt(row.lincoln_demandas) || 0
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar contagens do dashboard:', error);
        return null;
    }
}

export async function getMunicipiosSimples(): Promise<MunicipioDetalhado[]> {
    try {
        const data = await apiClient.get<any>('/api/municipios');
        const list = (data && Array.isArray(data)) ? data : (data?.municipios || []);
        return list.map((m: any) => mapMunicipio(m)) as any[];
    } catch (error) {
        console.error('Erro ao buscar municípios simples:', error);
        return [];
    }
}


export async function getDashboardLiderancas(): Promise<Lideranca[]> {
    try {
        const response = await apiClient.post<any>('/api/admin/sql', {
            sql: 'SELECT id, nome, municipio_nome as municipio, regiao, partido, cargo, latitude, longitude FROM hub.liderancas'
        });
        return (response?.rows || []) as Lideranca[];
    } catch (error) {
        console.error('Erro ao buscar lideranças para o dashboard:', error);
        return [];
    }
}

export async function getDashboardAssessores(): Promise<Assessor[]> {
    try {
        const response = await apiClient.post<any>('/api/admin/sql', {
            sql: 'SELECT id, nome, avatar_url, cargo, regiao_atuacao, latitude, longitude FROM hub.assessores'
        });
        return (response?.rows || []) as Assessor[];
    } catch (error) {
        console.error('Erro ao buscar assessores para o dashboard:', error);
        return [];
    }
}

// --- Municípios ---
export const getMunicipios = async (): Promise<MunicipioDetalhado[]> => {
    try {
        const data = await apiClient.get<any>('/api/municipios?include=recursos,demandas,apoiadores');
        const list = Array.isArray(data) ? data : (data.municipios || []);

        return list.map((m: any) => ({
            ...mapMunicipio(m),
            totalRecursos: m.recursos?.reduce((acc: number, r: any) => acc + (parseFloat(r.valor) || 0), 0) || 0,
            totalDemandas: m.demandas_count || 0,
            totalApoiadores: m.apoiadores_count || 0
        })) as any[];
    } catch (error) {
        console.error('Erro ao buscar municípios:', error);
        return [];
    }
};

export const createMunicipio = async (municipio: {
    nome: string;
    regiao: string;
    populacao?: number;
    idh?: number;
    pib_per_capita?: number;
    influencia?: number;
    status_atividade?: string;
    assessor_id?: string;
}) => {
    const data = await apiClient.post<any>('/api/municipios', municipio);
    return mapMunicipio(data);
};

export const updateMunicipio = async (id: string, updates: any): Promise<any> => {
    const data = await apiClient.put<any>(`/api/municipios/${id}`, updates);
    return mapMunicipio(data);
};


export const getMunicipioById = async (id: string): Promise<MunicipioDetalhado | undefined> => {
    try {
        const municipio = await apiClient.get<any>(`/api/municipios/${id}?include=demandas,liderancas,recursos`);
        
        return {
            ...mapMunicipio(municipio),
            demandas: (municipio.demandas || []) as Demanda[],
            liderancas: (municipio.liderancas_locais || []).map((l: any) => ({
                nome: l.nome,
                partido: l.partido,
                cargo: l.cargo,
                avatarInitials: l.avatar_initials
            })) as LiderancaLocal[],
            totalRecursos: municipio.recursos?.reduce((acc: number, r: any) => acc + (parseFloat(r.valor) || 0), 0) || 0
        } as MunicipioDetalhado;
    } catch (error) {
        console.error(`Erro ao buscar município ${id}:`, error);
        return undefined;
    }
};

// --- Lideranças ---
export const getLiderancas = async (): Promise<Lideranca[]> => {
    try {
        const response = await apiClient.post<any>('/api/admin/sql', {
            sql: `SELECT id, nome, municipio_nome as municipio, regiao, partido, cargo, telefone as contato, email, status, origem, avatar_url as "avatarUrl", endereco, latitude, longitude FROM hub.liderancas`
        });
        return (response?.rows || []) as Lideranca[];
    } catch (error) {
        console.error('Erro ao buscar lideranças do banco via SQL:', error);
        return [];
    }
};

export const upsertLideranca = async (lideranca: Partial<Lideranca>) => {
    const isNew = !lideranca.id || lideranca.id.length < 20;

    const dbData: any = {
        nome: lideranca.nome,
        municipio_nome: lideranca.municipio,
        regiao: lideranca.regiao,
        partido: lideranca.partido,
        cargo: lideranca.cargo,
        telefone: lideranca.contato,
        email: lideranca.email,
        status: lideranca.status,
        origem: lideranca.origem,
        avatar_url: lideranca.avatarUrl,
        endereco: lideranca.endereco,
        latitude: lideranca.latitude,
        longitude: lideranca.longitude
    };

    let data;
    if (isNew) {
        data = await apiClient.post<any>('/api/liderancas', dbData);
    } else {
        data = await apiClient.put<any>(`/api/liderancas/${lideranca.id}`, dbData);
    }

    return {
        ...lideranca,
        id: data.id,
        avatarUrl: data.avatar_url,
        municipio: data.municipio_nome
    } as Lideranca;
};

// --- Assessores ---
export const getAssessores = async (): Promise<Assessor[]> => {
    try {
        const response = await apiClient.post<any>('/api/admin/sql', {
            sql: `SELECT id, nome, avatar_url as "avatarUrl", cargo, regiao_atuacao as "regiaoAtuacao", municipios_cobertos as "municipiosCobertos", liderancas_gerenciadas as "liderancasGerenciadas", latitude, longitude, origem, telefone, email, endereco FROM hub.assessores`
        });
        return (response?.rows || []) as Assessor[];
    } catch (error) {
        console.error('Erro ao buscar assessores do banco via SQL:', error);
        return [];
    }
};

export const upsertAssessor = async (assessor: Partial<Assessor>) => {
    const isNew = !assessor.id || assessor.id.length < 20;

    const dbData: any = {
        nome: assessor.nome,
        avatar_url: assessor.avatarUrl,
        cargo: assessor.cargo,
        regiao_atuacao: assessor.regiaoAtuacao,
        municipios_cobertos: assessor.municipiosCobertos,
        liderancas_gerenciadas: assessor.liderancasGerenciadas,
        latitude: assessor.latitude,
        longitude: assessor.longitude,
        origem: assessor.origem,
        telefone: assessor.telefone,
        email: assessor.email,
        endereco: assessor.endereco
    };

    let data;
    if (isNew) {
        data = await apiClient.post<any>('/api/assessores', dbData);
    } else {
        data = await apiClient.put<any>(`/api/assessores/${assessor.id}`, dbData);
    }

    return {
        ...assessor,
        id: data.id,
        avatarUrl: data.avatar_url,
        regiaoAtuacao: data.regiao_atuacao
    } as Assessor;
};

export const deleteLideranca = async (id: string) => {
    return apiClient.delete(`/api/liderancas/${id}`);
};

export const deleteAssessor = async (id: string) => {
    return apiClient.delete(`/api/assessores/${id}`);
};

export const deleteDemanda = async (id: string) => {
    return apiClient.delete(`/api/demandas/${id}`);
};

export const deleteRecurso = async (id: string) => {
    return apiClient.delete(`/api/recursos/${id}`);
};

// --- Helper para Privacidade ---
const applyPrivacy = (event: any): EventoAgenda => {
    const rawTitle = event.titulo || event.summary || event.title || 'Sem título';
    const rawDesc = event.descricao || event.description || '';
    const rawLocal = event.local || event.location || 'Não informado';

    // Heurística de privacidade reforçada (case-insensitive)
    const textRes = (rawTitle + ' ' + rawDesc).toLowerCase();
    const isPrivate = event.privacidade === 'Particular' ||
        event.visibility === 'private' ||
        event.visibility === 'confidential' ||
        textRes.includes('privado') ||
        textRes.includes('particular');

    // Remove campos brutos que podem causar bypass na UI
    const { summary, description, location, visibility, title, ...cleanEvent } = event;

    if (isPrivate) {
        return {
            ...cleanEvent,
            titulo: '🔒 Reservado',
            local: 'Local Reservado',
            descricao: undefined,
            privacidade: 'Particular'
        } as EventoAgenda;
    }

    return {
        ...cleanEvent,
        titulo: rawTitle,
        local: rawLocal,
        descricao: rawDesc,
        privacidade: 'Público'
    } as EventoAgenda;
};

// --- Agenda ---
export const getAgendaEventos = async (): Promise<EventoAgenda[]> => {
    try {
        const data = await apiClient.get<any>('/api/agenda');
        const list = Array.isArray(data) ? data : (data.agenda || []);
        
        return list.map((e: any) => {
            const mapped = {
                ...e,
                data: e.data ? e.data.split('T')[0] : ''
            };
            return applyPrivacy(mapped);
        });
    } catch (error) {
        console.error('Erro ao buscar eventos da agenda:', error);
        return [];
    }
};

export const createEvento = async (evento: Omit<EventoAgenda, 'id'>) => {
    const data = await apiClient.post<any>('/api/agenda', evento);
    return {
        ...data,
        data: data.data ? data.data.split('T')[0] : ''
    } as EventoAgenda;
};

export const updateEvento = async (id: string, evento: Partial<EventoAgenda>) => {
    const data = await apiClient.put<any>(`/api/agenda/${id}`, evento);
    return {
        ...data,
        data: data.data ? data.data.split('T')[0] : ''
    } as EventoAgenda;
};

export const deleteEvento = async (id: string) => {
    return apiClient.delete(`/api/agenda/${id}`);
};

export const getSolicitacoesAgenda = async (): Promise<SolicitacaoAgenda[]> => {
    try {
        return await apiClient.get<SolicitacaoAgenda[]>('/api/agenda/solicitacoes');
    } catch (error) {
        console.error('Erro ao buscar solicitações de agenda:', error);
        return [];
    }
};

export const createSolicitacaoAgenda = async (solicitacao: Omit<SolicitacaoAgenda, 'id' | 'created_at' | 'status'>) => {
    return apiClient.post<SolicitacaoAgenda>('/api/agenda/solicitacoes', solicitacao);
};

export const updateSolicitacaoAgenda = async (id: string, solicitacao: Partial<SolicitacaoAgenda>) => {
    return apiClient.put<SolicitacaoAgenda>(`/api/agenda/solicitacoes/${id}`, {
        ...solicitacao,
        status: 'Pendente',
        observacoes_recusa: null
    });
};

export const updateSolicitacaoStatus = async (id: string, status: 'Aprovado' | 'Recusado', observacoes?: string, recusadoPor?: string) => {
    return apiClient.put<SolicitacaoAgenda>(`/api/agenda/solicitacoes/${id}/status`, { 
        status,
        observacoes_recusa: status === 'Recusado' ? observacoes : null,
        recusado_por: status === 'Recusado' ? recusadoPor : null
    });
};

export const approveSolicitacao = async (solicitacaoId: string, eventData: Omit<EventoAgenda, 'id'>, observacoes?: string) => {
    return apiClient.post<EventoAgenda>(`/api/agenda/solicitacoes/${solicitacaoId}/approve`, {
        eventData,
        observacoes
    });
};

export const undoApproveSolicitacao = async (solicitacaoId: string) => {
    return apiClient.post<SolicitacaoAgenda>(`/api/agenda/solicitacoes/${solicitacaoId}/undo-approve`, {});
};

// --- Recursos ---
export const getRecursosTotais = async (): Promise<number> => {
    try {
        const data = await apiClient.get<any>('/api/recursos');
        const list = Array.isArray(data) ? data : (data.recursos || []);
        return list.reduce((acc: number, r: any) => acc + (parseFloat(r.valor) || 0), 0);
    } catch (error) {
        console.error('Erro ao buscar recursos totais:', error);
        return 0;
    }
};

export const getAllRecursos = async (): Promise<Recurso[]> => {
    try {
        const data = await apiClient.get<any>('/api/recursos?include=municipios');
        const list = Array.isArray(data) ? data : (data.recursos || []);

        return list.map((r: any) => ({
            id: r.id,
            municipioId: r.municipio_id,
            tipo: r.tipo,
            descricao: r.descricao,
            valor: parseFloat(r.valor) || 0,
            origem: r.origem,
            status: r.status,
            dataAprovacao: r.data_aprovacao,
            responsavel: r.responsavel,
            observacoes: r.observacoes,
            municipio_nome: r.municipios?.nome || 'Desconhecido',
            regiao: r.municipios?.regiao || '-',
        })) as Recurso[];
    } catch (error) {
        console.error('Erro ao buscar todos os recursos:', error);
        return [];
    }
};

export const getRecursosByMunicipio = async (municipioId: string): Promise<Recurso[]> => {
    try {
        const data = await apiClient.get<any>(`/api/recursos?municipio_id=${municipioId}`);
        const list = Array.isArray(data) ? data : (data.recursos || []);

        return list.map((r: any) => ({
            id: r.id,
            municipioId: r.municipio_id,
            tipo: r.tipo,
            descricao: r.descricao,
            valor: parseFloat(r.valor) || 0,
            origem: r.origem,
            status: r.status,
            dataAprovacao: r.data_aprovacao,
            responsavel: r.responsavel,
            observacoes: r.observacoes
        })) as Recurso[];
    } catch (error) {
        console.error('Erro ao buscar recursos do município:', error);
        return [];
    }
};

export const createRecurso = async (recurso: any) => {
    return apiClient.post<Recurso>('/api/recursos', recurso);
};

export const getDemandasTotais = async (origem?: string): Promise<number> => {
    try {
        const url = origem ? `/api/demandas/count?origem=${origem}` : '/api/demandas/count';
        const data = await apiClient.get<{ count: number }>(url);
        return data.count || 0;
    } catch (error) {
        console.error('Erro ao contar demandas:', error);
        return 0;
    }
};
export const getDemandasByMunicipio = async (municipioId: string): Promise<Demanda[]> => {
    try {
        return await apiClient.get<Demanda[]>(`/api/demandas?municipio_id=${municipioId}`);
    } catch (error) {
        console.error('Erro ao buscar demandas do município:', error);
        return [];
    }
};

export const createDemanda = async (demanda: any) => {
    return apiClient.post<Demanda>('/api/demandas', demanda);
};

export const getAllDemandas = async (): Promise<any[]> => {
    try {
        const response = await apiClient.post<any>('/api/admin/sql', {
            sql: `
                SELECT 
                    d.*,
                    m.nome as "municipioNome",
                    m.regiao as "municipioRegiao"
                FROM hub.demandas d
                LEFT JOIN hub.municipios m ON d.municipio_id = m.id
            `
        });
        
        const rows = response?.rows || [];
        return rows.map((d: any) => ({
            ...d,
            id: d.id,
            municipioId: d.municipio_id,
            titulo: d.titulo || d.descricao,
            municipio_nome: d.municipioNome || 'Desconhecido',
            regiao: d.municipioRegiao || '-',
            // Mapear campos snake_case para camelCase se necessário
            dataPedido: d.data_pedido,
            createdAt: d.created_at
        }));
    } catch (error) {
        console.error('Erro ao buscar todas as demandas via SQL:', error);
        return [];
    }
};

export const updateDemanda = async (id: string, updates: any) => {
    return apiClient.put<any>(`/api/demandas/${id}`, updates);
};

// --- Integração Google Agenda (Edge Function) ---
export const getGoogleEvents = async (): Promise<EventoAgenda[]> => {
    const CACHE_KEY = 'google_calendar_cache';
    const CACHE_TTL = 15 * 60 * 1000; // 15 minutos de cache

    try {
        // 1. Tentar ler do cache para retorno imediato
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { timestamp, events } = JSON.parse(cachedData);
            const isFresh = Date.now() - timestamp < CACHE_TTL;
            
            if (isFresh) {
                console.log("[API] Google Agenda carregada do cache (Fresh)");
                return events;
            } else {
                console.log("[API] Cache expirado, buscando novos dados em background...");
                // Retorna o cache agora, mas dispara a busca em background para a próxima visita
                setTimeout(() => fetchAndCacheGoogleEvents(), 1000);
                return events;
            }
        }
        
        // 2. Se não houver cache, faz a busca normal
        return await fetchAndCacheGoogleEvents();
    } catch (err) {
        console.error('Erro na lógica de cache da Google Agenda:', err);
        return await fetchAndCacheGoogleEvents();
    }
};

const fetchAndCacheGoogleEvents = async (): Promise<EventoAgenda[]> => {
    const CACHE_KEY = 'google_calendar_cache';
    try {
        console.log("[API] Buscando dados reais da Google Agenda...");
        const data = await apiClient.get<any[]>('/api/integrations/google-calendar');

        const rawItems = Array.isArray(data) ? data : (data as any)?.items || [];
        const events = rawItems.map((e: any) => {
            let dataIso = '';
            let hora = '';
            const startNode = e.start;

            if (startNode?.dateTime) {
                const dateObj = new Date(startNode.dateTime);
                if (!isNaN(dateObj.getTime())) {
                    dataIso = dateObj.getFullYear() + '-' +
                        String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
                        String(dateObj.getDate()).padStart(2, '0');
                    hora = String(dateObj.getHours()).padStart(2, '0') + ':' +
                        String(dateObj.getMinutes()).padStart(2, '0');
                }
            } else if (startNode?.date) {
                dataIso = startNode.date;
                hora = 'Dia Inteiro';
            } else {
                const fallbackStart = e.data || '';
                dataIso = typeof fallbackStart === 'string' ? fallbackStart.split('T')[0] : '';
                hora = e.hora || 'Dia Inteiro';
            }

            const baseEvent = {
                ...e,
                id: e.id || Math.random().toString(36).substr(2, 9),
                data: dataIso,
                hora: hora,
                origem: 'Google Calendar'
            };
            return applyPrivacy(baseEvent);
        });

        localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            events
        }));

        return events;
    } catch (err) {
        console.error('Erro ao buscar Google Agenda:', err);
        return [];
    }
};
// --- Notificações Twilio ---
export const broadcastEvent = async (params: any) => {
    return apiClient.post<any>('/api/integrations/twilio-broadcast', params);
};

export const getNotificacoes = async (usuarioId: string) => {
    try {
        return await apiClient.get<any[]>(`/api/notificacoes?usuario_id=${usuarioId}`);
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        return [];
    }
};

export const marcarNotificacaoComoLida = async (id: string) => {
    return apiClient.put<any>(`/api/notificacoes/${id}/read`, { lida: true });
};

export const createNotificacao = async (usuarioId: string, titulo: string, mensagem: string, link?: string) => {
    if (!usuarioId) return;
    return apiClient.post<any>('/api/notificacoes', {
        usuario_id: usuarioId,
        titulo,
        mensagem,
        link,
        lida: false
    });
};

export const getNotificationLogs = async (eventId?: string): Promise<NotificationLog[]> => {
    try {
        const url = eventId ? `/api/notification-logs?event_id=${eventId}` : '/api/notification-logs';
        return await apiClient.get<NotificationLog[]>(url);
    } catch (error) {
        console.error('Erro ao buscar logs de notificação:', error);
        return [];
    }
};

export const getApoiadores = async (): Promise<Apoiador[]> => {
    try {
        const response = await apiClient.post<any>('/api/admin/sql', {
            sql: `
                SELECT 
                    a.id, a.nome, a.cargo, a.telefone, a.endereco, a.email, a.foto_url as "fotoUrl", a.created_at as "createdAt",
                    a.municipio_id as "municipioId",
                    m.nome as "municipioNome",
                    m.regiao as "municipioRegiao"
                FROM hub.apoiadores a
                LEFT JOIN hub.municipios m ON a.municipio_id = m.id
            `
        });
        
        const rows = response?.rows || [];
        return rows.map((r: any) => ({
            ...r,
            id: r.id,
            nome: r.nome,
            cargo: r.cargo,
            telefone: r.telefone,
            endereco: r.endereco,
            email: r.email,
            fotoUrl: r.fotoUrl || r.foto_url,
            createdAt: r.createdAt || r.created_at,
            municipioId: r.municipioId || r.municipio_id,
            municipio: r.municipioNome ? { nome: r.municipioNome, regiao: r.municipioRegiao } : undefined
        })) as any[];
    } catch (error) {
        console.error('Erro ao buscar apoiadores via SQL:', error);
        return [];
    }
};

export const getApoiadoresByMunicipio = async (municipioId: string): Promise<Apoiador[]> => {
    try {
        const data = await apiClient.get<any>(`/api/apoiadores?municipio_id=${municipioId}&include=municipios`);
        const list = Array.isArray(data) ? data : (data.apoiadores || []);

        return list.map((a: any) => ({
            id: a.id,
            municipioId: a.municipio_id,
            municipio: a.municipios ? mapMunicipio(a.municipios) : undefined,
            nome: a.nome,
            cargo: a.cargo,
            telefone: a.telefone,
            endereco: a.endereco,
            email: a.email,
            fotoUrl: a.foto_url,
            createdAt: a.created_at
        })) as Apoiador[];
    } catch (error) {
        console.error('Erro ao buscar apoiadores do município:', error);
        return [];
    }
};

export const getApoiadorById = async (id: string): Promise<Apoiador | undefined> => {
    try {
        const data = await apiClient.get<any>(`/api/apoiadores/${id}?include=municipios,assessor`);
        
        const municipioMapped = data.municipios ? mapMunicipio(data.municipios) : undefined;
        const assessor = data.municipios?.assessor;

        return {
            id: data.id,
            municipioId: data.municipio_id,
            municipioNome: data.municipios?.nome,
            municipio: municipioMapped,
            assessor: assessor,
            nome: data.nome,
            cargo: data.cargo,
            telefone: data.telefone,
            endereco: data.endereco,
            email: data.email,
            fotoUrl: data.foto_url,
            createdAt: data.created_at
        } as any;
    } catch (error) {
        console.error(`Erro ao buscar apoiador ${id}:`, error);
        return undefined;
    }
};

export const upsertApoiador = async (apoiador: Partial<Apoiador>) => {
    const isNew = !apoiador.id || apoiador.id.length < 20;

    const dbData: any = {
        municipio_id: apoiador.municipioId,
        nome: apoiador.nome,
        cargo: apoiador.cargo,
        telefone: apoiador.telefone,
        endereco: apoiador.endereco,
        email: apoiador.email,
        foto_url: apoiador.fotoUrl,
    };

    let data;
    if (isNew) {
        data = await apiClient.post<any>('/api/apoiadores', dbData);
    } else {
        data = await apiClient.put<any>(`/api/apoiadores/${apoiador.id}`, dbData);
    }

    return {
        ...apoiador,
        id: data.id,
        municipioId: data.municipio_id,
        fotoUrl: data.foto_url,
        createdAt: data.created_at
    } as Apoiador;
};

export const deleteApoiador = async (id: string) => {
    return apiClient.delete(`/api/apoiadores/${id}`);
};

// --- Sincronização ---

const deepNormalize = (s: string) => {
    return (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/\./g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

export const syncSpreadsheetData = async (csvUrl: string): Promise<{ success: number, errors: number }> => {
    console.log('[Sync] Iniciando sincronização via CSV:', csvUrl);
    
    try {
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error('Não foi possível carregar a planilha. Verifique se o link está correto e publicado como CSV.');
        
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        // 1. Mapear assessores para IDs
        const assessores = await getAssessores();
        const assessorMap: Record<string, string> = {};
        assessores.forEach(a => assessorMap[a.nome.toLowerCase().trim()] = a.id);

        // 2. Mapear Municípios existentes
        const allMunicipios = await apiClient.get<any[]>('/api/municipios');
        const municipioMap: Record<string, { id: string, nome: string }> = {};
        allMunicipios.forEach(m => {
            municipioMap[deepNormalize(m.nome)] = { id: m.id, nome: m.nome };
        });

        // 3. Mapear Apoiadores existentes para evitar duplicidade
        const allApoiadores = await apiClient.get<any[]>('/api/apoiadores');
        const existingApoiadorMap: Record<string, string> = {};
        allApoiadores.forEach(a => {
            const key = `${a.municipio_id}_${a.nome.toLowerCase().trim()}`;
            existingApoiadorMap[key] = a.id;
        });

        const normalize = deepNormalize;

        // --- Coletar e Criar Assessores faltantes ---
        const spreadsheetAssessorNames = new Set<string>();
        rows.forEach(row => {
            const val = row[Object.keys(row).find(k => normalize(k) === 'assessor resp') || ''];
            if (val && typeof val === 'string' && val.trim().length > 1) {
                let name = val.trim();
                if (normalize(name) === 'deputada') name = 'Alê Portela';
                spreadsheetAssessorNames.add(name);
            }
        });

        for (const name of spreadsheetAssessorNames) {
            const normName = normalize(name);
            const exists = Object.keys(assessorMap).some(k => k === normName || k.includes(normName) || normName.includes(k));
            
            if (!exists) {
                console.log(`[Sync] Criando assessor faltante: ${name}`);
                try {
                    const newAssessor = await apiClient.post<any>('/api/assessores', { 
                        nome: name, 
                        cargo: 'Assessor Regional', 
                        origem: 'Alê Portela',
                        avatar_url: 'https://via.placeholder.com/150'
                    });
                    if (newAssessor) assessorMap[normalize(name)] = newAssessor.id;
                } catch (e) {
                    console.error(`Erro ao criar assessor ${name}:`, e);
                }
            }
        }

        let errorCount = 0;
        const municipioUpdates: any[] = [];
        const apoiadorUpdates: any[] = [];

        // 4. Processar cada linha
        for (const row of rows) {
            const getCol = (name: string) => {
                const normName = normalize(name);
                const key = Object.keys(row).find(k => normalize(k) === normName);
                return key ? row[key] : null;
            };

            const cidade = getCol("Cidade");
            const nomeBruto = getCol("Nome apoiador");
            if (!cidade || !nomeBruto) continue;

            const mun = municipioMap[deepNormalize(cidade)];
            if (!mun) {
                errorCount++;
                continue;
            }

            let assessorNome = getCol("Assessor Resp");
            if (assessorNome && normalize(assessorNome) === 'deputada') assessorNome = 'Alê Portela';
            
            let assessorId = null;
            if (assessorNome) {
                const normSearch = normalize(assessorNome);
                const matchKey = Object.keys(assessorMap).find(k => k === normSearch || k.includes(normSearch) || normSearch.includes(k));
                assessorId = matchKey ? assessorMap[matchKey] : null;
            }

            municipioUpdates.push({
                id: mun.id,
                status_prefeito: getCol("Status do Prefeito"),
                votacao_ale: parseNum(getCol("Votação Alê")),
                votacao_lincoln: parseNum(getCol("Votação Lincoln")),
                idene: isSim(getCol("IDENE?")),
                lincoln_fechado: isSim(getCol("Lincoln Portela")) || isSim(getCol("Lincoln Portela fechado?")),
                status_atendimento: getCol("Status de atendimento"),
                tipo_atendimento: getCol("Tipo de atendimento"),
                principal_demanda: getCol("Principal Demanda"),
                sugestao_sedese: getCol("Sugestão de Programa SEDESE"),
                observacao: getCol("OBSERVAÇÃO"),
                assessor_id: assessorId
            });

            let nomeSemCargo = nomeBruto;
            let cargoDetectado = '';
            const cargosPrefixos = ["Vereador ", "Vereadora ", "Vice-Prefeito ", "Vice-Prefeita ", "Prefeito ", "Prefeita ", "Liderança ", "Candidato ", "Candidata "];
            
            for (const prefix of cargosPrefixos) {
                if (nomeBruto.toLowerCase().startsWith(prefix.toLowerCase())) {
                    cargoDetectado = prefix.trim();
                    nomeSemCargo = nomeBruto.substring(prefix.length).trim();
                    break;
                }
            }

            const apoiadorKey = `${mun.id}_${nomeSemCargo.toLowerCase().trim()}`;
            const existingId = existingApoiadorMap[apoiadorKey];

            apoiadorUpdates.push({
                ...(existingId ? { id: existingId } : {}),
                municipio_id: mun.id,
                nome: nomeSemCargo,
                cargo: cargoDetectado || getCol("Cargo") || '',
            });
        }

        // 5. Execuções via API (Assumindo que a API suporta bulk upsert ou processando em partes)
        console.log(`[Sync] Sincronizando dados via API...`);
        await apiClient.post('/api/sync/bulk-municipios', { data: municipioUpdates });
        await apiClient.post('/api/sync/bulk-apoiadores', { data: apoiadorUpdates });

        return { success: apoiadorUpdates.length, errors: errorCount };
    } catch (err) {
        console.error('[Sync] Erro crítico:', err);
        throw err;
    }
};

// Helper simples para parsear CSV (considerando vírgulas e aspas)
function parseCSV(text: string) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const results = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Regex simplificado para colunas separadas por vírgula, lidando com aspas
        const values = [];
        let start = 0;
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            if (line[j] === '"') inQuotes = !inQuotes;
            if (line[j] === ',' && !inQuotes) {
                values.push(line.substring(start, j).trim().replace(/^"|"$/g, ''));
                start = j + 1;
            }
        }
        values.push(line.substring(start).trim().replace(/^"|"$/g, ''));
        
        const row: any = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        results.push(row);
    }
    return results;
}

// --- Helpers ---
export function parseNum(val: any) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/\./g, '').replace(',', '.')) || 0;
}

export function isSim(val: any) {
    if (!val) return false;
    const s = val.toString().toLowerCase();
    return s === 'sim' || s === 's' || s === 'true' || s === '1';
}
