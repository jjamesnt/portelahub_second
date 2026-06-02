
import React, { useState, useMemo, useEffect, useContext } from 'react';
import { getMunicipios, getMunicipiosSimples, getAssessores, getApoiadores } from '../services/api';
import { AppContext } from '../context/AppContext';
import { Municipio, Assessor, Apoiador } from '../types';
import Loader from '../components/Loader';
import ApoiadorModal from '../components/ApoiadorModal';
import ApoiadoresReportModal from '../components/ApoiadoresReportModal';

interface ApoiadoresPageProps {
    navigateTo: (page: string, params?: { [key: string]: any }) => void;
}

const ApoiadoresPage: React.FC<ApoiadoresPageProps> = ({ navigateTo }) => {
    const context = useContext(AppContext);
    const profile = context?.profile;

    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [assessores, setAssessores] = useState<Assessor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [apoiadoresTotal, setApoiadoresTotal] = useState<Apoiador[]>([]);

    // Filtros
    const [busca, setBusca] = useState('');
    const [filtroRegiao, setFiltroRegiao] = useState('Todos');
    const [filtroAssessor, setFiltroAssessor] = useState('Todos');
    const [filtroStatusPrefeito, setFiltroStatusPrefeito] = useState('Todos');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
        return (localStorage.getItem('portela_hub_apoiadores_view') as 'table' | 'grid') || 'table';
    });
    
    // Modal e Sincronia
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(localStorage.getItem('portela_hub_last_sync') || null);
    const [selectedApoiador, setSelectedApoiador] = useState<any | null>(null);

    const fetchData = async () => {
        let isMounted = true;
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn("Fetch data timeout reached (Apoiadores)");
                setIsLoading(false);
            }
        }, 10000);

        try {
            setIsLoading(true);
            const [munData, assData, apoData] = await Promise.all([
                getMunicipiosSimples().catch(() => []),
                getAssessores().catch(() => []),
                getApoiadores().catch(() => [])
            ]);
            
            if (isMounted) {
                setMunicipios(munData || []);
                setAssessores(assData || []);
                setApoiadoresTotal(apoData || []);
            }
        } catch (err) {
            console.error("Erro ao carregar dados de apoiadores", err);
        } finally {
            if (isMounted) {
                setIsLoading(false);
                clearTimeout(timeoutId);
            }
        }
    };



    useEffect(() => {
        localStorage.setItem('portela_hub_apoiadores_view', viewMode);
    }, [viewMode]);

    useEffect(() => {
        fetchData();
    }, []);

    // Filtro para Apoiadores (dados já vêm completos do getApoiadores com todos os campos do município)
    const apoiadoresFiltrados = useMemo(() => {
        return apoiadoresTotal.filter(a => {
            const m = a.municipio;
            if (!m) return false;

            const correspondeBusca = a.nome.toLowerCase().includes(busca.toLowerCase()) || m.nome.toLowerCase().includes(busca.toLowerCase());
            const correspondeRegiao = filtroRegiao === 'Todos' || m.regiao === filtroRegiao;
            const correspondeAssessor = filtroAssessor === 'Todos' || (a.assessor?.nome === filtroAssessor || a.assessorResp === filtroAssessor);
            const correspondeStatus = filtroStatusPrefeito === 'Todos' || a.statusPrefeito === filtroStatusPrefeito || m.statusPrefeito === filtroStatusPrefeito;

            return correspondeBusca && correspondeRegiao && correspondeAssessor && correspondeStatus;
        });
    }, [apoiadoresTotal, busca, filtroRegiao, filtroAssessor, filtroStatusPrefeito]);

    const summaryStats = useMemo(() => {
        const municipiosIds = new Set(apoiadoresFiltrados.map(a => a.municipioId));
        const parceiras = apoiadoresFiltrados.filter(a => {
            const s = a.statusPrefeito || a.municipio?.statusPrefeito;
            return s === 'Prefeitura Parceira' || s === 'Prefeitura Fechada';
        });
        const uniqueParceiras = new Set(parceiras.map(a => a.municipioId));

        return {
            totalMunicipios: municipiosIds.size,
            cidadesParceiras: uniqueParceiras.size,
            totalApoiadores: apoiadoresFiltrados.length
        };
    }, [apoiadoresFiltrados]);

    const getStatusPrefeitoColor = (status?: string) => {
        switch (status) {
            case 'Prefeitura Fechada': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            case 'Prefeitura Parceira': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'Não': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
            default: return 'bg-slate-50 text-slate-400 dark:bg-slate-800/50';
        }
    };

    const clearFilters = () => {
        setBusca('');
        setFiltroRegiao('Todos');
        setFiltroAssessor('Todos');
        setFiltroStatusPrefeito('Todos');
    };

    const DetailField = ({ icon, label, value, fullWidth, highlight }: { icon: string, label: string, value?: string | null, fullWidth?: boolean, highlight?: boolean }) => (
        <div className={`p-3 rounded-xl ${highlight ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-900/50'} ${fullWidth ? 'col-span-2' : ''}`}>
            <div className="flex items-center gap-1.5 mb-1">
                <span className={`material-symbols-outlined text-[14px] ${highlight ? 'text-indigo-400' : 'text-slate-400'}`}>{icon}</span>
                <p className={`text-[9px] font-black uppercase tracking-wider ${highlight ? 'text-indigo-400' : 'text-slate-400'}`}>{label}</p>
            </div>
            <p className={`text-sm font-bold ${value ? (highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200') : 'text-slate-400'}`}>
                {value || '—'}
            </p>
        </div>
    );

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
        <div className="p-4 md:p-8 animate-in fade-in duration-500 pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 md:mb-8">
                <div>
                    <h2 className="text-xl md:text-3xl font-black tracking-tight text-navy-dark dark:text-white">Apoiadores</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        {lastSyncTime ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.1)] group transition-all">
                                <span className="relative flex size-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                                </span>
                                <span className="text-[10px] md:text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                    Sincronizado {lastSyncTime}
                                </span>
                            </div>
                        ) : (
                            profile?.role === 'master' && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full group transition-all">
                                    <span className="size-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                                    <span className="text-[10px] md:text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                        Configuração pendente (CSV)
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Toggle Visualização Premium */}
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 h-11 md:h-12 shadow-inner">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center justify-center px-4 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <span className="material-symbols-outlined text-[22px]">grid_view</span>
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center justify-center px-4 rounded-xl transition-all duration-300 ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <span className="material-symbols-outlined text-[22px]">format_list_bulleted</span>
                        </button>
                    </div>


                    <button 
                      onClick={() => setIsReportModalOpen(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all shadow-sm group h-10"
                    >
                        <span className="material-symbols-outlined text-[18px] group-hover:animate-pulse">description</span>
                        Relatório
                    </button>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all h-10"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Novo Apoiador
                    </button>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">Municípios</p>
                    <p className="text-base md:text-xl font-black text-navy-custom dark:text-white">{summaryStats.totalMunicipios}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">Cidades Parceiras</p>
                    <p className="text-base md:text-xl font-black text-emerald-600">{summaryStats.cidadesParceiras}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 md:p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">Apoiadores</p>
                    <p className="text-base md:text-xl font-black text-rose-500">{summaryStats.totalApoiadores}</p>
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="flex flex-col gap-3 mb-6 md:mb-8 bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Buscar apoiador ou município..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 flex-[2]">
                        <FilterSelect
                            value={filtroRegiao}
                            onChange={setFiltroRegiao}
                            options={Array.from(new Set(municipios.map(m => m.regiao))).sort()}
                            placeholder="Regiões"
                        />
                        <FilterSelect
                            value={filtroAssessor}
                            onChange={setFiltroAssessor}
                            options={Array.from(new Set(assessores.map(a => a.nome))).sort()}
                            placeholder="Assessores"
                        />
                        <FilterSelect
                            value={filtroStatusPrefeito}
                            onChange={setFiltroStatusPrefeito}
                            options={['Prefeitura Parceira', 'Prefeitura Fechada', 'Não']}
                            placeholder="Status Prefeito"
                        />
                    </div>
                    {(busca || filtroRegiao !== 'Todos' || filtroAssessor !== 'Todos' || filtroStatusPrefeito !== 'Todos') && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 border border-rose-200 text-rose-500 rounded-xl hover:bg-rose-50 transition-all text-xs font-bold"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            {isLoading ? <Loader /> : apoiadoresFiltrados.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-slate-300 text-5xl">groups</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Nenhum apoiador encontrado</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">
                        Não existem apoiadores cadastrados ou os filtros aplicados não retornaram resultados.
                    </p>
                    {(busca !== '' || filtroRegiao !== 'Todos' || filtroAssessor !== 'Todos' || filtroStatusPrefeito !== 'Todos') && (
                        <button 
                            onClick={clearFilters}
                            className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
            ) : viewMode === 'table' ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Apoiador</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade / Região</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Prefeito</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Votos (A/L)</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atendimento / Demanda</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {apoiadoresFiltrados.map(a => {
                                    const m = a.municipio!;
                                    const initials = a.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                    const hasImage = a.fotoUrl && !a.fotoUrl.includes('placeholder') && !a.fotoUrl.includes('via.placeholder');
                                    
                                    return (
                                        <tr 
                                            key={a.id} 
                                            onClick={() => setSelectedApoiador(a)}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                                        {hasImage ? (
                                                            <img src={a.fotoUrl} alt={a.nome} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-[10px] text-white font-black">
                                                                {initials}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                            {a.nome}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                            {a.cargo}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-navy-dark dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {m.nome}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                        Região: {m.regiao || '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusPrefeitoColor(m.statusPrefeito)}`}>
                                                        {m.statusPrefeito || 'Não informado'}
                                                    </span>
                                                    {m.lincolnFechado && (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[12px]">beenhere</span>
                                                            Lincoln Portela
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">Alê</span>
                                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                                                            {m.votacaoAle?.toLocaleString() || '—'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">Lincoln</span>
                                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                                                            {m.votacaoLincoln?.toLocaleString() || '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                        {a.assessor?.nome || '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 max-w-[200px]">
                                                    {m.statusAtendimento && (
                                                        <span className={`w-fit px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                            m.statusAtendimento === 'Contemplado' 
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                        }`}>
                                                            {m.statusAtendimento}
                                                        </span>
                                                    )}
                                                    {m.principalDemanda && (
                                                        <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold truncate">
                                                            {m.principalDemanda}
                                                        </p>
                                                    )}
                                                    {m.sugestaoSedese && (
                                                        <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 w-fit">
                                                            SEDESE: {m.sugestaoSedese}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {apoiadoresFiltrados.map(a => {
                        const m = a.municipio!;
                        const initials = a.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        const hasImage = a.fotoUrl && !a.fotoUrl.includes('placeholder') && !a.fotoUrl.includes('via.placeholder');
                        
                        return (
                            <div 
                                key={a.id} 
                                onClick={() => setSelectedApoiador(a)}
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="size-14 rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-700">
                                        {hasImage ? (
                                            <img src={a.fotoUrl} alt={a.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-black text-navy-dark dark:text-white truncate group-hover:text-indigo-600 transition-colors">{a.nome}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{a.cargo}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{m.nome}</span>
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase ml-6">Região: {m.regiao || '—'}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getStatusPrefeitoColor(m.statusPrefeito)}`}>
                                                {m.statusPrefeito || '—'}
                                            </span>
                                            {m.lincolnFechado && (
                                                <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-500 text-white flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[10px]">beenhere</span>
                                                    Lincoln
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] font-black text-slate-400 uppercase">Alê</span>
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{m.votacaoAle?.toLocaleString() || '0'}</span>
                                        </div>
                                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[8px] font-black text-slate-400 uppercase">Lincoln</span>
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{m.votacaoLincoln?.toLocaleString() || '0'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="size-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">
                                                {a.assessor?.nome || 'Sem Responsável'}
                                            </span>
                                        </div>

                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-black text-slate-400 uppercase">Atendimento</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                    m.statusAtendimento === 'Contemplado' 
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' 
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'
                                                }`}>
                                                    {m.statusAtendimento || "Em Análise"}
                                                </span>
                                            </div>
                                            {m.principalDemanda && (
                                                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold line-clamp-2 leading-relaxed">
                                                    {m.principalDemanda}
                                                </p>
                                            )}
                                            {m.sugestaoSedese && (
                                                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                                                    <span className="text-[8px] text-indigo-500 font-black bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                                                        SEDESE: {m.sugestaoSedese}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {/* Modal de Relatório */}
            <ApoiadoresReportModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                apoiadores={apoiadoresFiltrados}
                filtrosativos={{
                    busca,
                    regiao: filtroRegiao,
                    assessor: filtroAssessor,
                    statusPrefeito: filtroStatusPrefeito
                }}
                usuarioNome={profile?.full_name}
            />

            {/* Modal de Novo Apoiador */}
            <ApoiadorModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                }}
                allMunicipios={municipios}
                allApoiadores={apoiadoresTotal}
                allAssessores={assessores}
            />

            {/* Modal de Detalhes do Apoiador */}
            {selectedApoiador && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedApoiador(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 rounded-t-3xl">
                            <button onClick={() => setSelectedApoiador(null)} className="absolute top-4 right-4 size-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-white text-[20px]">close</span>
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-black border border-white/30 shadow-lg">
                                    {selectedApoiador.nome?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">{selectedApoiador.nome}</h3>
                                    <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider">{selectedApoiador.cargo || 'Apoiador'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content - 13 colunas da planilha */}
                        <div className="p-6 space-y-4">
                            {/* Cidade & Região */}
                            <div className="grid grid-cols-2 gap-3">
                                <DetailField icon="location_on" label="Cidade" value={selectedApoiador.municipio?.nome} />
                                <DetailField icon="map" label="Região" value={selectedApoiador.municipio?.regiao} />
                            </div>

                            {/* Status Prefeito */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Status do Prefeito</p>
                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${getStatusPrefeitoColor(selectedApoiador.statusPrefeito || selectedApoiador.municipio?.statusPrefeito)}`}>
                                        {selectedApoiador.statusPrefeito || selectedApoiador.municipio?.statusPrefeito || '—'}
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Lincoln Portela Fechado?</p>
                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                        (selectedApoiador.lincolnFechado || selectedApoiador.municipio?.lincolnFechado)
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {(selectedApoiador.lincolnFechado || selectedApoiador.municipio?.lincolnFechado) ? 'SIM' : 'NÃO'}
                                    </span>
                                </div>
                            </div>

                            {/* Votação */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider mb-1">Votação Alê</p>
                                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                                        {(selectedApoiador.votacaoAle || selectedApoiador.municipio?.votacaoAle)?.toLocaleString() || '—'}
                                    </p>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider mb-1">Votação Lincoln</p>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                        {(selectedApoiador.votacaoLincoln || selectedApoiador.municipio?.votacaoLincoln)?.toLocaleString() || '—'}
                                    </p>
                                </div>
                            </div>

                            {/* IDENE & Assessor */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">IDENE?</p>
                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                        (selectedApoiador.idene || selectedApoiador.municipio?.idene)
                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {(selectedApoiador.idene || selectedApoiador.municipio?.idene) ? 'SIM' : 'NÃO'}
                                    </span>
                                </div>
                                <DetailField icon="person" label="Assessor Responsável" value={selectedApoiador.assessorResp || selectedApoiador.assessor?.nome} />
                            </div>

                            {/* Atendimento */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Status de Atendimento</p>
                                    {(selectedApoiador.statusAtendimento || selectedApoiador.municipio?.statusAtendimento) ? (
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                            (selectedApoiador.statusAtendimento || selectedApoiador.municipio?.statusAtendimento) === 'Contemplado'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                            {selectedApoiador.statusAtendimento || selectedApoiador.municipio?.statusAtendimento}
                                        </span>
                                    ) : <span className="text-sm text-slate-400">—</span>}
                                </div>
                                <DetailField icon="category" label="Tipo de Atendimento" value={selectedApoiador.tipoAtendimento || selectedApoiador.municipio?.tipoAtendimento} />
                            </div>

                            {/* Demanda & SEDESE */}
                            <DetailField icon="priority_high" label="Principal Demanda" value={selectedApoiador.principalDemanda || selectedApoiador.municipio?.principalDemanda} fullWidth />
                            <DetailField icon="apartment" label="Sugestão de Programa SEDESE" value={selectedApoiador.sugestaoSedese || selectedApoiador.municipio?.sugestaoSedese} fullWidth highlight />

                            {/* Observação */}
                            <DetailField icon="notes" label="Observação" value={selectedApoiador.observacao || selectedApoiador.municipio?.observacao} fullWidth />

                            {/* Contato */}
                            {(selectedApoiador.telefone || selectedApoiador.email) && (
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Contato</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedApoiador.telefone && <DetailField icon="phone" label="Telefone" value={selectedApoiador.telefone} />}
                                        {selectedApoiador.email && <DetailField icon="mail" label="Email" value={selectedApoiador.email} />}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <button
                                onClick={() => { setSelectedApoiador(null); navigateTo('ApoiadorPerfil', { id: selectedApoiador.id }); }}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                Ver Perfil Completo
                            </button>
                            <button
                                onClick={() => setSelectedApoiador(null)}
                                className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApoiadoresPage;
