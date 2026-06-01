
import React, { useState, useMemo, useEffect, useContext, useCallback, useRef } from 'react';
import { getMunicipios, getMunicipiosSimples, createMunicipio, getAssessores } from '../services/api';
import { Municipio, Assessor } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { AppContext } from '../context/AppContext';

interface MunicipiosPageProps {
    navigateTo: (page: string, params: { id: string }) => void;
}


// Cores por Mesorregião de MG
const REGION_COLORS: Record<string, { bg: string, text: string }> = {
    'Região Metropolitana': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
    'Zona da Mata': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
    'Triângulo Mineiro': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
    'Norte de Minas': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
    'Sul de Minas': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
    'Alto Paranaíba': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
    'Central Mineira': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
    'Vale do Rio Doce': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-400' },
    'Oeste de Minas': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
    'Campo das Vertentes': { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400' },
    'Jequitinhonha': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
    'Vale do Mucuri': { bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-400' },
    'Noroeste de Minas': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
};

const getRegionColor = (regiao: string) => {
    return REGION_COLORS[regiao] || { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300' };
};

// Status do Prefeito Colors
const getStatusPrefeitoColor = (status?: string) => {
    switch (status) {
        case 'Prefeitura Fechada': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
        case 'Prefeitura Parceira': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        case 'Não': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        default: return 'bg-slate-50 text-slate-400 dark:bg-slate-800/50';
    }
};

// Skeleton Loading Component
const CardSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 h-[180px]">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            </div>
        ))}
    </div>
);

// Highlight text component
const HighlightText: React.FC<{ text: string, highlight: string }> = ({ text, highlight }) => {
    if (!highlight.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ?
                    <mark key={i} className="bg-yellow-200 dark:bg-yellow-600/50 px-0.5 rounded">{part}</mark> : part
            )}
        </>
    );
};

// Sort direction type
type SortDirection = 'asc' | 'desc' | null;
type SortField = 'nome' | 'regiao' | 'totalRecursos' | 'totalDemandas' | 'statusAtividade' | 'populacao' | 'statusAtendimento' | 'principalDemanda';

