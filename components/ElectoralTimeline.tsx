import React, { useMemo } from 'react';
import { getElectoralEvents } from '../services/electoralCalendarService';
import { EventoAgenda } from '../types';

interface ElectoralTimelineProps {
    onEventClick?: (event: EventoAgenda) => void;
    onViewFullCalendar?: () => void;
}

const ElectoralTimeline: React.FC<ElectoralTimelineProps> = ({ onEventClick, onViewFullCalendar }) => {
    const today = new Date();

    const nextEvent = useMemo(() => {
        const allEvents = getElectoralEvents();
        return allEvents
            .filter(e => new Date(e.data + 'T12:00:00') >= today)
            .sort((a, b) => a.data.localeCompare(b.data))[0]; // Apenas o próximo marco
    }, []);

    if (!nextEvent) return null;

    const eventDate = new Date(nextEvent.data + 'T12:00:00');
    const diffTime = Math.abs(eventDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return (
        <div className="bg-gradient-to-r from-navy-dark to-slate-900 rounded-2xl p-4 md:p-6 shadow-xl border border-white/10 relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-turquoise/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-turquoise/20 transition-colors"></div>

            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="shrink-0 size-14 md:size-16 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center backdrop-blur-sm shadow-inner">
                        <span className="text-[10px] md:text-xs font-black text-turquoise uppercase tracking-widest leading-none mb-1">
                            {eventDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}
                        </span>
                        <span className="text-xl md:text-2xl font-black text-white leading-none">{eventDate.getDate()}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-turquoise text-lg">ballot</span>
                            <h4 className="text-white font-black uppercase tracking-widest text-[9px] md:text-[10px] opacity-70">Próximo Marco Eleitoral 2026</h4>
                            <span className="px-1.5 py-0.5 rounded bg-turquoise text-navy-dark text-[9px] font-black uppercase tracking-tighter shadow-sm">
                                {diffDays === 0 ? 'Hoje' : `Faltam ${diffDays} dias`}
                            </span>
                        </div>
                        <h5 className="text-white font-bold text-sm md:text-lg truncate mb-0.5">{nextEvent.titulo.replace('🗳️ ', '')}</h5>
                        <p className="text-slate-400 text-[10px] md:text-sm line-clamp-1 font-medium opacity-80">{nextEvent.descricao}</p>

                        <div className="mt-3 flex items-center gap-3">
                            <p className="text-[8px] md:text-[9px] text-slate-500 flex items-center gap-1 uppercase tracking-widest font-black opacity-60">
                                <span className="material-symbols-outlined text-[10px]">gavel</span>
                                Fonte: Resolução TSE nº 23.738/2024
                            </p>
                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                            <p className="text-[8px] md:text-[9px] text-slate-500 uppercase tracking-widest font-black opacity-60">
                                Ref: {new Date().toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <button
                        onClick={() => onEventClick?.(nextEvent)}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        Ver Detalhes
                        <span className="material-symbols-outlined text-sm">info</span>
                    </button>
                    <button
                        onClick={() => onViewFullCalendar?.()}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-turquoise text-navy-dark rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all hover:brightness-110 shadow-lg shadow-turquoise/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        Agenda Completa
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ElectoralTimeline;
