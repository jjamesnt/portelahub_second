import React, { useState, useEffect, useMemo } from 'react';
import { getAllDemandas, updateDemanda, createDemanda, getMunicipios, getMunicipiosSimples, deleteDemanda } from '../services/api';
import Loader from '../components/Loader';
import MandatoBadge from '../components/MandatoBadge';
import ConfirmModal from '../components/ConfirmModal';

interface DemandaRow {
    id: string;
    municipioId: string;
    titulo: string;
    descricao: string;
    tipo: string;
    status: string;
    prioridade: string;
    origem: string;
    prazo: string | null;
    created_at: string;
    municipio_nome: string;
    regiao: string;
}

interface MunicipioOption {
    id: string;
    nome: string;
}

const statusOptions = ['Em Análise', 'Em Execução', 'Concluída'];
const prioridadeOptions = ['Alta', 'Média', 'Baixa'];
const tipoOptions = ['Infraestrutura', 'Saúde', 'Educação', 'Segurança', 'Social', 'Administrativo', 'Outro'];

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles: Record<string, string> = {
        'Em Análise': 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30',
        'Em Execução': 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/30',
        'Concluída': 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/30',
    };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border whitespace-nowrap ${styles[status] || styles['Em Análise']}`}>
            {status.toUpperCase()}
        </span>
    );
};

const PrioridadeBadge: React.FC<{ prioridade: string }> = ({ prioridade }) => {
    const styles: Record<string, string> = {
        'Alta': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        'Média': 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
        'Baixa': 'bg-slate-50 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400',
    };
    const icons: Record<string, string> = { 'Alta': 'priority_high', 'Média': 'drag_handle', 'Baixa': 'arrow_downward' };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${styles[prioridade] || styles['Média']}`}>
            <span className="material-symbols-outlined text-xs">{icons[prioridade] || 'drag_handle'}</span>
            {prioridade}
        </span>
    );
};