const MunicipiosPage: React.FC<MunicipiosPageProps> = ({ navigateTo }) => {
    const { selectedMandato } = useAppContext();

    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [assessores, setAssessores] = useState<Assessor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterRegion, setFilterRegion] = useState<string>('Todos');
    const [filterAssessor, setFilterAssessor] = useState<string>('Todos');
    const [filterStatusPrefeito, setFilterStatusPrefeito] = useState<string>('Todos');
    const [filterStatusAtividade, setFilterStatusAtividade] = useState<string[]>([]);

    // Sorting
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    // Votes data

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        regiao: '',
        populacao: '',
        idh: '',
        pib_per_capita: '',
        influencia: '50',
        status_atividade: 'Manutenção',
        assessor_id: ''
    });

    const [formErrors, setFormErrors] = useState<string[]>([]);
    const nomeRef = useRef<HTMLInputElement>(null);
    const regiaoRef = useRef<HTMLSelectElement>(null);
    const statusRef = useRef<HTMLSelectElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const fetchData = async () => {
            let isMounted = true;
            const timeoutId = setTimeout(() => {
                if (isMounted) {
                    console.warn("[Municipios] Safety timeout atingido.");
                    setIsLoading(false);
                }
            }, 12000);

            try {
                setIsLoading(true);
                const [municipiosData, assessoresData] = await Promise.all([
                    getMunicipiosSimples().catch(() => []),
                    getAssessores().catch(() => [])
                ]);
                
                if (isMounted) {
                    setMunicipios(municipiosData || []);
                    setAssessores(assessoresData || []);
                    setError(null);
                }
            } catch (err) {
                console.error("Erro ao carregar municípios:", err);
                if (isMounted) setError('Falha ao carregar os dados.');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    clearTimeout(timeoutId);
                }
            }
        };
        fetchData();
    }, []);

    // Get unique regions for filter
    const uniqueRegions = useMemo(() => {
        const regions = [...new Set(municipios.map(m => m.regiao))].filter(Boolean).sort();
        return regions;
    }, [municipios]);

    // Handle sort
    const handleSort = useCallback((field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'asc') setSortDirection('desc');
            else if (sortDirection === 'desc') { setSortField(null); setSortDirection(null); }
            else setSortDirection('asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    }, [sortField, sortDirection]);

    // Filter and sort municipalities
    const municipiosFiltrados = useMemo(() => {
        let filtered = municipios.filter(m => {
            // Search filter
            if (debouncedSearch && !m.nome.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
            // Region filter
            if (filterRegion !== 'Todos' && m.regiao !== filterRegion) return false;
            // Assessor filter
            if (filterAssessor !== 'Todos') {
                const assessor = assessores.find(a => a.id === m.assessorId);
                if (assessor?.nome !== filterAssessor) return false;
            }
            // Status Prefeito filter
            if (filterStatusPrefeito !== 'Todos' && m.statusPrefeito !== filterStatusPrefeito) return false;
            // Status Atividade filter
            if (filterStatusAtividade.length > 0 && !filterStatusAtividade.includes(m.statusAtividade)) return false;
            
            return true;
        });

        // Sort
        if (sortField && sortDirection) {
            filtered = [...filtered].sort((a, b) => {
                let aVal: any, bVal: any;
                switch (sortField) {
                    case 'nome': aVal = a.nome; bVal = b.nome; break;
                    case 'regiao': aVal = a.regiao; bVal = b.regiao; break;
                    case 'totalRecursos': aVal = a.totalRecursos || 0; bVal = b.totalRecursos || 0; break;
                    case 'totalDemandas': aVal = a.totalDemandas || 0; bVal = b.totalDemandas || 0; break;
                    case 'statusAtividade': aVal = a.statusAtividade; bVal = b.statusAtividade; break;
                    case 'populacao': aVal = a.populacao || 0; bVal = b.populacao || 0; break;
                    case 'statusAtendimento': aVal = a.statusAtendimento || ''; bVal = b.statusAtendimento || ''; break;
                    case 'principalDemanda': aVal = a.principalDemanda || ''; bVal = b.principalDemanda || ''; break;
                    default: return 0;
                }
                if (typeof aVal === 'string') {
                    return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            });
        }

        return filtered;
    }, [debouncedSearch, filterRegion, filterAssessor, filterStatusPrefeito, filterStatusAtividade, municipios, sortField, sortDirection]);

    // Summary stats
    const summaryStats = useMemo(() => ({
        total: municipiosFiltrados.length,
        totalInvestimento: municipiosFiltrados.reduce((acc, m) => acc + (m.totalRecursos || 0), 0),
        totalDemandas: municipiosFiltrados.reduce((acc, m) => acc + (m.totalDemandas || 0), 0),
    }), [municipiosFiltrados]);

    // Format population
    const formatPopulation = (pop: number | undefined) => {
        if (!pop) return '';
        if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
        if (pop >= 1000) return `${(pop / 1000).toFixed(0)}k`;
        return pop.toString();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = [];
        if (!formData.nome?.trim()) errors.push('nome');
        if (!formData.regiao) errors.push('regiao');
        if (!formData.status_atividade) errors.push('status');

        setFormErrors(errors);

        if (errors.length > 0) {
            if (errors.includes('nome')) nomeRef.current?.focus();
            else if (errors.includes('regiao')) regiaoRef.current?.focus();
            else if (errors.includes('status')) statusRef.current?.focus();
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const municipioData = {
                nome: formData.nome,
                regiao: formData.regiao,
                populacao: formData.populacao ? parseInt(formData.populacao) : undefined,
                idh: formData.idh ? parseFloat(formData.idh) : undefined,
                pib_per_capita: formData.pib_per_capita ? parseFloat(formData.pib_per_capita) : undefined,
                influencia: parseInt(formData.influencia),
                status_atividade: formData.status_atividade,
                assessor_id: formData.assessor_id || undefined
            };

            await createMunicipio(municipioData);
            const municipiosData = await getMunicipios();
            setMunicipios(municipiosData);
            setSuccessMessage('Município cadastrado com sucesso!');
            setShowModal(false);
            setFormData({
                nome: '',
                regiao: '',
                populacao: '',
                idh: '',
                pib_per_capita: '',
                influencia: '50',
                status_atividade: 'Manutenção',
                assessor_id: ''
            });
            setFormErrors([]);
        } catch (err: any) {
            setError(err.message || 'Erro ao cadastrar município');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatusFilter = (status: string) => {
        setFilterStatusAtividade(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRegion('Todos');
        setFilterAssessor('Todos');
        setFilterStatusPrefeito('Todos');
        setFilterStatusAtividade([]);
    };

    const hasActiveFilters = searchTerm || filterRegion !== 'Todos' || filterAssessor !== 'Todos' || filterStatusPrefeito !== 'Todos' || filterStatusAtividade.length > 0;

    const regioes = ['Região Metropolitana', 'Zona da Mata', 'Triângulo Mineiro', 'Norte de Minas', 'Sul de Minas', 'Alto Paranaíba', 'Central Mineira', 'Vale do Rio Doce', 'Oeste de Minas', 'Campo das Vertentes', 'Jequitinhonha', 'Vale do Mucuri', 'Noroeste de Minas'];
    const statusOptions = ['Consolidado', 'Expansão', 'Manutenção', 'Atenção'];

    // Unified Filter Select Component for mirroring ApoiadoresPage
    const FilterSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder: string }) => (
        <div className="relative group flex-1">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className={`w-full pl-3 pr-9 py-2 md:py-2.5 border rounded-xl text-xs md:text-sm outline-none font-medium transition-all cursor-pointer ${value !== 'Todos' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}
            >
                <option value="Todos">{placeholder}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                <span className={`material-symbols-outlined text-[20px] transition-all ${value !== 'Todos' ? 'text-white' : 'text-slate-400'}`}>keyboard_arrow_down</span>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8">
            {/* Success Message */}
            {successMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in">
                    <span className="material-symbols-outlined">check_circle</span>
                    {successMessage}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-extrabold text-navy-dark dark:text-white tracking-tight">Municípios</h1>
                    <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">Gestão de bases e análise de influência regional.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-turquoise text-navy-dark font-bold rounded-xl hover:bg-turquoise/90 transition-all shadow-lg shadow-turquoise/20 text-xs md:text-base w-full sm:w-auto"
                >
                    <span className="material-symbols-outlined text-[18px] md:text-[24px]">add_circle</span>
                    Novo Município
                </button>
            </div>

            {/* Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-base md:text-xl font-black text-navy-custom dark:text-white">{summaryStats.total}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">Investimento</p>
                    <p className="text-base md:text-xl font-black text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(summaryStats.totalInvestimento)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">Demandas</p>
                    <p className="text-base md:text-xl font-black text-navy-custom dark:text-white">{summaryStats.totalDemandas}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 md:mb-8">
                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Buscar município..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 flex-[2]">
                        <FilterSelect
                            value={filterRegion}
                            onChange={setFilterRegion}
                            options={uniqueRegions}
                            placeholder="Regiões"
                        />
                        <FilterSelect
                            value={filterAssessor}
                            onChange={setFilterAssessor}
                            options={assessores.map(a => a.nome).sort()}
                            placeholder="Assessores"
                        />
                        <FilterSelect
                            value={filterStatusPrefeito}
                            onChange={setFilterStatusPrefeito}
                            options={['Prefeitura Parceira', 'Prefeitura Fechada', 'Não']}
                            placeholder="Status Prefeito"
                        />
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 border border-rose-200 text-rose-500 rounded-xl hover:bg-rose-50 transition-all text-xs font-bold"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            {isLoading ? <CardSkeleton /> : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('nome')}>
                                        <div className="flex items-center gap-1">
                                            Município
                                            {sortField === 'nome' && <span className="material-symbols-outlined text-[14px]">{sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Político</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('statusAtendimento')}>
                                        <div className="flex items-center gap-1">
                                            Atendimento
                                            {sortField === 'statusAtendimento' && <span className="material-symbols-outlined text-[14px]">{sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Demanda</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessoria</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Técnico</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {municipiosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            <span className="material-symbols-outlined text-5xl mb-2 opacity-30">location_city</span>
                                            <p className="font-medium">Nenhum município encontrado</p>
                                            <p className="text-sm">{hasActiveFilters ? 'Tente ajustar os filtros' : 'Clique em "Novo Município" para começar'}</p>
                                        </td>
                                    </tr>
                                ) : (
                                    municipiosFiltrados.map(municipio => {
                                        const assessor = assessores.find(a => a.id === municipio.assessorId);
                                        const regionColor = getRegionColor(municipio.regiao);

                                        return (
                                            <tr 
                                                key={municipio.id} 
                                                onClick={() => navigateTo('MunicipioDetalhes', { id: municipio.id })}
                                                className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-navy-dark dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            <HighlightText text={municipio.nome} highlight={debouncedSearch} />
                                                        </span>
                                                        <span className={`inline-block w-fit mt-1 px-1.5 py-0.5 text-[8px] font-bold rounded-md ${regionColor.bg} ${regionColor.text} uppercase tracking-tighter`}>
                                                            {municipio.regiao}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusPrefeitoColor(municipio.statusPrefeito)}`}>
                                                            {municipio.statusPrefeito || 'Não informado'}
                                                        </span>
                                                        {municipio.lincolnFechado && (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[12px]">beenhere</span>
                                                                Fechado
                                                            </span>
                                                        )}
                                                        {municipio.idene && (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">IDENE</span>
                                                        )}
                                                        {(municipio as any).totalApoiadores > 0 && (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[12px]">group</span>
                                                                {(municipio as any).totalApoiadores} {(municipio as any).totalApoiadores === 1 ? 'Apoiador' : 'Apoiadores'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {municipio.statusAtendimento ? (
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                            municipio.statusAtendimento === 'Contemplado' 
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                        }`}>
                                                            {municipio.statusAtendimento}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-bold italic">Pendente</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-[150px]">
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate" title={municipio.principalDemanda}>
                                                            {municipio.principalDemanda || '—'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                                                            <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                            {assessor?.nome || '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Recursos</span>
                                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(municipio.totalRecursos || 0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Demandas</span>
                                                            <span className="text-xs font-black text-navy-dark dark:text-white bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                                                {municipio.totalDemandas || 0}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] flex flex-col">
                        <div className="p-8 pb-4 shrink-0 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-navy-custom dark:text-white">Novo Município</h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6 space-y-6">
                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nome do Município <span className="text-rose-500">*</span></label>
                                <input
                                    ref={nomeRef}
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={e => {
                                        handleInputChange(e);
                                        if (formErrors.includes('nome')) setFormErrors(prev => prev.filter(f => f !== 'nome'));
                                    }}
                                    className={`w-full px-4 py-2 border ${formErrors.includes('nome') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 focus:ring-turquoise/50 dark:bg-slate-700 dark:text-white transition-all`}
                                    placeholder="Ex: Belo Horizonte"
                                />
                            </div>

                            {/* Região */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Região <span className="text-rose-500">*</span></label>
                                <select
                                    ref={regiaoRef}
                                    name="regiao"
                                    value={formData.regiao}
                                    onChange={e => {
                                        handleInputChange(e);
                                        if (formErrors.includes('regiao')) setFormErrors(prev => prev.filter(f => f !== 'regiao'));
                                    }}
                                    className={`w-full px-4 py-2 border ${formErrors.includes('regiao') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 focus:ring-turquoise/50 dark:bg-slate-700 dark:text-white transition-all`}
                                >
                                    <option value="">Selecione uma região</option>
                                    {regioes.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            {/* Row: População e IDH */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">População</label>
                                    <input
                                        type="number"
                                        name="populacao"
                                        value={formData.populacao}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-turquoise/50 dark:bg-slate-700 dark:text-white"
                                        placeholder="Ex: 12000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">IDH</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        max="1"
                                        name="idh"
                                        value={formData.idh}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-turquoise/50 dark:bg-slate-700 dark:text-white"
                                        placeholder="Ex: 0.805"
                                    />
                                </div>
                            </div>

                            {/* PIB per capita */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">PIB per Capita (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="pib_per_capita"
                                    value={formData.pib_per_capita}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-turquoise/50 dark:bg-slate-700 dark:text-white"
                                    placeholder="Ex: 52796.00"
                                />
                            </div>

                            {/* Assessor */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Assessor Responsável</label>
                                <select
                                    name="assessor_id"
                                    value={formData.assessor_id}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-turquoise/50 dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="">Nenhum assessor atribuído</option>
                                    {assessores.map(a => <option key={a.id} value={a.id}>{a.nome} - {a.regiaoAtuacao}</option>)}
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status de Atividade <span className="text-rose-500">*</span></label>
                                <select
                                    ref={statusRef}
                                    name="status_atividade"
                                    value={formData.status_atividade}
                                    onChange={e => {
                                        handleInputChange(e);
                                        if (formErrors.includes('status')) setFormErrors(prev => prev.filter(f => f !== 'status'));
                                    }}
                                    className={`w-full px-4 py-2 border ${formErrors.includes('status') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-300 dark:border-slate-600'} rounded-lg focus:ring-2 focus:ring-turquoise/50 dark:bg-slate-700 dark:text-white transition-all`}
                                >
                                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {/* Influência */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Influência: {formData.influencia}%
                                </label>
                                <input
                                    type="range"
                                    name="influencia"
                                    min="0"
                                    max="100"
                                    value={formData.influencia}
                                    onChange={handleInputChange}
                                    className="w-full"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm font-bold">
                                    {error}
                                </div>
                            )}

                            <div className="p-8 pt-4 shrink-0 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-3 bg-turquoise hover:bg-turquoise-light text-white rounded-lg font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="inline-block animate-spin size-4 border-2 border-white/30 border-t-white rounded-full"></span>
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[20px]">save</span>
                                            Cadastrar Município
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MunicipiosPage;
