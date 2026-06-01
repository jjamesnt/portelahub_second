import { ELECTORAL_CALENDAR_2026 } from '../constants/electoralCalendar';
import { EventoAgenda } from '../types';

/**
 * Serviço para gerenciar o Calendário Eleitoral 2026.
 * Fornece dados estruturados para integração com a Agenda Hub.
 */
export const getElectoralEvents = (): EventoAgenda[] => {
    return ELECTORAL_CALENDAR_2026.map(milestone => ({
        id: milestone.id,
        titulo: `🗳️ ${milestone.title}`,
        data: milestone.date,
        hora: 'Dia Inteiro',
        local: 'Justiça Eleitoral',
        descricao: milestone.description,
        categoria: milestone.category, // Dado complementar
        tipo: 'Evento Público',
        privacidade: 'Público',
        origem: 'Justiça Eleitoral'
    } as any)); // Usando any para permitir campos extras como categoria
};