const DemandasPage: React.FC<{ navigateTo: (page: string, params?: any) => void }> = ({ navigateTo }) => {
    const [demandas, setDemandas] = useState<DemandaRow[]>([]);
    const [municipios, setMunicipios] = useState<MunicipioOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<DemandaRow>>({});
    const [showNovaModal, setShowNovaModal] = useState(false);
    const [novaForm, setNovaForm] = useState({ municipio_id: '', titulo: '', descricao: '', tipo: 'Infraestrutura', status: 'Em Análise', prioridade: 'Média', origem: 'Alê Portela', prazo: '' });
    const [saving, setSaving] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<DemandaRow | null>(null);

    // Filtros
    const [filtroTexto, setFiltroTexto] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroPrioridade, setFiltroPrioridade] = useState('Todas');
    const [filtroOrigem, setFiltroOrigem] = useState('Todos');
    const [filtroMunicipio, setFiltroMunicipio] = useState('Todos');

    const fetchData = async () => {
        let isMounted = true;
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn("[Demandas] Safety timeout atingido.");
                setIsLoading(false);
            }
        }, 12000);

        try {
            setIsLoading(true);
            const [demandasData, municipiosData] = await Promise.all([
                getAllDemandas().catch(() => []),
                getMunicipiosSimples().catch(() => [])
            ]);
            
            if (isMounted) {
                setDemandas((demandasData as DemandaRow[]) || []);
                setMunicipios(municipiosData.map(m => ({ id: m.id, nome: m.nome })) || []);
            }
        } catch (err) {
            console.error("Erro ao carregar demandas:", err);
        } finally {
            if (isMounted) {
                setIsLoading(false);
                clearTimeout(timeoutId);
            }
        }
    };

    useEffect(() => { fetchData(); }, []);

    const municipiosList = useMemo(() => ['Todos', ...new Set(demandas.map(d => d.municipio_nome))].sort(), [demandas]);

    const demandasFiltradas = useMemo(() => {
        return demandas.filter(d => {
            const matchText = (d.titulo || '').toLowerCase().includes(filtroTexto.toLowerCase()) ||
                (d.descricao || '').toLowerCase().includes(filtroTexto.toLowerCase()) ||
                (d.municipio_nome || '').toLowerCase().includes(filtroTexto.toLowerCase());
            const matchStatus = filtroStatus === 'Todos' || d.status === filtroStatus;
            const matchPrioridade = filtroPrioridade === 'Todas' || d.prioridade === filtroPrioridade;
            const matchOrigem = filtroOrigem === 'Todos' || d.origem === filtroOrigem;
            const matchMunicipio = filtroMunicipio === 'Todos' || d.municipio_nome === filtroMunicipio;
            return matchText && matchStatus && matchPrioridade && matchOrigem && matchMunicipio;
        });
    }, [demandas, filtroTexto, filtroStatus, filtroPrioridade, filtroOrigem, filtroMunicipio]);

    // Stats
    const stats = useMemo(() => ({
        total: demandasFiltradas.length,
        emAnalise: demandasFiltradas.filter(d => d.status === 'Em Análise').length,
        emExecucao: demandasFiltradas.filter(d => d.status === 'Em Execução').length,
        concluidas: demandasFiltradas.filter(d => d.status === 'Concluída').length,
    }), [demandasFiltradas]);

    const startEdit = (demanda: DemandaRow) => {
        setEditingId(demanda.id);
        setEditForm({ ...demanda });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            await updateDemanda(editingId, {
                titulo: editForm.titulo,
                descricao: editForm.descricao,
                tipo: editForm.tipo,
                status: editForm.status,
                prioridade: editForm.prioridade,
                origem: editForm.origem,
                prazo: editForm.prazo || undefined,
            });
            setEditingId(null);
            setEditForm({});
            await fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const [formErrors, setFormErrors] = useState<string[]>([]);
    const municipioRef = React.useRef<HTMLSelectElement>(null);
    const tituloRef = React.useRef<HTMLInputElement>(null);
    const descricaoRef = React.useRef<HTMLTextAreaElement>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const errors = [];
        if (!novaForm.municipio_id) errors.push('municipio');
        if (!novaForm.titulo?.trim()) errors.push('titulo');
        if (!novaForm.descricao?.trim()) errors.push('descricao');

        setFormErrors(errors);

        if (errors.length > 0) {
            if (errors.includes('municipio')) municipioRef.current?.focus();
            else if (errors.includes('titulo')) tituloRef.current?.focus();
            else if (errors.includes('descricao')) descricaoRef.current?.focus();
            return;
        }

        setSaving(true);
        try {
            await createDemanda({
                municipio_id: novaForm.municipio_id,
                titulo: novaForm.titulo,
                descricao: novaForm.descricao,
                tipo: novaForm.tipo,
                status: novaForm.status,
                prioridade: novaForm.prioridade,
                origem: novaForm.origem,
                prazo: novaForm.prazo || undefined,
            });
            setShowNovaModal(false);
            setNovaForm({ municipio_id: '', titulo: '', descricao: '', tipo: 'Infraestrutura', status: 'Em Análise', prioridade: 'Média', origem: 'Alê Portela', prazo: '' });
            setFormErrors([]);
            await fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (demanda: DemandaRow) => {
        setItemToDelete(demanda);
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setSaving(true);
        try {
            await deleteDemanda(itemToDelete.id);
            await fetchData();
            setIsConfirmDeleteOpen(false);
            setItemToDelete(null);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) return <Loader />;

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-24 md:pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-extrabold text-navy-dark dark:text-white tracking-tight">Gestão de Demandas</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[10px] md:text-sm">Controle e acompanhamento de demandas por município.</p>
                </div>
                <button
                    onClick={() => setShowNovaModal(true)}
                    className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-turquoise text-white rounded-xl text-xs md:text-sm font-bold hover:bg-turquoise/90 transition-all shadow-lg shadow-turquoise/20 w-full sm:w-auto"
                >
                    <span className="material-symbols-outlined text-base md:text-lg">add_circle</span>
                    Nova Demanda
                </button>
            </div>

            {/* KPIs - Toques Premium */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'TOTAL', value: stats.total, color: 'text-navy-dark dark:text-white', bg: 'bg-turquoise/5', icon: 'list_alt' },
                    { label: 'ANÁLISE', value: stats.emAnalise, color: 'text-amber-600', bg: 'bg-amber-500/5', labelColor: 'text-amber-500', icon: 'pending' },
                    { label: 'EXECUÇÃO', value: stats.emExecucao, color: 'text-blue-600', bg: 'bg-blue-500/5', labelColor: 'text-blue-500', icon: 'shuttle_dispatch' },
                    { label: 'CONCLUÍDAS', value: stats.concluidas, color: 'text-emerald-600', bg: 'bg-emerald-500/5', labelColor: 'text-emerald-500', icon: 'task_alt' },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-12 md:w-20 h-12 md:h-20 ${kpi.bg} rounded-full -mr-6 md:-mr-10 -mt-6 md:-mt-10 transition-transform group-hover:scale-110 flex items-center justify-center`}>
                            <span className={`material-symbols-outlined text-xs md:text-xl ${kpi.labelColor || 'text-slate-300'} opacity-20 translate-x-1 translate-y-1`}>{kpi.icon}</span>
                        </div>
                        <p className={`text-[8px] md:text-[10px] font-black ${kpi.labelColor || 'text-slate-400'} uppercase tracking-widest mb-0.5 md:mb-1`}>{kpi.label}</p>
                        <h2 className={`text-lg md:text-2xl font-black ${kpi.color}`}>{kpi.value}</h2>
                    </div>
                ))}
            </div>

            {/* Tabela */}
            <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-sm">
                {/* Barra de Filtros Inteligente */}
                <div className="p-3 md:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-2 md:gap-4 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                        <div className="relative flex-1 group">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-turquoise transition-colors">
                                <span className="material-symbols-outlined text-[18px] md:text-lg">search</span>
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar demanda..."
                                className="w-full pl-9 md:pl-10 pr-4 py-2 md:py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] md:text-sm focus:ring-2 focus:ring-turquoise/30 outline-none transition-all shadow-sm"
                                value={filtroTexto}
                                onChange={(e) => setFiltroTexto(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 md:flex gap-2 min-w-0">
                            <select
                                value={filtroStatus}
                                onChange={e => setFiltroStatus(e.target.value)}
                                className={`px-2 py-1.5 md:px-3 md:py-2 rounded-xl text-[10px] md:text-xs outline-none transition-all font-bold border ${filtroStatus !== 'Todos' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                <option value="Todos">Status</option>
                                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <select
                                value={filtroPrioridade}
                                onChange={e => setFiltroPrioridade(e.target.value)}
                                className={`px-2 py-1.5 md:px-3 md:py-2 rounded-xl text-[10px] md:text-xs outline-none transition-all font-bold border ${filtroPrioridade !== 'Todas' ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                <option value="Todas">Prioridade</option>
                                {prioridadeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select
                                value={filtroOrigem}
                                onChange={e => setFiltroOrigem(e.target.value)}
                                className={`px-2 py-1.5 md:px-3 md:py-2 rounded-xl text-[10px] md:text-xs outline-none transition-all font-bold border ${filtroOrigem !== 'Todos' ? 'bg-navy-dark text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                <option value="Todos">Deputado</option>
                                <option value="Alê Portela">Alê</option>
                                <option value="Lincoln Portela">Lincoln</option>
                            </select>
                            <select
                                value={filtroMunicipio}
                                onChange={e => setFiltroMunicipio(e.target.value)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] md:text-xs px-2 py-1.5 md:px-3 md:py-2 outline-none focus:ring-2 focus:ring-turquoise/30 truncate"
                            >
                                {municipiosList.map(m => <option key={m} value={m}>{m === 'Todos' ? 'Município' : m}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-4 md:px-6 py-3 md:py-4">Demanda</th>
                                <th className="px-4 md:px-6 py-3 md:py-4">Município</th>
                                <th className="px-4 md:px-6 py-3 md:py-4">Tipo</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-center">Prioridade</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-center">Mandato</th>
                                <th className="px-4 md:px-6 py-3 md:py-4">Prazo</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-center">Status</th>
                                <th className="px-4 md:px-6 py-3 md:py-4 text-center w-24">Painel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                            {demandasFiltradas.map((d) => (
                                editingId === d.id ? (
                                    // Linha de edição inline
                                    <tr key={d.id} className="bg-turquoise/5">
                                        <td className="px-4 md:px-6 py-2 md:py-3">
                                            <input
                                                value={editForm.titulo || ''}
                                                onChange={e => setEditForm({ ...editForm, titulo: e.target.value })}
                                                className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs md:text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-turquoise/30"
                                            />
                                        </td>
                                        <td className="px-4 md:px-6 py-2 md:py-3">
                                            <p className="font-bold text-navy-dark dark:text-white text-[11px] md:text-xs">{d.municipio_nome}</p>
                                        </td>
                                        <td className="px-4 md:px-6 py-2 md:py-3">
                                            <select
                                                value={editForm.tipo || ''}
                                                onChange={e => setEditForm({ ...editForm, tipo: e.target.value })}
                                                className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] md:text-xs bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-turquoise/30"
                                            >
                                                {tipoOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 md:px-6 py-2 md:py-3 text-center">
                                            <select
                                                value={editForm.prioridade || 'Média'}
                                                onChange={e => setEditForm({ ...editForm, prioridade: e.target.value })}
                                                className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] md:text-xs bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-turquoise/30"
                                            >
                                                {prioridadeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 md:px-6 py-2 md:py-3 text-center">
                                            <select
                                                value={editForm.origem || ''}
                                                onChange={e => setEditForm({ ...editForm, origem: e.target.value })}
                                                className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] md:text-xs bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-turquoise/30"
                                            >
                                                <option value="Alê Portela">Alê</option>
                                                <option value="Lincoln Portela">Lincoln</option>
                                            </select>
                                        </td>
                                        <td className="px-4 md:px-6 py-2 md:py-3">
                                            <input
                                                type="date"
                                                value={editForm.prazo || ''}
                                                onChange={e => setEditForm({ ...editForm, prazo: e.target.value })}
                                                className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-turquoise/30"
                                            />
                                        </td>
                                        <td className="px-4 md:px-6 py-2 md:py-3 text-center">
                                            <select
                                                value={editForm.status || 'Em Análise'}
                                                onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                                className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] md:text-xs bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-turquoise/30"
                                            >
                                                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 md:px-6 py-2 md:py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={saveEdit}
                                                    disabled={saving}
                                                    className="size-7 md:size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-emerald-600 text-sm md:text-base">check</span>
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="size-7 md:size-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-slate-500 text-sm md:text-base">close</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // Linha normal
                                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="px-4 md:px-6 py-2.5 md:py-4">
                                            <div
                                                className="cursor-pointer group/dem"
                                                onClick={() => navigateTo('DemandaMunicipio', { municipioId: d.municipioId, municipioNome: d.municipio_nome, demandaId: d.id })}
                                            >
                                                <p className="font-bold text-navy-dark dark:text-white group-hover/dem:text-turquoise transition-colors text-xs md:text-sm">{d.titulo}</p>
                                                {d.descricao && d.descricao !== d.titulo && (
                                                    <p className="text-[9px] md:text-[11px] text-slate-400 mt-0.5 truncate max-w-[150px] md:max-w-[250px]">{d.descricao}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4">
                                            <div
                                                className="cursor-pointer group/mun"
                                                onClick={() => navigateTo('DemandaMunicipio', { municipioId: d.municipioId, municipioNome: d.municipio_nome })}
                                            >
                                                <p className="font-bold text-navy-dark dark:text-white group-hover/mun:text-turquoise transition-colors text-xs md:text-sm">{d.municipio_nome}</p>
                                                <p className="text-[8px] md:text-[10px] text-slate-400 uppercase font-black tracking-tight">{d.regiao}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4">
                                            <span className="px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                                {d.tipo || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4 text-center"><PrioridadeBadge prioridade={d.prioridade} /></td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4 text-center"><MandatoBadge origem={d.origem} /></td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4 text-slate-400 text-[9px] md:text-xs font-medium">
                                            {d.prazo ? new Date(d.prazo).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4 text-center"><StatusBadge status={d.status} /></td>
                                        <td className="px-4 md:px-6 py-2.5 md:py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => startEdit(d)}
                                                    className="size-7 md:size-8 rounded-lg bg-turquoise/10 hover:bg-turquoise/20 flex items-center justify-center transition-all group/btn"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-turquoise text-[16px] md:text-base group-hover/btn:scale-110 transition-transform">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(d)}
                                                    className="size-7 md:size-8 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-all group/btn-del"
                                                    title="Excluir"
                                                >
                                                    <span className="material-symbols-outlined text-rose-500 text-[16px] md:text-base group-hover/btn-del:scale-110 transition-transform">delete</span>
                                                </button>
                                                <button
                                                    onClick={() => navigateTo('DemandaMunicipio', { municipioId: d.municipioId, municipioNome: d.municipio_nome })}
                                                    className="size-7 md:size-8 rounded-lg bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center transition-all group/btn2"
                                                    title="Ver mais"
                                                >
                                                    <span className="material-symbols-outlined text-slate-400 text-[16px] group-hover/btn2:text-navy-dark dark:group-hover/btn2:text-white transition-colors">open_in_new</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                    {demandasFiltradas.length === 0 && (
                        <div className="p-20 text-center">
                            <span className="material-symbols-outlined text-6xl text-slate-200">inbox</span>
                            <p className="text-slate-400 mt-4 font-medium">Nenhuma demanda encontrada com os filtros aplicados.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Nova Demanda */}
            {showNovaModal && (
                <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowNovaModal(false)}>
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-8 pb-4 shrink-0 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-extrabold text-navy-dark dark:text-white">Nova Demanda</h3>
                                    <p className="text-sm text-slate-400">Registre uma nova demanda no sistema.</p>
                                </div>
                                <button onClick={() => setShowNovaModal(false)} className="size-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                    <span className="material-symbols-outlined text-slate-500">close</span>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Município <span className="text-rose-500">*</span></label>
                                    <select
                                        ref={municipioRef}
                                        value={novaForm.municipio_id}
                                        onChange={e => {
                                            setNovaForm({ ...novaForm, municipio_id: e.target.value });
                                            if (formErrors.includes('municipio')) setFormErrors(prev => prev.filter(f => f !== 'municipio'));
                                        }}
                                        className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('municipio') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30 font-medium`}
                                    >
                                        <option value="">Selecione um município...</option>
                                        {municipios.sort((a, b) => a.nome.localeCompare(b.nome)).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Título <span className="text-rose-500">*</span></label>
                                    <input
                                        ref={tituloRef}
                                        value={novaForm.titulo}
                                        onChange={e => {
                                            setNovaForm({ ...novaForm, titulo: e.target.value });
                                            if (formErrors.includes('titulo')) setFormErrors(prev => prev.filter(f => f !== 'titulo'));
                                        }}
                                        className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('titulo') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30`}
                                        placeholder="Ex: Reforma da UBS Central"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Descrição <span className="text-rose-500">*</span></label>
                                    <textarea
                                        ref={descricaoRef}
                                        value={novaForm.descricao}
                                        onChange={e => {
                                            setNovaForm({ ...novaForm, descricao: e.target.value });
                                            if (formErrors.includes('descricao')) setFormErrors(prev => prev.filter(f => f !== 'descricao'));
                                        }}
                                        className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('descricao') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30 resize-none h-20`}
                                        placeholder="Detalhes da demanda..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tipo</label>
                                    <select value={novaForm.tipo} onChange={e => setNovaForm({ ...novaForm, tipo: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30">
                                        {tipoOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Prioridade</label>
                                    <select value={novaForm.prioridade} onChange={e => setNovaForm({ ...novaForm, prioridade: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30">
                                        {prioridadeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Origem</label>
                                    <select value={novaForm.origem} onChange={e => setNovaForm({ ...novaForm, origem: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30">
                                        <option value="Alê Portela">Alê Portela</option>
                                        <option value="Lincoln Portela">Lincoln Portela</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Prazo</label>
                                    <input
                                        type="date"
                                        value={novaForm.prazo}
                                        onChange={e => setNovaForm({ ...novaForm, prazo: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNovaModal(false)}
                                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !novaForm.municipio_id || !novaForm.titulo}
                                    className="px-6 py-2.5 bg-turquoise text-white rounded-xl text-sm font-bold hover:bg-turquoise/90 transition-all shadow-lg shadow-turquoise/20 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {saving ? 'Salvando...' : 'Criar Demanda'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Nova Demanda content... */}
            {/* Modal Nova Demanda code block ends around line 521 */}
            
            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Excluir Demanda"
                message={`Tem certeza que deseja remover a demanda "${itemToDelete?.titulo}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
            />
        </div>
    );
};

export default DemandasPage;
