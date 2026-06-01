import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { getAgendaEventos, getSolicitacoesAgenda, getGoogleEvents, updateSolicitacaoStatus, approveSolicitacao, undoApproveSolicitacao, createNotificacao } from '../services/api';
import { getElectoralEvents } from '../services/electoralCalendarService'; // Novo serviço
import { EventoAgenda, SolicitacaoAgenda } from '../types';
import { AppContext } from '../context/AppContext';
import Loader from '../components/Loader';
import AgendaModal from '../components/AgendaModal';
import AgendaSolicitacaoModal from '../components/AgendaSolicitacaoModal';
import BroadcastModal from '../components/BroadcastModal';
import BroadcastHistory from '../components/BroadcastHistory';
import SolicitacoesReportModal from '../components/SolicitacoesReportModal';
import RefuseSolicitacaoModal from '../components/RefuseSolicitacaoModal';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';

interface AgendaPageProps {
    navigateTo: (page: string, params?: { [key: string]: any }) => void;
    params?: { [key: string]: any };
}

const AgendaPage: React.FC<AgendaPageProps> = ({ navigateTo, params }) => {
    const context = useContext(AppContext);
    const user = context?.user;
    const profile = context?.profile;
    const [eventos, setEventos] = useState<EventoAgenda[]>([]);
    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoAgenda[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [solicitacaoToReview, setSolicitacaoToReview] = useState<SolicitacaoAgenda | null>(null);
    const [solicitacaoToEdit, setSolicitacaoToEdit] = useState<SolicitacaoAgenda | null>(null);
    const [refuseModalConfig, setRefuseModalConfig] = useState<{isOpen: boolean, solicitacao: SolicitacaoAgenda | null}>({isOpen: false, solicitacao: null});
    const [errorModalConfig, setErrorModalConfig] = useState<{isOpen: boolean, title: string, message: string}>({isOpen: false, title: '', message: ''});
    const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, isDanger?: boolean, onConfirm: () => void}>({isOpen: false, title: '', message: '', onConfirm: () => {}});

    // Filtros
    const [filtroTipo, setFiltroTipo] = useState('Todos');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroOrigem, setFiltroOrigem] = useState('Todos');
    const [filtroPeriodo, setFiltroPeriodo] = useState('Todos');
    const [filtroSolicitante, setFiltroSolicitante] = useState('Todos');
    const [buscaSolicitacao, setBuscaSolicitacao] = useState('');

    const calendarRef = useRef<FullCalendar>(null);
    const hasHandledDeepLink = useRef(false);

    const fetchData = async () => {
        let isMounted = true;
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn("[Agenda] Safety timeout atingido.");
                setIsLoading(false);
                setIsLoadingEvents(false);
            }
        }, 12000);

        try {
            setIsLoading(true);
            setIsLoadingEvents(true);
            
            // 1. Carrega solicitações primeiro
            const solicitacoesData = await getSolicitacoesAgenda().catch(() => []);
            if (isMounted) setSolicitacoes(solicitacoesData);
            
            // 2. Carrega eventos em paralelo. Google Events costuma ser o gargalo.
            const [eventosData, googleEventsData] = await Promise.all([
                getAgendaEventos().catch(() => []),
                getGoogleEvents().catch(() => [])
            ]);

            if (isMounted) {
                const electoralEvents = getElectoralEvents();
                setEventos([...(eventosData || []), ...(googleEventsData || []), ...electoralEvents]);
                setError(null);
            }
        } catch (err) {
            console.error("Erro no fetchData:", err);
            if (isMounted) setError("Alguns dados da agenda podem não ter sido carregados.");
        } finally {
            if (isMounted) {
                setIsLoading(false);
                setIsLoadingEvents(false);
                clearTimeout(timeoutId);
            }
        }
    };

    const handleInstantApprove = async (s: SolicitacaoAgenda) => {
        if (!confirm(`Deseja aprovar instantaneamente a solicitação "${s.titulo}"?`)) return;

        try {
            setIsLoading(true);
            const payload = {
                titulo: s.titulo,
                data: s.data ? s.data.split('T')[0].split(' ')[0] : '',
                hora: s.hora_inicio || '',
                tipo: (s.tipo_evento?.includes('Evento') ? 'Evento Público' : 
                      s.tipo_evento?.includes('Reunião') ? 'Reunião' : 'Reunião') as any,
                origem: (s.origem.includes('Alê') ? 'Alê Portela' : 
                        s.origem.includes('Lincoln') ? 'Lincoln Portela' : 'Marilda Portela') as any,
                privacidade: 'Público' as any,
                local: s.local || '',
                descricao: s.descricao || ''
            };

            await approveSolicitacao(s.id, payload);
            await fetchData();
            alert('Solicitação aprovada com sucesso!');
        } catch (err) {
            console.error('Erro na aprovação instantânea:', err);
            alert('Falha ao aprovar solicitação.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: 'Aprovado' | 'Recusado') => {
        try {
            await updateSolicitacaoStatus(id, newStatus);
            const data = await getSolicitacoesAgenda();
            setSolicitacoes(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar status');
        }
    };

    const handleRefuseConfirm = async (id: string, motivo: string) => {
        try {
            await updateSolicitacaoStatus(id, 'Recusado', motivo, user?.id);
            
            // Criar notificação para o usuário
            const s = refuseModalConfig.solicitacao;
            if (s && s.criado_por) {
                await createNotificacao(
                    s.criado_por,
                    'Solicitação de Agenda Recusada',
                    `Sua solicitação "${s.titulo}" foi recusada. Motivo: ${motivo}`,
                    `/agenda?solicitacao_id=${s.id}`
                );
            }

            const data = await getSolicitacoesAgenda();
            setSolicitacoes(data);
            setRefuseModalConfig({ isOpen: false, solicitacao: null });
        } catch (err: any) {
            setErrorModalConfig({
                isOpen: true,
                title: 'Erro ao recusar',
                message: err.message || 'Ocorreu um erro.'
            });
        }
    };

    const handleUndoApprove = async (id: string) => {
        if (!window.confirm('Deseja desaprovar esta solicitação? O evento será removido da agenda e o pedido voltará para a fila de pendentes.')) return;
        try {
            await undoApproveSolicitacao(id);
            const [solicData, eventData] = await Promise.all([
                getSolicitacoesAgenda(),
                getAgendaEventos()
            ]);
            setSolicitacoes(solicData);
            setEventos(eventData);
        } catch (err: any) {
            setError(err.message || 'Erro ao desaprovar solicitação');
        }
    };

    const getTimeAgo = (dateStr?: string) => {
        if (!dateStr) return '';
        const created = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 0) return `Há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
        if (diffHours > 0) return `Há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
        if (diffMinutes > 0) return `Há ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
        return 'Agora mesmo';
    };

    useEffect(() => {
        fetchData();
    }, []);



    const tipoStyle = (tipo: string | undefined): string => {
        switch (tipo) {
            case 'Reunião': return '#3b82f6'; // blue-500
            case 'Visita Técnica': return '#f59e0b'; // amber-500
            case 'Evento Público': return '#10b981'; // emerald-500
            case 'Sessão Plenária': return '#6366f1'; // indigo-500
            case 'Google Calendar': return '#f43f5e'; // rose-500
            default: return '#64748b'; // slate-500
        }
    };

    const formatarData = (d: string) => d ? d.split('T')[0].split(' ')[0] : '';

    const calendarEvents = useMemo(() => {
        const officialEvents = eventos.map(e => {
            // Heurística de privacidade redundante para segurança absoluta
            const hasPrivateKeyword = (e.titulo + ' ' + (e.descricao || '')).toLowerCase().includes('privado') ||
                (e.titulo + ' ' + (e.descricao || '')).toLowerCase().includes('particular');
            const isPrivate = e.privacidade === 'Particular' || hasPrivateKeyword;

            // Validação de horário para FullCalendar
            const datePart = formatarData(e.data);
            const isTimeFormat = e.hora && e.hora !== '';
            const startTime = isTimeFormat ? `${datePart}T${e.hora}` : datePart;

            return {
                id: e.id,
                title: isPrivate ? "🔒 Reservado" : e.titulo,
                start: startTime,
                allDay: !isTimeFormat,
                backgroundColor: isPrivate ? '#64748b' : (e.origem === 'Google Calendar' ? tipoStyle('Google Calendar') : (e.origem === 'Justiça Eleitoral' ? '#f59e0b' : tipoStyle(e.tipo))),
                borderColor: 'transparent',
                className: `${isPrivate ? 'fc-event-private italic opacity-75' : ''} cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md hover:brightness-110`,
                extendedProps: {
                    ...e,
                    descricao: isPrivate ? undefined : e.descricao,
                    local: isPrivate ? undefined : (e.local || 'Local não informado'),
                    source: 'official'
                }

            };
        });

        return [...officialEvents];
    }, [eventos]);

    const metrics = useMemo(() => {
        const total = eventos.length;
        const reuniao = eventos.filter(e => e.tipo === 'Reunião').length;
        const visita = eventos.filter(e => e.tipo === 'Visita Técnica').length;
        const eventoPublico = eventos.filter(e => e.tipo === 'Evento Público').length;
        const sessaoPlenaria = eventos.filter(e => e.tipo === 'Sessão Plenária').length;
        return { total, reuniao, visita, eventoPublico, sessaoPlenaria };
    }, [eventos, solicitacoes]);

    const filteredCalendarEvents = useMemo(() => {
        if (filtroTipo === 'Todos') return calendarEvents;
        return calendarEvents.filter(e => {
            const props = e.extendedProps as any;
            const tipo = props.tipo || (props.tipo_evento === 'Reunião' ? 'Reunião' : undefined);
            return tipo === filtroTipo;
        });
    }, [calendarEvents, filtroTipo]);

    const filteredSolicitacoes = useMemo(() => {
        return solicitacoes.filter(s => {
            const matchesBusca = s.solicitante.toLowerCase().includes(buscaSolicitacao.toLowerCase()) || 
                                 s.titulo.toLowerCase().includes(buscaSolicitacao.toLowerCase()) ||
                                 (s.local && s.local.toLowerCase().includes(buscaSolicitacao.toLowerCase()));
            const matchesTipo = filtroTipo === 'Todos' || s.tipo_evento === filtroTipo || (filtroTipo === 'Reunião' && s.tipo_evento === 'Reunião');
            const matchesStatus = filtroStatus === 'Todos' || s.status === filtroStatus;
            const matchesOrigem = filtroOrigem === 'Todos' || s.origem.includes(filtroOrigem);
            const matchesSolicitante = filtroSolicitante === 'Todos' || s.solicitante === filtroSolicitante;
            
            // Lógica de Período
            let matchesPeriodo = true;
            if (filtroPeriodo !== 'Todos') {
                const dataS = new Date(s.data);
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                
                const diffTime = dataS.getTime() - hoje.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (filtroPeriodo === 'Próximos 7 dias') matchesPeriodo = diffDays >= 0 && diffDays <= 7;
                else if (filtroPeriodo === 'Próximos 30 dias') matchesPeriodo = diffDays >= 0 && diffDays <= 30;
                else if (filtroPeriodo === 'Passados') matchesPeriodo = diffDays < 0;
                else if (filtroPeriodo === 'Este Mês') {
                    matchesPeriodo = dataS.getMonth() === hoje.getMonth() && dataS.getFullYear() === hoje.getFullYear();
                }
            }
            
            return matchesBusca && matchesTipo && matchesStatus && matchesOrigem && matchesPeriodo && matchesSolicitante;
        });
    }, [solicitacoes, buscaSolicitacao, filtroTipo, filtroStatus, filtroOrigem, filtroPeriodo, filtroSolicitante]);

    // Efeito para tratar abertura automática via Deep Link (params.solicitacao_id)
    useEffect(() => {
        // Não esperamos mais pelo isLoading total (que inclui Google Events) para abrir o modal de solicitação
        if (params?.solicitacao_id && solicitacoes.length > 0 && !hasHandledDeepLink.current) {
            const sol = solicitacoes.find(s => s.id === params.solicitacao_id);
            if (sol) {
                if (sol.status === 'Pendente') {
                    setSolicitacaoToReview(sol);
                    setIsEventModalOpen(true);
                } else {
                    setSolicitacaoToEdit(sol);
                    setIsRequestModalOpen(true);
                }
                hasHandledDeepLink.current = true;
                window.history.replaceState({}, '', '/agenda');
            }
        }
    }, [params?.solicitacao_id, solicitacoes]);

    // Efeito para tratar abertura automática de detalhes via Deep Link (params.eventId)
    useEffect(() => {
        if (!isLoading && params?.eventId && calendarEvents.length > 0) {
            const event = calendarEvents.find(e => e.id === params.eventId);
            if (event) {
                // Simular o objeto de evento do FullCalendar esperado pelo modal
                setSelectedEvent({
                    id: event.id,
                    title: event.title,
                    start: new Date(event.start),
                    allDay: (event as any).allDay,
                    extendedProps: event.extendedProps
                });
                setIsDetailsModalOpen(true);

                // Mover o calendário para a data do evento se o ref estiver pronto
                if (calendarRef.current) {
                    calendarRef.current.getApi().gotoDate(event.start);
                }
            }
        }
    }, [isLoading, params?.eventId, calendarEvents]);


    const handleDateClick = (arg: any) => {
        setSelectedDate(arg.dateStr);
        setIsEventModalOpen(true);
    };

    const handleEventClick = (arg: any) => {
        setSelectedEvent(arg.event);
        setIsDetailsModalOpen(true);
    };

    const FilterSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder: string }) => (
        <div className="relative group flex-1 min-w-[120px]">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`w-full pl-3 pr-9 py-2 border rounded-xl text-xs outline-none font-bold transition-all cursor-pointer ${value !== 'Todos' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}
            >
                <option value="Todos">{placeholder}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                <span className={`material-symbols-outlined text-[18px] transition-all ${value !== 'Todos' ? 'text-white' : 'text-slate-400'}`}>keyboard_arrow_down</span>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 pb-24 md:pb-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 md:mb-8 text-left">
                <style>{`
                    .fc-event {
                        cursor: pointer !important;
                        transition: all 0.2s ease-in-out !important;
                    }
                    .fc-event:hover {
                        transform: translateY(-2px) scale(1.02) !important;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
                        filter: brightness(1.1) !important;
                        z-index: 50 !important;
                    }
                    .fc-daygrid-event {
                        border-radius: 6px !important;
                        padding: 2px 4px !important;
                    }
                `}</style>
                <div>

                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-navy-dark dark:text-white">Agenda Hub</h2>
                    <p className="text-xs md:text-base text-slate-500 dark:text-slate-400">Sincronização completa com Google e Mandatos.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-lg text-blue-500">history</span>
                        Histórico SMS
                    </button>
                    <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-lg text-turquoise">add_task</span>
                        Solicitar
                    </button>
                    <button
                        onClick={() => {
                            setSelectedDate(new Date().toISOString().split('T')[0]);
                            setIsEventModalOpen(true);
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 bg-turquoise text-white rounded-xl text-xs md:text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-turquoise/20"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Novo
                    </button>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-6 md:mb-8 text-left">
                {[
                    { label: 'Total Eventos', val: metrics.total, type: 'Todos', color: 'text-navy-custom', icon: 'calendar_month' },
                    { label: 'Reuniões', val: metrics.reuniao, type: 'Reunião', color: 'text-blue-500', icon: 'groups' },
                    { label: 'Visitas Técnicas', val: metrics.visita, type: 'Visita Técnica', color: 'text-amber-500', icon: 'engineering' },
                    { label: 'Eventos Públicos', val: metrics.eventoPublico, type: 'Evento Público', color: 'text-emerald-500', icon: 'campaign' },
                    { label: 'Sessões Plenárias', val: metrics.sessaoPlenaria, type: 'Sessão Plenária', color: 'text-indigo-500', icon: 'gavel' }
                ].map(card => (
                    <button
                        key={card.type}
                        onClick={() => setFiltroTipo(card.type)}
                        className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border transition-all text-left group hover:shadow-lg active:scale-95 ${filtroTipo === card.type ? 'border-turquoise ring-2 ring-turquoise/20 shadow-lg' : 'border-slate-200 dark:border-slate-700 hover:border-turquoise/50'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`material-symbols-outlined text-[20px] ${card.color}`}>{card.icon}</span>
                            {filtroTipo === card.type && <span className="size-2 rounded-full bg-turquoise animate-pulse" />}
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
                        <p className={`text-xl font-black ${card.color}`}>{card.val}</p>
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 md:p-6 mb-8 overflow-hidden fc-theme-hub">
                {isLoadingEvents ? (
                    <div className="h-[600px] flex items-center justify-center">
                        <Loader />
                    </div>
                ) : error ? (
                    <div className="h-[600px] flex flex-col items-center justify-center text-red-500 space-y-4">
                        <span className="material-symbols-outlined text-5xl font-light">error</span>
                        <p className="font-bold">{error}</p>
                        <button onClick={fetchData} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold">Tentar novamente</button>
                    </div>
                ) : (
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,listWeek'
                        }}
                        locale={ptBrLocale}
                        events={filteredCalendarEvents}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        height="auto"
                        stickyHeaderDates={true}
                        dayMaxEvents={true}
                        nowIndicator={true}
                        eventTimeFormat={{
                            hour: '2-digit',
                            minute: '2-digit',
                            meridiem: false
                        }}
                        buttonText={{
                            today: 'Hoje',
                            month: 'Mês',
                            week: 'Semana',
                            day: 'Dia',
                            list: 'Lista'
                        }}
                    />
                )}
            </div>

            {/* Modal de Detalhes Customizado */}
            {
                isDetailsModalOpen && selectedEvent && (
                    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                            <div className={`h-24 p-6 flex items-end relative ${selectedEvent.extendedProps.privacidade === 'Particular' ? 'bg-gradient-to-r from-slate-400 to-slate-600' : 'bg-gradient-to-r from-turquoise to-emerald-400'}`}>
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {selectedEvent.extendedProps.origem !== 'Google Calendar' && selectedEvent.extendedProps.origem !== 'Justiça Eleitoral' && (
                                        <button
                                            onClick={() => {
                                                setIsDetailsModalOpen(false);
                                                setIsEventModalOpen(true);
                                            }}
                                            className="text-white/80 hover:text-white transition-colors"
                                            title="Editar Evento"
                                        >
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsDetailsModalOpen(false)}
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                                    {selectedEvent.extendedProps.privacidade === 'Particular' ? 'Privado' : (selectedEvent.extendedProps.tipo || 'Compromisso')}
                                </span>
                            </div>
                            <div className="p-6 md:p-8 space-y-6">
                                <div>
                                    <h3 className="text-xl font-black text-navy-dark dark:text-white leading-tight">
                                        {selectedEvent.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2 text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        <span className="text-xs font-bold">
                                            {selectedEvent.start.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            {selectedEvent.allDay ? ' (Dia todo)' : ` às ${selectedEvent.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                        </span>
                                    </div>
                                </div>

                                {selectedEvent.extendedProps.privacidade === 'Particular' ? (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">lock</span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic font-medium">
                                            Compromisso particular. Os detalhes estão ocultos para sua privacidade.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {selectedEvent.extendedProps.categoria && (
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 mb-4">
                                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                                    {selectedEvent.extendedProps.categoria}
                                                </span>
                                            </div>
                                        )}
                                        {selectedEvent.extendedProps.descricao && (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {selectedEvent.extendedProps.descricao}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-4">
                                            {selectedEvent.extendedProps.local && (
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                    <div className="size-8 rounded-full bg-turquoise/10 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-turquoise text-lg">location_on</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local</p>
                                                        <p className="text-xs font-bold text-navy-dark dark:text-white truncate">{selectedEvent.extendedProps.local}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => navigateTo('Municipios')}
                                                        className="px-3 py-1.5 bg-turquoise text-white rounded-lg text-xs font-extrabold hover:brightness-110 transition-all shadow-lg shadow-turquoise/20"
                                                    >
                                                        Ver no Mapa
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Origem:</span>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                            {selectedEvent.extendedProps.origem || 'Interno'}
                                        </span>
                                    </div>
                                    {selectedEvent.extendedProps.origem === 'Justiça Eleitoral' && (
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
                                            Fonte: TSE Res. 23.738/2024
                                        </div>
                                    )}
                                    <button

                                        onClick={() => setIsDetailsModalOpen(false)}
                                        className="text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                                    >
                                        Fechar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsDetailsModalOpen(false);
                                            setIsBroadcastModalOpen(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-turquoise/10 text-turquoise hover:bg-turquoise hover:text-white rounded-xl text-xs font-black transition-all uppercase tracking-widest"
                                    >
                                        <span className="material-symbols-outlined text-sm">send</span>
                                        Divulgar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                selectedEvent && (
                    <BroadcastModal
                        isOpen={isBroadcastModalOpen}
                        onClose={() => setIsBroadcastModalOpen(false)}
                        event={selectedEvent.extendedProps}
                    />
                )
            }

            {/* Histórico de Solicitações */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-navy-dark dark:text-white">history</span>
                            <h3 className="font-black text-sm text-navy-dark dark:text-white uppercase tracking-wider">Histórico de Solicitações</h3>
                        </div>
                        <button 
                            onClick={() => setIsReportModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all group"
                        >
                            <span className="material-symbols-outlined text-[16px] group-hover:animate-pulse">description</span>
                            Relatório
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-48">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">search</span>
                            <input
                                type="text"
                                placeholder="Busca..."
                                value={buscaSolicitacao}
                                onChange={e => setBuscaSolicitacao(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-turquoise transition-all"
                            />
                        </div>
                        <FilterSelect 
                            value={filtroTipo}
                            onChange={setFiltroTipo}
                            options={['Reunião', 'Visita Técnica', 'Evento Público', 'Sessão Plenária']}
                            placeholder="Compromisso"
                        />
                        <FilterSelect 
                            value={filtroStatus}
                            onChange={setFiltroStatus}
                            options={['Pendente', 'Aprovado', 'Recusado']}
                            placeholder="Status"
                        />
                        <FilterSelect 
                            value={filtroSolicitante}
                            onChange={setFiltroSolicitante}
                            options={Array.from(new Set(solicitacoes.map(s => s.solicitante))).sort()}
                            placeholder="Solicitante"
                        />
                        <FilterSelect 
                            value={filtroOrigem}
                            onChange={setFiltroOrigem}
                            options={['Alê Portela', 'Lincoln Portela', 'Marilda Portela']}
                            placeholder="Origem"
                        />
                        <FilterSelect 
                            value={filtroPeriodo}
                            onChange={setFiltroPeriodo}
                            options={['Próximos 7 dias', 'Próximos 30 dias', 'Este Mês', 'Passados']}
                            placeholder="Período"
                        />
                        {(buscaSolicitacao || filtroStatus !== 'Todos' || filtroTipo !== 'Todos' || filtroOrigem !== 'Todos' || filtroPeriodo !== 'Todos' || filtroSolicitante !== 'Todos') && (
                            <button
                                onClick={() => {
                                    setBuscaSolicitacao('');
                                    setFiltroStatus('Todos');
                                    setFiltroTipo('Todos');
                                    setFiltroOrigem('Todos');
                                    setFiltroPeriodo('Todos');
                                    setFiltroSolicitante('Todos');
                                }}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Limpar Filtros"
                            >
                                <span className="material-symbols-outlined">filter_alt_off</span>
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                        <thead>
                            <tr className="bg-slate-50/30 dark:bg-slate-900/10">
                                <th className="px-4 md:px-6 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Solicitante</th>
                                <th className="px-4 md:px-6 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Compromisso</th>
                                <th className="px-4 md:px-6 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Data/Hora</th>
                                <th className="px-4 md:px-6 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Status</th>
                                <th className="px-4 md:px-6 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Origem</th>
                                <th className="px-4 md:px-6 py-3 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredSolicitacoes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-300 text-4xl">calendar_today</span>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 dark:text-slate-400 font-bold">Nenhuma solicitação encontrada</p>
                                                <p className="text-slate-400 text-xs">Tente ajustar seus filtros ou cadastre uma nova solicitação.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSolicitacoes.map(s => (
                                    <tr 
                                        key={s.id} 
                                        onClick={() => {
                                            if (s.status === 'Pendente' || s.status === 'Aprovado') {
                                                setSolicitacaoToReview(s);
                                                setIsEventModalOpen(true);
                                            } else if (s.status === 'Recusado') {
                                                setSolicitacaoToEdit(s);
                                                setIsRequestModalOpen(true);
                                            }
                                        }}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer"
                                    >
                                        <td className="px-4 md:px-6 py-2.5 md:py-4">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="size-6 md:size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-slate-400 text-[10px] md:text-sm">person</span>
                                                </div>
                                                <span className="text-[10px] md:text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[80px] md:max-w-none">{s.solicitante}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4">
                                            <p className="text-[10px] md:text-sm font-bold text-navy-dark dark:text-white truncate max-w-[120px] md:max-w-none">{s.titulo}</p>
                                            <p className="text-[8px] md:text-[10px] text-slate-400 truncate max-w-[120px] md:max-w-[200px]">{s.descricao || s.local}</p>
                                        </td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4 text-center">
                                            <p className="text-[9px] md:text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                {s.data ? s.data.split('T')[0].split(' ')[0].split('-').reverse().join('/') : ''}
                                            </p>
                                            <p className="text-[8px] md:text-[10px] text-slate-400 whitespace-nowrap">{s.hora_inicio} - {s.hora_fim}</p>
                                            {s.status === 'Pendente' && (
                                                <p className="text-[8px] font-black text-amber-500 mt-1 uppercase tracking-tighter bg-amber-50 dark:bg-amber-900/20 px-1 py-0.5 rounded inline-block">
                                                    {getTimeAgo(s.created_at)}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4">
                                            <div className="flex flex-col items-center">
                                                <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[7px] md:text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${s.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    s.status === 'Recusado' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                                    }`}>
                                                    {s.status}
                                                </span>
                                                {s.status === 'Pendente' && s.resubmissoes && s.resubmissoes > 0 ? (
                                                    <span className="mt-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider whitespace-nowrap bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                                                        Revisão {s.resubmissoes}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4">
                                            <div className="flex justify-center flex-wrap gap-1">
                                                {s.origem.split(', ').map(o => (
                                                    <span key={o} className={`px-1.5 py-0.5 rounded text-[7px] md:text-[10px] font-bold whitespace-nowrap ${o === 'Alê Portela' ? 'bg-turquoise/10 text-turquoise' : 'bg-blue-600/10 text-blue-600'}`}>
                                                        {o.split(' ')[0]}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4">
                                            <div className="flex justify-center gap-2">
                                                {s.status === 'Pendente' ? (
                                                    <>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSolicitacaoToReview(s);
                                                                setIsEventModalOpen(true);
                                                            }}
                                                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                                            title="Revisar e Aprovar"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">rule</span>
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleInstantApprove(s);
                                                            }}
                                                            className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-all shadow-sm"
                                                            title="Aprovação Instantânea"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRefuseModalConfig({ isOpen: true, solicitacao: s });
                                                            }}
                                                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                                                            title="Recusar"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUndoApprove(s.id);
                                                            }}
                                                            className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-600 hover:text-white rounded-lg transition-all"
                                                            title="Desaprovar e retornar para fila"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">undo</span>
                                                        </button>
                                                        <span className="text-[10px] font-black text-slate-300 uppercase italic self-center">Concluído</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AgendaModal
                isOpen={isEventModalOpen}
                initialDate={selectedDate || undefined}
                eventToEdit={selectedEvent?.extendedProps.source === 'official' && selectedEvent.extendedProps.origem !== 'Google Calendar' ? {
                    id: selectedEvent.id,
                    titulo: selectedEvent.title,
                    data: selectedEvent.extendedProps.data,
                    hora: selectedEvent.extendedProps.hora,
                    tipo: selectedEvent.extendedProps.tipo,
                    origem: selectedEvent.extendedProps.origem,
                    privacidade: selectedEvent.extendedProps.privacidade,
                    local: selectedEvent.extendedProps.local,
                    descricao: selectedEvent.extendedProps.descricao
                } : undefined}
                solicitacaoToApprove={solicitacaoToReview || undefined}
                onClose={() => {
                    setIsEventModalOpen(false);
                    setSelectedDate(null);
                    setSelectedEvent(null);
                    setSolicitacaoToReview(null);
                }}
                onSuccess={fetchData}
                onRefuse={(s) => setRefuseModalConfig({ isOpen: true, solicitacao: s })}
            />

            <AgendaSolicitacaoModal
                isOpen={isRequestModalOpen}
                onClose={() => {
                    setIsRequestModalOpen(false);
                    setSolicitacaoToEdit(null);
                }}
                onSuccess={fetchData}
                navigateTo={navigateTo}
                solicitacaoToEdit={solicitacaoToEdit || undefined}
            />

            <BroadcastHistory
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
            />

            <SolicitacoesReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                solicitacoes={filteredSolicitacoes}
                filtrosativos={{
                    busca: buscaSolicitacao,
                    tipo: filtroTipo,
                    status: filtroStatus,
                    origem: filtroOrigem,
                    periodo: filtroPeriodo,
                    solicitante: filtroSolicitante
                }}
                usuarioNome={profile?.full_name}
            />
            
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                isDanger={confirmConfig.isDanger}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmConfig.onConfirm}
            />

            <ErrorModal
                isOpen={errorModalConfig.isOpen}
                title={errorModalConfig.title}
                message={errorModalConfig.message}
                onClose={() => setErrorModalConfig(prev => ({ ...prev, isOpen: false }))}
            />

            <RefuseSolicitacaoModal
                isOpen={refuseModalConfig.isOpen}
                solicitacao={refuseModalConfig.solicitacao}
                onClose={() => setRefuseModalConfig({ isOpen: false, solicitacao: null })}
                onConfirm={handleRefuseConfirm}
            />
        </div >
    );
};

export default AgendaPage;
