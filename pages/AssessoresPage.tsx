import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Assessor } from '../types';
import Loader from '../components/Loader';
import ImageUpload from '../components/ImageUpload';
import { getAssessores, upsertAssessor, deleteAssessor } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import ErrorModal from '../components/ErrorModal';

interface AssessoresPageProps {
    navigateTo: (page: string, params?: { [key: string]: any }) => void;
}

const AssessoresPage: React.FC<AssessoresPageProps> = ({ navigateTo }) => {
    const [assessores, setAssessores] = useState<Assessor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssessor, setEditingAssessor] = useState<Partial<Assessor>>({});
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Assessor | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formErrors, setFormErrors] = useState<string[]>([]);
    const [errorDetails, setErrorDetails] = useState<{ title: string; message: string; tech?: string } | null>(null);

    // Refs para Foco em Erros
    const nomeRef = React.useRef<HTMLInputElement>(null);
    const cargoRef = React.useRef<HTMLSelectElement>(null);
    const regiaoRef = React.useRef<HTMLInputElement>(null);
    const emailRef = React.useRef<HTMLInputElement>(null);
    const telefoneRef = React.useRef<HTMLInputElement>(null);
    const mandatoRef = React.useRef<HTMLSelectElement>(null);
    const logradouroRef = React.useRef<HTMLInputElement>(null);
    const bairroRef = React.useRef<HTMLInputElement>(null);
    const cidadeRef = React.useRef<HTMLInputElement>(null);
    const ufRef = React.useRef<HTMLInputElement>(null);

    // Filtros
    const [busca, setBusca] = useState('');
    const [filtroRegiao, setFiltroRegiao] = useState('Todos');
    const [filtroCargo, setFiltroCargo] = useState('Todos');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        return (localStorage.getItem('portela_hub_assessores_view') as 'grid' | 'list') || 'grid';
    });

    useEffect(() => {
        localStorage.setItem('portela_hub_assessores_view', viewMode);
    }, [viewMode]);

    useEffect(() => {
        let isMounted = true;
        const timeoutId = setTimeout(() => {
            if (isMounted) {
                console.warn("Fetch data timeout reached (Assessores)");
                setIsLoading(false);
            }
        }, 10000);

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const data = await getAssessores();
                if (isMounted) {
                    setAssessores(data || []);
                }
            } catch (err) {
                console.error("Erro ao carregar assessores", err);
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
    }, []);

    const { selectedMandato } = useAppContext();

    // Extrair Regiões e Cargos Únicos
    const regioes = useMemo(() => Array.from(new Set(assessores.map(a => a.regiaoAtuacao))).sort(), [assessores]);
    const cargos = useMemo(() => Array.from(new Set(assessores.map(a => a.cargo))).sort(), [assessores]);

    const assessoresFiltrados = useMemo(() => {
        return assessores.filter(a => {
            const correspondeBusca = a.nome.toLowerCase().includes(busca.toLowerCase());
            const correspondeRegiao = filtroRegiao === 'Todos' || a.regiaoAtuacao === filtroRegiao;
            const correspondeCargo = filtroCargo === 'Todos' || a.cargo === filtroCargo;
            const correspondeMandato = selectedMandato === 'Todos' || a.origem === selectedMandato;

            return correspondeBusca && correspondeRegiao && correspondeCargo && correspondeMandato;
        });
    }, [assessores, busca, filtroRegiao, filtroCargo, selectedMandato]);

    const handleImageUpdate = (id: string, newImage: string) => {
        setAssessores(prev => prev.map(a => a.id === id ? { ...a, avatarUrl: newImage } : a));
    };

    const handleSaveAssessor = async () => {
        // Validação de Campos Obrigatórios
        const errors = [];
        if (!editingAssessor.nome?.trim()) errors.push("nome");
        if (!editingAssessor.cargo) errors.push("cargo");
        if (!editingAssessor.regiaoAtuacao?.trim()) errors.push("regiao");
        if (!editingAssessor.email?.trim()) errors.push("email");
        if (!editingAssessor.origem) errors.push("mandato");
        if (!editingAssessor.endereco?.logradouro?.trim()) errors.push("logradouro");
        if (!editingAssessor.endereco?.bairro?.trim()) errors.push("bairro");
        if (!editingAssessor.endereco?.cidade?.trim()) errors.push("cidade");
        if (!editingAssessor.endereco?.uf?.trim()) errors.push("uf");

        const fone = (editingAssessor.telefone || '').replace(/\D/g, '');
        if (fone.length !== 11) errors.push("telefone");

        setFormErrors(errors);

        if (errors.length > 0) {
            if (errors.includes("nome")) nomeRef.current?.focus();
            else if (errors.includes("cargo")) cargoRef.current?.focus();
            else if (errors.includes("regiao")) regiaoRef.current?.focus();
            else if (errors.includes("email")) emailRef.current?.focus();
            else if (errors.includes("telefone")) telefoneRef.current?.focus();
            else if (errors.includes("logradouro")) logradouroRef.current?.focus();
            else if (errors.includes("bairro")) bairroRef.current?.focus();
            else if (errors.includes("cidade")) cidadeRef.current?.focus();
            else if (errors.includes("uf")) ufRef.current?.focus();
            else if (errors.includes("mandato")) mandatoRef.current?.focus();
            return;
        }

        setIsSaving(true);
        try {
            const assessorToSave = {
                ...editingAssessor,
                cargo: editingAssessor.cargo || 'Assessor Regional',
                origem: editingAssessor.origem || 'Alê Portela',
                avatarUrl: editingAssessor.avatarUrl || 'https://via.placeholder.com/150',
                municipiosCobertos: editingAssessor.municipiosCobertos || 0,
                liderancasGerenciadas: editingAssessor.liderancasGerenciadas || 0,
                endereco: editingAssessor.endereco || {
                    logradouro: '',
                    numero: '',
                    bairro: '',
                    cidade: '',
                    uf: '',
                    cep: ''
                }
            } as Partial<Assessor>;

            const savedAssessor = await upsertAssessor(assessorToSave);
            
            if (editingAssessor.id) {
                setAssessores(prev => prev.map(a => a.id === editingAssessor.id ? savedAssessor : a));
            } else {
                setAssessores(prev => [...prev, savedAssessor]);
            }
            
            setIsModalOpen(false);
            setEditingAssessor({});
            setFormErrors([]);
        } catch (error: any) {
            console.error("Erro ao salvar assessor:", error);
            setErrorDetails({
                title: "Erro ao Salvar",
                message: "Não foi possível salvar os dados do assessor. Verifique sua conexão e tente novamente.",
                tech: error.message || String(error)
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (assessor: Assessor) => {
        setItemToDelete(assessor);
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteAssessor(itemToDelete.id);
            setAssessores(prev => prev.filter(a => a.id !== itemToDelete.id));
            setIsConfirmDeleteOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error("Erro ao deletar assessor:", error);
            // Em um cenário real, poderíamos disparar um toast de erro aqui
            setIsConfirmDeleteOpen(false);
        }
    };

    const updateEndereco = (field: string, value: string) => {
        setEditingAssessor(prev => ({
            ...prev,
            endereco: {
                ...prev.endereco || { logradouro: '', numero: '', bairro: '', cidade: '', uf: '', cep: '' },
                [field]: value
            }
        }));
    };

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        if (value.length > 5) value = `${value.slice(0, 5)}-${value.slice(5)}`;

        updateEndereco('cep', value);

        if (value.replace(/\D/g, '').length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${value.replace(/\D/g, '')}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setEditingAssessor(prev => {
                        const currentEndereco = prev.endereco || { numero: '', logradouro: '', bairro: '', cidade: '', uf: '', cep: value };
                        return {
                            ...prev,
                            endereco: {
                                ...currentEndereco,
                                logradouro: data.logradouro || currentEndereco.logradouro,
                                bairro: data.bairro || currentEndereco.bairro,
                                cidade: data.localidade || currentEndereco.cidade,
                                uf: data.uf || currentEndereco.uf,
                                cep: value
                            }
                        };
                    });
                }
            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
            }
        }
    };

    const filtersActive = busca !== '' || filtroRegiao !== 'Todos' || filtroCargo !== 'Todos';

    const clearFilters = () => {
        setBusca('');
        setFiltroRegiao('Todos');
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 md:mb-8">
                <div>
                    <h2 className="text-xl md:text-3xl font-black tracking-tight text-navy-dark dark:text-white">Equipe de Assessores</h2>
                    <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 md:mt-1">Conheça o time que impulsiona nossa gestão.</p>
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
                            setEditingAssessor({
                                cargo: 'Assessor Regional',
                                origem: 'Alê Portela',
                                endereco: { logradouro: '', numero: '', bairro: '', cidade: '', uf: '', cep: '' }
                            }); 
                            setFormErrors([]);
                            setIsModalOpen(true); 
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-turquoise text-white rounded-xl text-xs md:text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-turquoise/20 active:scale-95 h-10 md:h-12"
                    >
                        <span className="material-symbols-outlined text-lg md:text-xl">add</span>
                        <span className="whitespace-nowrap">Novo Assessor</span>
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
                            placeholder="Buscar assessor..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                        {busca && (
                            <button
                                onClick={() => setBusca('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px] md:text-[18px]">close</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-[1.5]">
                        <FilterSelect
                            value={filtroRegiao}
                            onChange={setFiltroRegiao}
                            options={regioes}
                            placeholder="Regiões"
                        />
                        <FilterSelect
                            value={filtroCargo}
                            onChange={setFiltroCargo}
                            options={cargos}
                            placeholder="Cargos"
                        />
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
            ) : assessoresFiltrados.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-slate-300 text-5xl">badge</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Nenhum assessor encontrado</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">
                        Não existem assessores cadastrados ou os filtros aplicados não retornaram resultados.
                    </p>
                    {(busca !== '' || filtroRegiao !== 'Todos' || filtroCargo !== 'Todos') && (
                        <button 
                            onClick={clearFilters}
                            className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className={viewMode === 'grid' 
                    ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6"
                    : "flex flex-col gap-3"
                }>
                    {assessoresFiltrados.map(assessor => {
                        const initials = assessor.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        
                        if (viewMode === 'list') {
                            return (
                                <div key={assessor.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-4 hover:shadow-md transition-all group">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-700">
                                        {assessor.avatarUrl && !assessor.avatarUrl.includes('placeholder') && !assessor.avatarUrl.includes('via.placeholder') ? (
                                            <img
                                                src={assessor.avatarUrl}
                                                alt={assessor.nome}
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
                                            <h3 className="text-sm md:text-base font-bold text-navy-dark dark:text-white truncate">{assessor.nome}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[8px] md:text-[10px] uppercase font-black tracking-wider ${assessor.origem === 'Lincoln Portela' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                {assessor.origem.split(' ')[0]}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500">
                                                <span className="material-symbols-outlined text-[14px]">badge</span>
                                                {assessor.cargo}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500">
                                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                {assessor.regiaoAtuacao}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500">
                                                <span className="material-symbols-outlined text-[14px]">call</span>
                                                {assessor.telefone}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditingAssessor(assessor); setIsModalOpen(true); }}
                                            className="p-2 text-slate-400 hover:text-turquoise transition-colors"
                                            title="Editar"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => { setItemToDelete(assessor); setIsConfirmDeleteOpen(true); }}
                                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                            title="Excluir"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={assessor.id} className="bg-white dark:bg-slate-800 rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-turquoise/30 transition-all duration-300 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 md:p-4 flex gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    <button 
                                        onClick={() => { setEditingAssessor(assessor); setIsModalOpen(true); }}
                                        className="size-8 md:size-10 rounded-xl bg-white dark:bg-slate-700 shadow-lg border border-slate-100 dark:border-slate-600 text-slate-400 hover:text-turquoise flex items-center justify-center transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[18px] md:text-[20px]">edit</span>
                                    </button>
                                    <button 
                                        onClick={() => { setItemToDelete(assessor); setIsConfirmDeleteOpen(true); }}
                                        className="size-8 md:size-10 rounded-xl bg-white dark:bg-slate-700 shadow-lg border border-slate-100 dark:border-slate-600 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[18px] md:text-[20px]">delete</span>
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-4 md:mb-6">
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-slate-700 shadow-xl bg-slate-100 dark:bg-slate-700 group-hover:scale-105 transition-transform duration-500">
                                        {assessor.avatarUrl && !assessor.avatarUrl.includes('placeholder') && !assessor.avatarUrl.includes('via.placeholder') ? (
                                            <img
                                                src={assessor.avatarUrl}
                                                alt={assessor.nome}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-xs md:text-base">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 w-full text-center md:text-left">
                                        <h3 className="text-xs md:text-base font-bold text-navy-dark dark:text-white truncate">{assessor.nome}</h3>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-1 mt-0.5 md:mt-1">
                                            <span className={`px-1 md:px-2 py-0.5 rounded text-[7px] md:text-[10px] uppercase font-black tracking-wider ${assessor.origem === 'Lincoln Portela' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                {assessor.origem.split(' ')[0]}
                                            </span>
                                            <p className="text-[9px] md:text-xs text-slate-400 mt-0.5 md:mt-1 truncate opacity-80">{assessor.cargo}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 md:space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3 md:pt-4">
                                    <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-xs text-slate-600 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-[13px] md:text-[16px] text-slate-400">location_on</span>
                                        <span className="truncate">{assessor.regiaoAtuacao}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-xs text-slate-600 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-[13px] md:text-[16px] text-slate-400">call</span>
                                        <span className="truncate">{assessor.telefone}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Edição Completa */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-6 my-8">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
                            <h3 className="text-xl font-bold text-navy-dark dark:text-white">{editingAssessor.id ? 'Editar Ficha do Assessor' : 'Novo Cadastro de Assessor'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Coluna 1: Dados Pessoais e Profissionais */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-turquoise uppercase tracking-wider mb-2">Dados Profissionais</h4>

                                <div className="flex justify-center mb-6">
                                    <ImageUpload
                                        currentImage={editingAssessor.avatarUrl}
                                        onImageSelected={(base64) => setEditingAssessor(prev => ({ ...prev, avatarUrl: base64 }))}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo <span className="text-rose-500">*</span></label>
                                    <input
                                        ref={nomeRef}
                                        type="text"
                                        value={editingAssessor.nome || ''}
                                        onChange={e => {
                                            setEditingAssessor({ ...editingAssessor, nome: e.target.value });
                                            if (formErrors.includes("nome")) setFormErrors(prev => prev.filter(f => f !== "nome"));
                                        }}
                                        className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("nome") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Cargo <span className="text-rose-500">*</span></label>
                                        <select
                                            ref={cargoRef}
                                            value={editingAssessor.cargo || ''}
                                            onChange={e => {
                                                setEditingAssessor({ ...editingAssessor, cargo: e.target.value as any });
                                                if (formErrors.includes("cargo")) setFormErrors(prev => prev.filter(f => f !== "cargo"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("cargo") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                        >
                                            <option value="">Selecione...</option>
                                            <option>Assessor</option>
                                            <option>Assessor Regional</option>
                                            <option>Coordenador Político</option>
                                            <option>Chefe de Gabinete</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Região <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={regiaoRef}
                                            type="text"
                                            value={editingAssessor.regiaoAtuacao || ''}
                                            onChange={e => {
                                                setEditingAssessor({ ...editingAssessor, regiaoAtuacao: e.target.value });
                                                if (formErrors.includes("regiao")) setFormErrors(prev => prev.filter(f => f !== "regiao"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("regiao") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Mandato <span className="text-rose-500">*</span></label>
                                        <select
                                            ref={mandatoRef}
                                            value={editingAssessor.origem || ''}
                                            onChange={e => {
                                                setEditingAssessor({ ...editingAssessor, origem: e.target.value as any });
                                                if (formErrors.includes("mandato")) setFormErrors(prev => prev.filter(f => f !== "mandato"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("mandato") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                        >
                                            <option value="">Selecione...</option>
                                            <option>Alê Portela</option>
                                            <option>Lincoln Portela</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Email <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={emailRef}
                                            type="email"
                                            value={editingAssessor.email || ''}
                                            onChange={e => {
                                                setEditingAssessor({ ...editingAssessor, email: e.target.value });
                                                if (formErrors.includes("email")) setFormErrors(prev => prev.filter(f => f !== "email"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("email") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Telefone <span className="text-rose-500">*</span></label>
                                    <input
                                        ref={telefoneRef}
                                        type="tel"
                                        value={editingAssessor.telefone || ''}
                                        onChange={e => {
                                            let v = e.target.value.replace(/\D/g, '');
                                            if (v.length > 11) v = v.slice(0, 11);
                                            if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                                            if (v.length > 9) v = `${v.slice(0, 10)}-${v.slice(10)}`;
                                            setEditingAssessor({ ...editingAssessor, telefone: v });
                                            if (formErrors.includes("telefone")) setFormErrors(prev => prev.filter(f => f !== "telefone"));
                                        }}
                                        className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("telefone") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                        placeholder="(99) 99999-9999"
                                    />
                                </div>
                            </div>

                            {/* Coluna 2: Endereço */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-turquoise uppercase tracking-wider mb-2">Endereço Residencial</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">CEP</label>
                                        <input
                                            type="text"
                                            value={editingAssessor.endereco?.cep || ''}
                                            onChange={handleCepChange}
                                            className="w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-turquoise/20 outline-none"
                                            placeholder="00000-000"
                                            maxLength={9}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Logradouro <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={logradouroRef}
                                            type="text"
                                            value={editingAssessor.endereco?.logradouro || ''}
                                            onChange={e => {
                                                updateEndereco('logradouro', e.target.value);
                                                if (formErrors.includes("logradouro")) setFormErrors(prev => prev.filter(f => f !== "logradouro"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("logradouro") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Número</label>
                                        <input
                                            type="text"
                                            value={editingAssessor.endereco?.numero || ''}
                                            onChange={e => updateEndereco('numero', e.target.value)}
                                            className="w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-turquoise/20 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Bairro <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={bairroRef}
                                            type="text"
                                            value={editingAssessor.endereco?.bairro || ''}
                                            onChange={e => {
                                                updateEndereco('bairro', e.target.value);
                                                if (formErrors.includes("bairro")) setFormErrors(prev => prev.filter(f => f !== "bairro"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("bairro") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Cidade <span className="text-rose-500">*</span></label>
                                        <input
                                            ref={cidadeRef}
                                            type="text"
                                            value={editingAssessor.endereco?.cidade || ''}
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
                                            value={editingAssessor.endereco?.uf || ''}
                                            onChange={e => {
                                                updateEndereco('uf', e.target.value);
                                                if (formErrors.includes("uf")) setFormErrors(prev => prev.filter(f => f !== "uf"));
                                            }}
                                            className={`w-full mt-1 p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-900/50 ${formErrors.includes("uf") ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} text-sm focus:ring-2 focus:ring-turquoise/20 outline-none transition-all`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 dark:border-slate-700 pt-6">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" disabled={isSaving}>Cancelar</button>
                            <button 
                                onClick={handleSaveAssessor} 
                                disabled={isSaving}
                                className="px-6 py-2.5 text-sm font-bold bg-turquoise text-white rounded-xl hover:brightness-110 shadow-lg shadow-turquoise/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Salvando...
                                    </>
                                ) : 'Salvar Assessor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Excluir Assessor"
                message={`Tem certeza que deseja remover ${itemToDelete?.nome} da equipe? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
            />

            <ErrorModal 
                isOpen={!!errorDetails}
                onClose={() => setErrorDetails(null)}
                title={errorDetails?.title || ''}
                message={errorDetails?.message || ''}
                technicalDetails={errorDetails?.tech}
            />
        </div>
    );
};

export default AssessoresPage;
