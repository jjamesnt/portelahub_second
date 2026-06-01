import React, { useState, useEffect, useMemo } from 'react';
import { getAllRecursos, createRecurso, getMunicipios, getMunicipiosSimples, deleteRecurso } from '../services/api';
import { Recurso, Municipio } from '../types';
import Loader from '../components/Loader';
import MandatoBadge from '../components/MandatoBadge';
import ConfirmModal from '../components/ConfirmModal';

interface ExtendedRecurso extends Recurso {
    municipio_nome: string;
    regiao: string;
}

const StatusBadge: React.FC<{ status: Recurso['status'] }> = ({ status }) => {
    const styles = {
        'Aprovado': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        'Em Execução': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        'Concluído': 'bg-slate-50 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400',
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider whitespace-nowrap ${styles[status] || styles['Aprovado']}`}>
            {status.toUpperCase()}
        </span>
    );
};

const TipoBadge: React.FC<{ tipo: string }> = ({ tipo }) => {
    const styles: { [key: string]: string } = {
        'Emenda': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
        'Veículo': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        'Equipamento': 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
        'Obra': 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
    };

    // Suporte a múltiplas destinações separadas por vírgula
    const tipos = tipo.split(',').map(t => t.trim());

    return (
        <div className="flex flex-wrap gap-1">
            {tipos.map((t, idx) => (
                <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase ${styles[t] || 'bg-slate-50 text-slate-600'}`}>
                    {t}
                </span>
            ))}
        </div>
    );
};

