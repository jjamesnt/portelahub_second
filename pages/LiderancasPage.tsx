import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { getMunicipios, getMunicipiosSimples, getLiderancas, deleteLideranca, upsertLideranca } from '../services/api';
import { Lideranca, Municipio } from '../types';
import Loader from '../components/Loader';
import ImageUpload from '../components/ImageUpload';
import ErrorModal from '../components/ErrorModal';
import ConfirmModal from '../components/ConfirmModal';

interface LiderancasPageProps {
    navigateTo: (page: string, params?: { [key: string]: any }) => void;
    params?: { [key: string]: any };
}

// MOCK_LIDERANCAS removido em favor de dados reais do Supabase via services/api.ts

const LiderancasPage: React.FC<LiderancasPageProps> = ({ navigateTo, params }) => {
    const [liderancas, setLiderancas] = useState<Lideranca[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [showMunSuggestions, setShowMunSuggestions] = useState(false);

    const nomeRef = React.useRef<HTMLInputElement>(null);
    const municipioRef = React.useRef<HTMLInputElement>(null);
    const regiaoRef = React.useRef<HTMLInputElement>(null);
    const cargoRef = React.useRef<HTMLSelectElement>(null);
    const contatoRef = React.useRef<HTMLInputElement>(null);
    const emailRef = React.useRef<HTMLInputElement>(null);
    const mandatoRef = React.useRef<HTMLSelectElement>(null);
    const logradouroRef = React.useRef<HTMLInputElement>(null);
    const bairroRef = React.useRef<HTMLInputElement>(null);
    const cidadeRef = React.useRef<HTMLInputElement>(null);
    const ufRef = React.useRef<HTMLInputElement>(null);
    const munSearchRef = React.useRef<HTMLDivElement>(null);

    // Filtros
    const [busca, setBusca] = useState('');
    const [filtroRegiao, setFiltroRegiao] = useState('Todos');
    const [filtroMunicipio, setFiltroMunicipio] = useState('Todos');
    const [filtroPartido, setFiltroPartido] = useState('Todos');
    const [filtroCargo, setFiltroCargo] = useState('Todos');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        return (localStorage.getItem('portela_hub_liderancas_view') as 'grid' | 'list') || 'grid';
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLideranca, setEditingLideranca] = useState<Partial<Lideranca>>({});
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Lideranca | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorDetails, setErrorDetails] = useState<{ title: string; message: string; tech?: string } | null>(null);

    useEffect(() => {
        localStorage.setItem('portela_hub_liderancas_view', viewMode);
    }, [viewMode]);

    useEffect(() => {
        let isMounted = true;
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn("Fetch data timeout reached");
                setIsLoading(false);
            }
        }, 10000); // 10 seconds safety timeout

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [municipiosData, liderancasData] = await Promise.all([
                    getMunicipiosSimples().catch(err => {
                        console.error("Erro ao buscar municípios:", err);
                        return [];
                    }),
                    getLiderancas().catch(err => {
                        console.error("Erro ao buscar lideranças:", err);
                        return [];
                    })
                ]);

                if (isMounted) {
                    setMunicipios(municipiosData || []);
                    setLiderancas(liderancasData || []);

                    // Verificar se deve abrir o modal de nova liderança
                    if (params?.action === 'new') {
                        setEditingLideranca({});
                        setIsModalOpen(true);
                    }
                }
            } catch (err) {
                console.error("Erro crítico ao carregar dados:", err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    clearTimeout(timeoutId);
                }
            }
        };
        fetchData();
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [params]);
    
    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (munSearchRef.current && !munSearchRef.current.contains(event.target as Node)) {
                setShowMunSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const normalize = (text: string) =>
        text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const filteredMunicipiosSuggestions = useMemo(() => {
        const term = normalize(editingLideranca.municipio || '');
        if (!term) return [];
        return municipios
            .filter(m => normalize(m.nome).includes(term) || normalize(m.regiao).includes(term))
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .slice(0, 10);
    }, [editingLideranca.municipio, municipios]);

    const { selectedMandato } = useAppContext();

    // Extrair Regiões Únicas
    const regioes = useMemo(() => {
        return Array.from(new Set(liderancas.map(l => l.regiao))).sort();
    }, [liderancas]);

    const liderancasFiltradas = useMemo(() => {
        return liderancas.filter(l => {
            const nome = l.nome || '';
            const municipio = l.municipio || '';
            const regiao = l.regiao || '';
            const partido = l.partido || '';
            const cargo = l.cargo || '';

            const correspondeBusca = nome.toLowerCase().includes(busca.toLowerCase()) ||
                municipio.toLowerCase().includes(busca.toLowerCase());
            const correspondeRegiao = filtroRegiao === 'Todos' || regiao === filtroRegiao;
            const correspondeMunicipio = filtroMunicipio === 'Todos' || municipio === filtroMunicipio;
            const correspondeMandato = selectedMandato === 'Todos' || l.origem === selectedMandato;
            const correspondePartido = filtroPartido === 'Todos' || partido === filtroPartido;
            const correspondeCargo = filtroCargo === 'Todos' || cargo === filtroCargo;

            return correspondeBusca && correspondeRegiao && correspondeMunicipio && correspondeMandato && correspondePartido && correspondeCargo;
        });
    }, [busca, filtroRegiao, filtroMunicipio, filtroPartido, filtroCargo, liderancas, selectedMandato]);

    const statusStyle = (status: Lideranca['status']) => {
        switch (status) {
            case 'Ativo': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'Inativo': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const handleImageUpdate = (id: string, newImage: string) => {
        setLiderancas(prev => prev.map(l => l.id === id ? { ...l, avatarUrl: newImage } : l));
    };

    const handleSaveLideranca = async () => {
        // Validação de Campos Obrigatórios
        const errors = [];
        if (!editingLideranca.nome?.trim()) errors.push("nome");
        if (!editingLideranca.municipio?.trim()) errors.push("municipio");
        if (!editingLideranca.regiao?.trim()) errors.push("regiao");
        if (!editingLideranca.cargo) errors.push("cargo");
        if (!editingLideranca.email?.trim()) errors.push("email");
        if (!editingLideranca.origem) errors.push("mandato");
        if (!editingLideranca.endereco?.logradouro?.trim()) errors.push("logradouro");
        if (!editingLideranca.endereco?.bairro?.trim()) errors.push("bairro");
        if (!editingLideranca.endereco?.cidade?.trim()) errors.push("cidade");
        if (!editingLideranca.endereco?.uf?.trim()) errors.push("uf");
        
        const fone = (editingLideranca.contato || '').replace(/\D/g, '');
        if (fone.length !== 11) errors.push("contato");

        setFormErrors(errors);

        if (errors.length > 0) {
            if (errors.includes("nome")) nomeRef.current?.focus();
            else if (errors.includes("municipio")) municipioRef.current?.focus();
            else if (errors.includes("regiao")) regiaoRef.current?.focus();
            else if (errors.includes("cargo")) cargoRef.current?.focus();
            else if (errors.includes("contato")) contatoRef.current?.focus();
            else if (errors.includes("email")) emailRef.current?.focus();
            else if (errors.includes("logradouro")) logradouroRef.current?.focus();
            else if (errors.includes("bairro")) bairroRef.current?.focus();
            else if (errors.includes("cidade")) cidadeRef.current?.focus();
            else if (errors.includes("uf")) ufRef.current?.focus();
            else if (errors.includes("mandato")) mandatoRef.current?.focus();
            return;
        }


        setIsSaving(true);
        try {
            const liderancaToSave = {
                ...editingLideranca,
                status: editingLideranca.status || 'Ativo',
                avatarUrl: editingLideranca.avatarUrl || 'https://via.placeholder.com/150',
                endereco: editingLideranca.endereco || {
                    logradouro: '',
                    numero: '',
                    bairro: '',
                    cidade: '',
                    uf: '',
                    cep: ''
                }
            } as Partial<Lideranca>;

            const savedLideranca = await upsertLideranca(liderancaToSave);

            if (editingLideranca.id) {
                setLiderancas(prev => prev.map(l => l.id === editingLideranca.id ? savedLideranca : l));
            } else {
                setLiderancas(prev => [...prev, savedLideranca]);
            }

            setIsModalOpen(false);
            setEditingLideranca({});
            setFormErrors([]);
        } catch (error: any) {
            console.error("Erro ao salvar liderança:", error);
            setErrorDetails({
                title: "Erro ao Salvar",
                message: "Não foi possível salvar a liderança. Verifique sua conexão e tente novamente.",
                tech: error.message || String(error)
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (lideranca: Lideranca) => {
        setItemToDelete(lideranca);
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteLideranca(itemToDelete.id);
            setLiderancas(prev => prev.filter(l => l.id !== itemToDelete.id));
            setIsConfirmDeleteOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error("Erro ao deletar liderança:", error);
            setIsConfirmDeleteOpen(false);
        }
    };

    const updateEndereco = (field: string, value: string) => {
        setEditingLideranca(prev => ({
            ...prev,
            endereco: {
                ...prev.endereco || { logradouro: '', numero: '', bairro: '', cidade: '', uf: '', cep: '' },
                [field]: value
            }
        }));
    };

    const filtersActive = busca !== '' || filtroRegiao !== 'Todos' || filtroMunicipio !== 'Todos' || filtroPartido !== 'Todos' || filtroCargo !== 'Todos';

    const clearFilters = () => {
        setBusca('');
        setFiltroRegiao('Todos');
        setFiltroMunicipio('Todos');
        setFiltroPartido('Todos');
        setFiltroCargo('Todos');
    };

    // Componente Reutilizável para Select com Botão de Limpar (Logic on Hover)
    const FilterSelect = ({ value, onChange, options, placeholder }: { value: string, onChange: (val: string) => void, options: string[], placeholder: string }) => (
        <div className="relative group">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                className={`w-full pl-3 pr-8 py-2.5 border rounded-xl text-sm outline-none font-medium transition-all cursor-pointer appearance-none bg-none ${value !== 'Todos' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}
            >
                <option value="Todos" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{placeholder}</option>
                {options.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{opt}</option>)}
            </select>

            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                {/* Seta (Sempre visível se for 'Todos', ou se não estiver com hover no 'Active') */}
                <span className={`material-symbols-outlined text-[20px] transition-all duration-200 ${value !== 'Todos' ? 'text-white opacity-100 group-hover:opacity-0 group-hover:scale-75' : 'text-slate-400'}`}>expand_more</span>
            </div>

            {/* Botão Limpar (Só aparece se val != Todos E Hover) */}
            {value !== 'Todos' && (
                <button
                    onClick={(e) => { e.stopPropagation(); onChange('Todos'); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            )}
        </div>
    );

    return (
        <div className="p-4 md:p-8 animate-in fade-in duration-500 pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 md:mb-8">
                <div>
                    <h2 className="text-xl md:text-3xl font-black tracking-tight text-navy-dark dark:text-white">Gestão de Lideranças</h2>
                    <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">Acompanhe e gerencie sua base de apoio.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Toggle Visualização Premium */}
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 h-11 md:h-12 shadow-inner">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center justify-center px-4 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <span className="material-symbols-outlined text-[22px]">grid_view</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center justify-center px-4 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <span className="material-symbols-outlined text-[22px]">format_list_bulleted</span>
                        </button>
                    </div>

                    <button
                        onClick={() => { 
                            setEditingLideranca({ 
                                cargo: 'Vereador', 
                                status: 'Ativo', 
                                origem: 'Alê Portela',
                                endereco: { logradouro: '', numero: '', bairro: '', cidade: '', uf: '', cep: '' }
                            }); 
                            setFormErrors([]);
                            setIsModalOpen(true); 
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-turquoise text-white rounded-xl text-xs md:text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-turquoise/20 active:scale-95 h-10 md:h-12"
                    >
                        <span className="material-symbols-outlined text-lg md:text-xl">add</span>
                        <span className="whitespace-nowrap">Nova Liderança</span>
                    </button>
                </div>
            </div>

            {/* Barra de Filtros Redesenhada (Alto Contraste) */}
            <div className={`flex flex-col gap-2 md:gap-3 mb-6 md:mb-8 bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all ${filtersActive ? 'ring-2 ring-indigo-50 dark:ring-indigo-900/20' : ''}`}>
                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                    <div className="flex-1 relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors material-symbols-outlined text-[18px] md:text-base">search</span>
                        <input
                            type="text"
                            placeholder="Buscar liderança..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                        {/* Limpar Busca on Hover */}
                        {busca && (
                            <button
                                onClick={() => setBusca('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px] md:text-[18px]">close</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 flex-[2]">
                        <FilterSelect
                            value={filtroRegiao}
                            onChange={setFiltroRegiao}
                            options={regioes}
                            placeholder="Regiões"
                        />
                        <FilterSelect
                            value={filtroMunicipio}
                            onChange={setFiltroMunicipio}
                            options={municipios.map(m => m.nome)}
                            placeholder="Municípios"
                        />
                        <FilterSelect
                            value={filtroPartido}
                            onChange={setFiltroPartido}
                            options={Array.from(new Set(liderancas.map(l => l.partido)))}
                            placeholder="Partidos"
                        />
                        <div className="col-span-1">
                            <FilterSelect
                                value={filtroCargo}
                                onChange={setFiltroCargo}
                                options={['Prefeito', 'Vice-Prefeito', 'Vereador', 'Liderança', 'Ex-Prefeito']}
                                placeholder="Cargos"
                            />
                        </div>
                        {filtersActive && (
                            <button
                                onClick={clearFilters}
                                className="md:hidden flex items-center justify-center p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100"
                            >
                                <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
                            </button>
                        )}
                    </div>
                </div>

                {filtersActive && (
                    <div className="hidden md:flex justify-end mt-1 animate-in fade-in slide-in-from-top-1">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[11px] font-bold hover:bg-rose-100 transition-colors flex items-center gap-1 border border-rose-100"
                        >
                            <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                            Limpar Tudo
                        </button>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader />
                </div>
            ) : liderancasFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 md:p-24 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-500">
                    <div className="size-20 md:size-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl md:text-5xl text-slate-300">group_off</span>
                    </div>
                    <h3 className="text-xl font-bold text-navy-dark dark:text-white mb-2">Nenhuma liderança encontrada</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center max-w-md text-sm md:text-base">
                        {busca || filtroRegiao !== 'Todas' || filtroMunicipio !== 'Todas' || filtroPartido !== 'Todas' || filtroCargo !== 'Todos'
                            ? "Não encontramos resultados para os filtros aplicados. Tente ajustar sua busca."
                            : "Ainda não há lideranças cadastradas no sistema. Comece adicionando uma nova liderança no botão acima."}
                    </p>
                    {(busca || filtroRegiao !== 'Todas' || filtroMunicipio !== 'Todas' || filtroPartido !== 'Todas' || filtroCargo !== 'Todos') && (
                        <button 
                            onClick={clearFilters}
                            className="mt-6 text-turquoise font-bold hover:underline flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                            Limpar Filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6"
                    : "flex flex-col gap-3"
                }>
                    {liderancasFiltradas.map(lideranca => {
                        const initials = lideranca.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        const hasImage = lideranca.avatarUrl && !lideranca.avatarUrl.includes('placeholder') && !lideranca.avatarUrl.includes('via.placeholder');

                        if (viewMode === 'list') {
                            return (
                                <div key={lideranca.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-4 hover:shadow-md transition-all group">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-700">
                                        {hasImage ? (
                                            <img
                                                src={lideranca.avatarUrl}
                                                alt={lideranca.nome}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm md:text-base font-bold text-navy-dark dark:text-white truncate">{lideranca.nome}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[8px] md:text-[10px] uppercase font-black tracking-wider ${lideranca.origem === 'Lincoln Portela' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                {lideranca.origem.split(' ')[0]}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[8px] md:text-[10px] uppercase font-black tracking-wider ${statusStyle(lideranca.status)}`}>
                                                {lideranca.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500">
                                                <span className="material-symbols-outlined text-[14px]">badge</span>
                                                {lideranca.cargo} • {lideranca.partido}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500">
                                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                {lideranca.municipio}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500">
                                                <span className="material-symbols-outlined text-[14px]">call</span>
                                                {lideranca.contato}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditingLideranca(lideranca); setIsModalOpen(true); }}
                                            className="p-2 text-slate-400 hover:text-turquoise transition-colors"
                                            title="Editar"
                                        >
                                            <span className="material-symbols-outlined text-xl">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(lideranca)}
                                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                            title="Excluir"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={lideranca.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 md:p-5 hover:shadow-md transition-all group relative overflow-hidden">
                                <button
                                    onClick={() => { setEditingLideranca(lideranca); setIsModalOpen(true); }}
                                    className="absolute top-3 right-10 md:top-4 md:right-12 text-slate-300 hover:text-turquoise transition-colors z-10"
                                >
                                    <span className="material-symbols-outlined text-sm md:text-xl">edit</span>
                                </button>

                                <button
                                    onClick={() => handleDeleteClick(lideranca)}
                                    className="absolute top-3 right-3 md:top-4 md:right-4 text-slate-300 hover:text-rose-500 transition-colors z-10"
                                >
                                    <span className="material-symbols-outlined text-sm md:text-xl">delete</span>
                                </button>

                                <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4 mb-3 md:mb-4 text-center md:text-left">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm md:shadow-md shrink-0 bg-slate-100 dark:bg-slate-700">
                                        {hasImage ? (
                                            <img
                                                src={lideranca.avatarUrl}
                                                alt={lideranca.nome}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-xs md:text-base">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 w-full">
                                        <h3 className="text-xs md:text-base font-bold text-navy-dark dark:text-white truncate">{lideranca.nome}</h3>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-1 mt-0.5 md:mt-1">
                                            <span className={`px-1 md:px-2 py-0.5 rounded text-[7px] md:text-[10px] uppercase font-black tracking-wider ${lideranca.origem === 'Lincoln Portela' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                {lideranca.origem.split(' ')[0]}
                                            </span>
                                            <span className={`px-1 md:px-2 py-0.5 rounded text-[7px] md:text-[10px] uppercase font-black tracking-wider ${statusStyle(lideranca.status)}`}>
                                                {lideranca.status}
                                            </span>
                                        </div>
                                        <p className="text-[9px] md:text-xs text-slate-400 mt-0.5 md:mt-1 truncate opacity-80">{lideranca.cargo} • {lideranca.partido}</p>
                                    </div>
                                </div>

                                <div className="space-y-1 md:space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3 md:pt-4">
                                    <div className="flex items-center gap-2 text-[9px] md:text-xs text-slate-600 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-[13px] md:text-[16px] text-slate-400">location_on</span>
                                        <span className="truncate">{lideranca.municipio}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] md:text-xs text-slate-600 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-[13px] md:text-[16px] text-slate-400">call</span>
                                        <span className="truncate">{lideranca.contato}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Edição Completa */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-6 my-8">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
                            <h3 className="text-xl font-bold text-navy-dark dark:text-white">{editingLideranca.id ? 'Editar Liderança' : 'Nova Liderança'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Coluna 1: Dados Principais */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-turquoise uppercase tracking-wider mb-2">Dados da Liderança</h4>

                                <div className="flex justify-center mb-4">
                                    <ImageUpload
                                        currentImage={editingLideranca.avatarUrl}
                                        onImageSelected={(base64) => setEditingLideranca({ ...editingLideranca, avatarUrl: base64 })}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo <span className="text-rose-500">*</span></label>
                                    <input
                                        ref={nomeRef}
                                        type="text"
                                        value={editingLideranca.nome || ''}
                                        onChange={e => {
                                            setEditingLideranca({ ...editingLideranca, nome: e.target.value });
                                            if (formErrors.includes("nome")) setFormErrors(prev => prev.filter(f => f !== "nome"));
                                        }}
                                        className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("nome") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative" ref={munSearchRef}>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Município <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={municipioRef}
                                            type="text"
                                            value={editingLideranca.municipio || ''}
                                            onChange={e => {
                                                setEditingLideranca({ ...editingLideranca, municipio: e.target.value });
                                                setShowMunSuggestions(true);
                                                if (formErrors.includes("municipio")) setFormErrors(prev => prev.filter(f => f !== "municipio"));
                                            }}
                                            onFocus={() => setShowMunSuggestions(true)}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("municipio") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                            placeholder="Buscar cidade..."
                                        />
                                        {showMunSuggestions && filteredMunicipiosSuggestions.length > 0 && (
                                            <div className="absolute z-[100] left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-150">
                                                <div className="max-h-60 overflow-y-auto">
                                                    {filteredMunicipiosSuggestions.map(m => (
                                                        <button
                                                            key={m.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingLideranca({ 
                                                                    ...editingLideranca, 
                                                                    municipio: m.nome,
                                                                    regiao: m.regiao 
                                                                });
                                                                setShowMunSuggestions(false);
                                                                if (formErrors.includes("municipio")) setFormErrors(prev => prev.filter(f => f !== "municipio"));
                                                                if (formErrors.includes("regiao")) setFormErrors(prev => prev.filter(f => f !== "regiao"));
                                                            }}
                                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 flex flex-col border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                                                        >
                                                            <span className="text-sm font-bold text-navy-dark dark:text-white">{m.nome}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{m.regiao}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Região <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={regiaoRef}
                                            type="text"
                                            value={editingLideranca.regiao || ''}
                                            onChange={e => {
                                                setEditingLideranca({ ...editingLideranca, regiao: e.target.value });
                                                if (formErrors.includes("regiao")) setFormErrors(prev => prev.filter(f => f !== "regiao"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("regiao") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none`}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Cargo <span className="text-rose-500">*</span></label>
                                        <select
                                            ref={cargoRef}
                                            value={editingLideranca.cargo || 'Vereador'}
                                            onChange={e => {
                                                setEditingLideranca({ ...editingLideranca, cargo: e.target.value as any });
                                                if (formErrors.includes("cargo")) setFormErrors(prev => prev.filter(f => f !== "cargo"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("cargo") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none`}
                                        >
                                            <option>Vereador</option>
                                            <option>Prefeito</option>
                                            <option>Vice-Prefeito</option>
                                            <option>Liderança Comunitária</option>
                                            <option>Ex-Prefeito</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Partido</label>
                                        <input
                                            type="text"
                                            value={editingLideranca.partido || ''}
                                            onChange={e => setEditingLideranca({ ...editingLideranca, partido: e.target.value })}
                                            className="w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-turquoise/20 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Coluna 2: Contato e Endereço */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-turquoise uppercase tracking-wider mb-2">Contato e Endereço</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Telefone <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={contatoRef}
                                            type="text"
                                            value={editingLideranca.contato || ''}
                                            onChange={e => {
                                                let v = e.target.value.replace(/\D/g, '');
                                                if (v.length > 11) v = v.slice(0, 11);
                                                if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                                                if (v.length > 9) v = `${v.slice(0, 10)}-${v.slice(10)}`;
                                                setEditingLideranca({ ...editingLideranca, contato: v });
                                                if (formErrors.includes("contato")) setFormErrors(prev => prev.filter(f => f !== "contato"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("contato") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none`}
                                            placeholder="(99) 99999-9999"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Email <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={emailRef}
                                            type="email"
                                            value={editingLideranca.email || ''}
                                            onChange={e => {
                                                setEditingLideranca({ ...editingLideranca, email: e.target.value });
                                                if (formErrors.includes("email")) setFormErrors(prev => prev.filter(f => f !== "email"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("email") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none`}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Logradouro <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={logradouroRef}
                                            type="text"
                                            value={editingLideranca.endereco?.logradouro || ''}
                                            onChange={e => {
                                                updateEndereco('logradouro', e.target.value);
                                                if (formErrors.includes("logradouro")) setFormErrors(prev => prev.filter(f => f !== "logradouro"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("logradouro") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Número</label>
                                        <input
                                            type="text"
                                            value={editingLideranca.endereco?.numero || ''}
                                            onChange={e => updateEndereco('numero', e.target.value)}
                                            className="w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-turquoise/20 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Bairro <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={bairroRef}
                                            type="text"
                                            value={editingLideranca.endereco?.bairro || ''}
                                            onChange={e => {
                                                updateEndereco('bairro', e.target.value);
                                                if (formErrors.includes("bairro")) setFormErrors(prev => prev.filter(f => f !== "bairro"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("bairro") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">CEP</label>
                                        <input
                                            type="text"
                                            value={editingLideranca.endereco?.cep || ''}
                                            onChange={e => updateEndereco('cep', e.target.value)}
                                            className="w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-turquoise/20 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Cidade <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={cidadeRef}
                                            type="text"
                                            value={editingLideranca.endereco?.cidade || ''}
                                            onChange={e => {
                                                updateEndereco('cidade', e.target.value);
                                                if (formErrors.includes("cidade")) setFormErrors(prev => prev.filter(f => f !== "cidade"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("cidade") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">UF <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={ufRef}
                                            type="text"
                                            value={editingLideranca.endereco?.uf || ''}
                                            onChange={e => {
                                                updateEndereco('uf', e.target.value);
                                                if (formErrors.includes("uf")) setFormErrors(prev => prev.filter(f => f !== "uf"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("uf") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Mandato <span className="text-rose-500">*</span></label>
                                        <select
                                            ref={mandatoRef}
                                            value={editingLideranca.origem || ''}
                                            onChange={e => {
                                                setEditingLideranca({ ...editingLideranca, origem: e.target.value as any });
                                                if (formErrors.includes("mandato")) setFormErrors(prev => prev.filter(f => f !== "mandato"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("mandato") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none`}
                                        >
                                            <option value="">Selecione...</option>
                                            <option>Alê Portela</option>
                                            <option>Lincoln Portela</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                        <select
                                            value={editingLideranca.status || 'Ativo'}
                                            onChange={e => setEditingLideranca({ ...editingLideranca, status: e.target.value as any })}
                                            className="w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-turquoise/20 outline-none"
                                        >
                                            <option>Ativo</option>
                                            <option>Inativo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 dark:border-slate-700 pt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" disabled={isSaving}>Cancelar</button>
                            <button 
                                onClick={handleSaveLideranca} 
                                disabled={isSaving}
                                className="px-6 py-2.5 text-sm font-bold bg-turquoise text-white rounded-xl hover:brightness-110 shadow-lg shadow-turquoise/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Salvando...
                                    </>
                                ) : (editingLideranca.id ? 'Salvar Alterações' : 'Cadastrar Liderança')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ErrorModal 
                isOpen={!!errorDetails}
                onClose={() => setErrorDetails(null)}
                title={errorDetails?.title || ''}
                message={errorDetails?.message || ''}
                technicalDetails={errorDetails?.tech}
            />

            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Excluir Liderança"
                message={`Tem certeza que deseja remover a liderança ${itemToDelete?.nome}? Esta ação removerá o registro permanentemente.`}
                confirmText="Excluir"
            />
        </div>
    );
};

export default LiderancasPage;