const GestaoRecursosPage: React.FC<{ navigateTo: (page: string, params?: any) => void }> = ({ navigateTo }) => {
    const [recursos, setRecursos] = useState<ExtendedRecurso[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [showNovoModal, setShowNovaModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<ExtendedRecurso | null>(null);

    const [formErrors, setFormErrors] = useState<string[]>([]);
    const municipioRef = React.useRef<HTMLSelectElement>(null);
    const descricaoRef = React.useRef<HTMLInputElement>(null);
    const valorRef = React.useRef<HTMLInputElement>(null);
    const tipoRef = React.useRef<HTMLInputElement>(null);

    const [novaForm, setNovaForm] = useState({
        municipio_id: '',
        tipo: 'Emenda',
        descricao: '',
        valor: 0,
        origem: 'Alê Portela' as Recurso['origem'],
        responsavel: '',
        status: 'Aprovado' as Recurso['status'],
        data_aprovacao: new Date().toISOString().split('T')[0],
        observacoes: ''
    });

    const [filtroTexto, setFiltroTexto] = useState('');
    const [filtroMunicipio, setFiltroMunicipio] = useState('Todos');
    const [filtroRegiao, setFiltroRegiao] = useState('Todas');
    const [filtroAssessor, setFiltroAssessor] = useState('Todos');
    const [filtroTipo, setFiltroTipo] = useState('Todos');
    const [filtroStatus, setFiltroStatus] = useState('Todos');
    const [filtroDeputado, setFiltroDeputado] = useState('Todos');

    const fetchData = async () => {
        let isMounted = true;
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn("[Recursos] Safety timeout atingido.");
                setIsLoading(false);
            }
        }, 12000);

        try {
            setIsLoading(true);
            const [recursosData, municipiosData] = await Promise.all([
                getAllRecursos().catch(() => []),
                getMunicipiosSimples().catch(() => [])
            ]);
            
            if (isMounted) {
                setRecursos((recursosData as ExtendedRecurso[]) || []);
                setMunicipios(municipiosData || []);
            }
        } catch (err) {
            console.error("Erro ao carregar recursos:", err);
        } finally {
            if (isMounted) {
                setIsLoading(false);
                clearTimeout(timeoutId);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const municipiosList = useMemo(() => ['Todos', ...new Set(recursos.map(r => r.municipio_nome))].sort(), [recursos]);
    const regioesList = useMemo(() => ['Todas', ...new Set(recursos.map(r => r.regiao))].sort(), [recursos]);
    const assessoresList = useMemo(() => ['Todos', ...new Set(recursos.map(r => r.responsavel))].filter(Boolean).sort(), [recursos]);
    const tipos = ['Todos', 'Emenda', 'Veículo', 'Equipamento', 'Obra'];
    const statuses = ['Todos', 'Aprovado', 'Em Execução', 'Concluído'];

    const recursosFiltrados = useMemo(() => {
        return recursos.filter(r => {
            const matchesText = r.descricao.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                r.municipio_nome.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                r.origem.toLowerCase().includes(filtroTexto.toLowerCase());
            const matchesMunicipio = filtroMunicipio === 'Todos' || r.municipio_nome === filtroMunicipio;
            const matchesRegiao = filtroRegiao === 'Todas' || r.regiao === filtroRegiao;
            const matchesAssessor = filtroAssessor === 'Todos' || r.responsavel === filtroAssessor;
            const matchesTipo = filtroTipo === 'Todos' || r.tipo.includes(filtroTipo);
            const matchesStatus = filtroStatus === 'Todos' || r.status === filtroStatus;
            const matchesDeputado = filtroDeputado === 'Todos' || r.origem === filtroDeputado;
            return matchesText && matchesMunicipio && matchesRegiao && matchesAssessor && matchesTipo && matchesStatus && matchesDeputado;
        });
    }, [recursos, filtroTexto, filtroMunicipio, filtroRegiao, filtroAssessor, filtroTipo, filtroStatus, filtroDeputado]);

    const totalValor = useMemo(() => recursosFiltrados.reduce((acc, r) => acc + r.valor, 0), [recursosFiltrados]);
    const topMunicipio = useMemo(() => {
        if (recursosFiltrados.length === 0) return '-';
        const counts: { [key: string]: number } = {};
        recursosFiltrados.forEach(r => {
            counts[r.municipio_nome] = (counts[r.municipio_nome] || 0) + r.valor;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    }, [recursosFiltrados]);

    if (isLoading) return <Loader />;

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                <div className="min-w-0">
                    <h1 className="text-xl md:text-3xl font-extrabold text-navy-dark dark:text-white tracking-tight truncate">Gestão de Recursos</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[10px] md:text-base">Análise e controle de investimentos.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const activeFilters: { [key: string]: string } = {};
                            if (filtroMunicipio !== 'Todos') activeFilters['Município'] = filtroMunicipio;
                            if (filtroRegiao !== 'Todas') activeFilters['Região'] = filtroRegiao;
                            if (filtroAssessor !== 'Todos') activeFilters['Assessor'] = filtroAssessor;
                            if (filtroTipo !== 'Todos') activeFilters['Tipo'] = filtroTipo;
                            if (filtroStatus !== 'Todos') activeFilters['Status'] = filtroStatus;
                            if (filtroDeputado !== 'Todos') activeFilters['Deputado'] = filtroDeputado;
                            if (filtroTexto) activeFilters['Busca'] = filtroTexto;

                            const reportPayload = {
                                data: recursosFiltrados,
                                filters: activeFilters,
                                issuer: 'Alê Portela'
                            };

                            sessionStorage.setItem('relatorio_recursos', JSON.stringify(reportPayload));
                            window.open(window.location.href + '?report=recursos', '_blank');
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 md:px-6 py-2.5 md:py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-indigo-500 text-base md:text-lg">description</span>
                        Relatório
                    </button>
                    <button
                        onClick={() => setShowNovaModal(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 md:px-6 py-2.5 md:py-3 bg-turquoise text-white rounded-xl text-xs md:text-sm font-bold hover:bg-turquoise/90 transition-all shadow-lg shadow-turquoise/20"
                    >
                        <span className="material-symbols-outlined text-base md:text-lg">add_circle</span>
                        Novo
                    </button>
                </div>
            </div>

            {/* Visão Estratégica - Mini Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
                <div className="col-span-2 md:col-span-1 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[100px] md:min-h-[140px]">
                    <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-indigo-500/5 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 transition-transform group-hover:scale-110"></div>
                    <div>
                        <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">
                            {(filtroTexto || filtroMunicipio !== 'Todos' || filtroRegiao !== 'Todas' || filtroAssessor !== 'Todos' || filtroTipo !== 'Todos' || filtroStatus !== 'Todos' || filtroDeputado !== 'Todos')
                                ? 'TOTAL FILTRADO'
                                : 'RECURSOS ALOCADOS'}
                        </p>
                        <h2 className="text-xl md:text-3xl font-black text-navy-dark dark:text-white leading-tight">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(totalValor)}
                        </h2>
                    </div>

                    {(filtroTexto || filtroMunicipio !== 'Todos' || filtroRegiao !== 'Todas' || filtroAssessor !== 'Todos' || filtroTipo !== 'Todos' || filtroStatus !== 'Todos' || filtroDeputado !== 'Todos') && (
                        <button
                            onClick={() => {
                                setFiltroTexto('');
                                setFiltroMunicipio('Todos');
                                setFiltroRegiao('Todas');
                                setFiltroAssessor('Todos');
                                setFiltroTipo('Todos');
                                setFiltroStatus('Todos');
                                setFiltroDeputado('Todos');
                            }}
                            className="mt-2 md:mt-4 flex items-center justify-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-rose-500 text-white hover:bg-rose-600 rounded-lg md:rounded-xl transition-all font-bold text-[8px] md:text-[10px] shadow-lg shadow-rose-500/20 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-xs md:text-sm">filter_alt_off</span>
                            LIMPAR FILTROS
                        </button>
                    )}
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group min-h-[100px] md:min-h-0">
                    <div className="absolute top-0 right-0 w-20 md:w-24 h-20 md:h-24 bg-blue-500/5 rounded-full -mr-10 -mt-10 md:-mr-12 md:-mt-12 transition-transform group-hover:scale-110"></div>
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">TOP MUNICÍPIO</p>
                    <h2 className="text-base md:text-2xl font-black text-navy-dark dark:text-white truncate">{topMunicipio}</h2>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group min-h-[100px] md:min-h-0">
                    <div className="absolute top-0 right-0 w-20 md:w-24 h-20 md:h-24 bg-indigo-500/5 rounded-full -mr-10 -mt-10 md:-mr-12 md:-mt-12 transition-transform group-hover:scale-110"></div>
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">TOTAL QTD</p>
                    <h2 className="text-base md:text-2xl font-black text-navy-dark dark:text-white">{recursosFiltrados.length}</h2>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-sm">
                {/* Filtragem Otimizada */}
                <div className="p-3 md:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-3 md:gap-4 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                        <div className="relative flex-1 w-full group">
                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 transition-colors ${filtroTexto ? 'text-indigo-500 font-bold' : 'text-slate-400'}`}>
                                <span className="material-symbols-outlined text-base md:text-lg">search</span>
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className={`w-full pl-9 pr-9 py-2 md:py-3 border-2 rounded-xl text-xs md:text-sm outline-none transition-all ${filtroTexto ? 'bg-indigo-50/50 border-indigo-500 text-indigo-900 ring-4 ring-indigo-500/10' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-turquoise'}`}
                                value={filtroTexto}
                                onChange={(e) => setFiltroTexto(e.target.value)}
                            />
                            {filtroTexto && (
                                <button
                                    onClick={() => setFiltroTexto('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[14px] md:text-base">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
                        <div className="relative group">
                            <select
                                value={filtroDeputado}
                                onChange={(e) => setFiltroDeputado(e.target.value)}
                                className={`w-full border-2 rounded-lg text-[10px] md:text-[13px] pl-2 md:pl-3 pr-6 md:pr-8 py-1.5 md:py-2 outline-none transition-all font-bold appearance-none ${filtroDeputado !== 'Todos' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                <option value="Todos" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Deputados</option>
                                <option value="Alê Portela" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Alê Portela</option>
                                <option value="Lincoln Portela" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Lincoln Portela</option>
                            </select>
                            <span className={`absolute right-1.5 md:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm md:text-base pointer-events-none transition-colors ${filtroDeputado !== 'Todos' ? 'text-white' : 'text-slate-400'}`}>expand_more</span>
                        </div>

                        <div className="relative group">
                            <select
                                value={filtroMunicipio}
                                onChange={e => setFiltroMunicipio(e.target.value)}
                                className={`w-full border-2 rounded-lg text-[10px] md:text-[13px] pl-2 md:pl-3 pr-6 md:pr-8 py-1.5 md:py-2 outline-none transition-all appearance-none ${filtroMunicipio !== 'Todos' ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                {municipiosList.map(m => <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{m === 'Todos' ? 'Municípios' : m}</option>)}
                            </select>
                            <span className={`absolute right-1.5 md:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm md:text-base pointer-events-none transition-colors ${filtroMunicipio !== 'Todos' ? 'text-white' : 'text-slate-400'}`}>expand_more</span>
                        </div>

                        <div className="relative group">
                            <select
                                value={filtroRegiao}
                                onChange={e => setFiltroRegiao(e.target.value)}
                                className={`w-full border-2 rounded-lg text-[10px] md:text-[13px] pl-2 md:pl-3 pr-6 md:pr-8 py-1.5 md:py-2 outline-none transition-all appearance-none ${filtroRegiao !== 'Todas' ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                {regioesList.map(r => <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{r === 'Todas' ? 'Regiões' : r}</option>)}
                            </select>
                            <span className={`absolute right-1.5 md:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm md:text-base pointer-events-none transition-colors ${filtroRegiao !== 'Todas' ? 'text-white' : 'text-slate-400'}`}>expand_more</span>
                        </div>

                        <div className="relative group">
                            <select
                                value={filtroAssessor}
                                onChange={e => setFiltroAssessor(e.target.value)}
                                className={`w-full border-2 rounded-lg text-[10px] md:text-[13px] pl-2 md:pl-3 pr-6 md:pr-8 py-1.5 md:py-2 outline-none transition-all appearance-none ${filtroAssessor !== 'Todos' ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                {assessoresList.map(a => <option key={a} value={a} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{a === 'Todos' ? 'Assessores' : a}</option>)}
                            </select>
                            <span className={`absolute right-1.5 md:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm md:text-base pointer-events-none transition-colors ${filtroAssessor !== 'Todos' ? 'text-white' : 'text-slate-400'}`}>expand_more</span>
                        </div>

                        <div className="relative group">
                            <select
                                value={filtroTipo}
                                onChange={e => setFiltroTipo(e.target.value)}
                                className={`w-full border-2 rounded-lg text-[10px] md:text-[13px] pl-2 md:pl-3 pr-6 md:pr-8 py-1.5 md:py-2 outline-none transition-all appearance-none ${filtroTipo !== 'Todos' ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                {tipos.map(t => <option key={t} value={t} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{t === 'Todos' ? 'Destinações' : t}</option>)}
                            </select>
                            <span className={`absolute right-1.5 md:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm md:text-base pointer-events-none transition-colors ${filtroTipo !== 'Todos' ? 'text-white' : 'text-slate-400'}`}>expand_more</span>
                        </div>

                        <div className="relative group">
                            <select
                                value={filtroStatus}
                                onChange={e => setFiltroStatus(e.target.value)}
                                className={`w-full border-2 rounded-lg text-[10px] md:text-[13px] pl-2 md:pl-3 pr-6 md:pr-8 py-1.5 md:py-2 outline-none transition-all appearance-none ${filtroStatus !== 'Todos' ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                            >
                                {statuses.map(s => <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{s === 'Todos' ? 'Status' : s}</option>)}
                            </select>
                            <span className={`absolute right-1.5 md:right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm md:text-base pointer-events-none transition-colors ${filtroStatus !== 'Todos' ? 'text-white' : 'text-slate-400'}`}>expand_more</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left min-w-[750px] md:min-w-[1000px]">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="px-4 md:px-6 py-2.5 md:py-4 w-12 md:w-16">#</th>
                                <th className="px-4 md:px-6 py-2.5 md:py-4">MUNICÍPIO</th>
                                <th className="px-4 md:px-6 py-2.5 md:py-4">RECURSO</th>
                                <th className="px-4 md:px-6 py-2.5 md:py-4">DESTINAÇÃO</th>
                                <th className="px-4 md:px-6 py-2.5 md:py-4">ORIGEM</th>
                                <th className="px-4 md:px-6 py-2.5 md:py-4 text-right">VALOR</th>
                                <th className="px-4 md:px-6 py-2.5 md:py-4 text-center">STATUS</th>
                                <th className="px-4 md:px-6 py-2.5 md:py-4 text-center w-10 md:w-14"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-[11px] md:text-sm">
                            {recursosFiltrados.map((r, index) => (
                                <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <td className="px-4 md:px-6 py-2.5 md:py-4">
                                        <div className={`size-6 md:size-7 rounded-lg flex items-center justify-center font-black text-[10px] md:text-xs ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-100 text-slate-500' : index === 2 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-2.5 md:py-4">
                                        <div
                                            className="cursor-pointer group/mun"
                                            onClick={() => navigateTo('MunicipioDetalhes', { id: r.municipioId })}
                                        >
                                            <p className="font-bold text-navy-dark dark:text-white group-hover/mun:text-turquoise transition-colors truncate max-w-[100px] md:max-w-none">{r.municipio_nome}</p>
                                            <p className="text-[8px] md:text-[10px] text-slate-400 uppercase font-medium">{r.regiao}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-2.5 md:py-4 font-medium text-slate-700 dark:text-slate-200 group-hover:text-turquoise transition-colors truncate max-w-[120px] md:max-w-none">{r.descricao}</td>
                                    <td className="px-4 md:px-6 py-2.5 md:py-4"><TipoBadge tipo={r.tipo} /></td>
                                    <td className="px-4 md:px-6 py-2.5 md:py-4">
                                        <MandatoBadge origem={r.origem} />
                                    </td>
                                    <td className="px-4 md:px-6 py-2.5 md:py-4 font-black text-navy-dark dark:text-white whitespace-nowrap text-right">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(r.valor)}
                                    </td>
                                    <td className="px-4 md:px-6 py-2.5 md:py-4 text-center"><StatusBadge status={r.status} /></td>
                                    <td className="px-4 md:px-6 py-2.5 md:py-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                onClick={() => navigateTo('MunicipioDetalhes', { id: r.municipioId })}
                                                className="size-7 md:size-8 rounded-lg bg-turquoise/10 hover:bg-turquoise/20 flex items-center justify-center transition-all group/btn"
                                                title="Ver no Mapa/Cidade"
                                            >
                                                <span className="material-symbols-outlined text-turquoise text-[14px] md:text-base group-hover/btn:scale-110 transition-transform">open_in_new</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setItemToDelete(r);
                                                    setIsConfirmDeleteOpen(true);
                                                }}
                                                className="size-7 md:size-8 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-all group/btn-del"
                                                title="Excluir"
                                            >
                                                <span className="material-symbols-outlined text-rose-500 text-[14px] md:text-base group-hover/btn-del:scale-110 transition-transform">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {recursosFiltrados.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <span className="material-symbols-outlined text-5xl mb-2 opacity-20">inventory_2</span>
                            <p className="text-sm font-medium">Nenhum recurso encontrado com os filtros atuais.</p>
                        </div>
                    )}
                </div>
            </div>
            {/* Modal Novo Recurso */}
            {showNovoModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNovaModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-extrabold text-navy-dark dark:text-white">Novo Recurso</h3>
                                <p className="text-sm text-slate-400">Registre a alocação de um novo recurso.</p>
                            </div>
                            <button onClick={() => setShowNovaModal(false)} className="size-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                <span className="material-symbols-outlined text-slate-500">close</span>
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            
                            const errors = [];
                            if (!novaForm.municipio_id) errors.push('municipio');
                            if (!novaForm.descricao?.trim()) errors.push('descricao');
                            if (!novaForm.valor || novaForm.valor <= 0) errors.push('valor');
                            if (!novaForm.tipo?.trim()) errors.push('tipo');

                            setFormErrors(errors);

                            if (errors.length > 0) {
                                if (errors.includes('municipio')) municipioRef.current?.focus();
                                else if (errors.includes('descricao')) descricaoRef.current?.focus();
                                else if (errors.includes('valor')) valorRef.current?.focus();
                                else if (errors.includes('tipo')) tipoRef.current?.focus();
                                return;
                            }

                            setSaving(true);
                            try {
                                await createRecurso(novaForm);
                                fetchData();
                                setShowNovaModal(false);
                                setNovaForm({
                                    municipio_id: '',
                                    tipo: 'Emenda',
                                    descricao: '',
                                    valor: 0,
                                    origem: 'Alê Portela',
                                    responsavel: '',
                                    status: 'Aprovado',
                                    data_aprovacao: new Date().toISOString().split('T')[0],
                                    observacoes: ''
                                });
                                setFormErrors([]);
                            } catch (err) {
                                console.error(err);
                            } finally {
                                setSaving(false);
                            }
                        }} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Município <span className="text-rose-500">*</span></label>
                                    <select
                                        ref={municipioRef}
                                        value={novaForm.municipio_id}
                                        onChange={e => {
                                            setNovaForm({...novaForm, municipio_id: e.target.value});
                                            if (formErrors.includes('municipio')) setFormErrors(prev => prev.filter(f => f !== 'municipio'));
                                        }}
                                        className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('municipio') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30`}
                                    >
                                        <option value="">Selecione o município beneficiado...</option>
                                        {municipios.sort((a,b) => a.nome.localeCompare(b.nome)).map(m => (
                                            <option key={m.id} value={m.id}>{m.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Descrição do Recurso <span className="text-rose-500">*</span></label>
                                    <input
                                        ref={descricaoRef}
                                        type="text"
                                        placeholder="Ex: Emenda para custeio de saúde"
                                        value={novaForm.descricao}
                                        onChange={e => {
                                            setNovaForm({...novaForm, descricao: e.target.value});
                                            if (formErrors.includes('descricao')) setFormErrors(prev => prev.filter(f => f !== 'descricao'));
                                        }}
                                        className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('descricao') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30`}
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Valor (R$) <span className="text-rose-500">*</span></label>
                                    <input
                                        ref={valorRef}
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                        value={novaForm.valor || ''}
                                        onChange={e => {
                                            setNovaForm({...novaForm, valor: parseFloat(e.target.value) || 0});
                                            if (formErrors.includes('valor')) setFormErrors(prev => prev.filter(f => f !== 'valor'));
                                        }}
                                        className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('valor') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30 font-bold`}
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tipo/Destinação <span className="text-rose-500">*</span></label>
                                    <input
                                        ref={tipoRef}
                                        type="text"
                                        placeholder="Ex: Emenda, Veículo..."
                                        value={novaForm.tipo}
                                        onChange={e => {
                                            setNovaForm({...novaForm, tipo: e.target.value});
                                            if (formErrors.includes('tipo')) setFormErrors(prev => prev.filter(f => f !== 'tipo'));
                                        }}
                                        className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('tipo') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30`}
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Origem/Mandato *</label>
                                    <select
                                        value={novaForm.origem}
                                        onChange={e => setNovaForm({...novaForm, origem: e.target.value as any})}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30"
                                    >
                                        <option value="Alê Portela">Alê Portela</option>
                                        <option value="Lincoln Portela">Lincoln Portela</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Status</label>
                                    <select
                                        value={novaForm.status}
                                        onChange={e => setNovaForm({...novaForm, status: e.target.value as any})}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30"
                                    >
                                        <option value="Aprovado">Aprovado</option>
                                        <option value="Em Execução">Em Execução</option>
                                        <option value="Concluído">Concluído</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Responsável (Assessor)</label>
                                    <input
                                        type="text"
                                        placeholder="Nome do assessor..."
                                        value={novaForm.responsavel}
                                        onChange={e => setNovaForm({...novaForm, responsavel: e.target.value})}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Data de Aprovação</label>
                                    <input
                                        type="date"
                                        value={novaForm.data_aprovacao}
                                        onChange={e => setNovaForm({...novaForm, data_aprovacao: e.target.value})}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-turquoise/30"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setShowNovaModal(false)}
                                    className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 text-sm font-bold bg-turquoise text-white rounded-xl hover:brightness-110 shadow-lg shadow-turquoise/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? 'Gravando...' : 'Salvar Recurso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={async () => {
                    if (!itemToDelete) return;
                    setSaving(true);
                    try {
                        await deleteRecurso(itemToDelete.id);
                        await fetchData();
                        setIsConfirmDeleteOpen(false);
                    } catch (err) {
                        console.error(err);
                    } finally {
                        setSaving(false);
                    }
                }}
                title="Excluir Recurso"
                message={`Tem certeza que deseja remover o recurso "${itemToDelete?.descricao}"? O valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemToDelete?.valor || 0)} será removido do balanço do município.`}
                confirmText="Excluir"
            />
        </div>
    );
};

export default GestaoRecursosPage;
