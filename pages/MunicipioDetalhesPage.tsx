import React, { useState, useEffect, useContext } from 'react';
import { getMunicipioById, getMunicipios } from '../services/api';
import { MunicipioDetalhado } from '../types';
import { AppContext } from '../context/AppContext';
import InfoGeraisCard from '../components/InfoGeraisCard';
import DemandasCard from '../components/DemandasCard';
import KpiResumoCard from '../components/KpiResumoCard';
import LiderancasLocaisCard from '../components/LiderancasLocaisCard';
import Loader from '../components/Loader';
import RecursosCard from '../components/RecursosCard';
import DemandaModal from '../components/DemandaModal';
import VotacaoKPIs from '../components/VotacaoKPIs';
import PoliticaGestaoCard from '../components/PoliticaGestaoCard';
import AtendimentoDemandasCard from '../components/AtendimentoDemandasCard';
import ApoiadoresCard from '../components/ApoiadoresCard';
import ApoiadorModal from '../components/ApoiadorModal';
import EleitoradoCard from '../components/EleitoradoCard';
import { getApoiadoresByMunicipio, getAssessores, deleteApoiador } from '../services/api';
import { Apoiador, Assessor } from '../types';


interface MunicipioDetalhesPageProps {
    municipioId: string;
    navigateTo: (page: string, params?: { [key: string]: any }) => void;
}


const MunicipioDetalhesPage: React.FC<MunicipioDetalhesPageProps> = ({ municipioId, navigateTo }) => {
    const { selectedMandato } = useContext(AppContext) || { selectedMandato: 'Todos' };
    const [municipio, setMunicipio] = useState<MunicipioDetalhado | null>(null);
    const [allMunicipios, setAllMunicipios] = useState<{ id: string, nome: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDemandaModalOpen, setIsDemandaModalOpen] = useState(false);
    const [isApoiadorModalOpen, setIsApoiadorModalOpen] = useState(false);
    const [editingApoiador, setEditingApoiador] = useState<Apoiador | null>(null);
    const [apoiadores, setApoiadores] = useState<Apoiador[]>([]);
    const [assessores, setAssessores] = useState<Assessor[]>([]);
    const [votos, setVotos] = useState<{ l: number; a: number } | null>(null);
    const [activeTab, setActiveTab] = useState<'perfil' | 'apoio' | 'operacional'>('perfil');

    const fetchMunicipio = async () => {
        try {
            setIsLoading(true);
            const data = await getMunicipioById(municipioId);
            if (data) {
                setMunicipio(data);
                setError(null);
            } else {
                setError(`Município com ID '${municipioId}' não encontrado.`);
            }
        } catch (err) {
            setError('Falha ao carregar os dados do município.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRelatedData = async () => {
        try {
            const [apoiadoresData, assessoresData] = await Promise.all([
                getApoiadoresByMunicipio(municipioId),
                getAssessores()
            ]);
            setApoiadores(apoiadoresData);
            setAssessores(assessoresData);
        } catch (err) {
            console.error('Erro ao buscar dados relacionados:', err);
        }
    };

    const fetchAllMunicipios = async () => {
        try {
            const data = await getMunicipios();
            setAllMunicipios(data.map(m => ({ id: m.id, nome: m.nome })).sort((a, b) => a.nome.localeCompare(b.nome)));
        } catch (err) {
            console.error('Erro ao buscar lista de municípios:', err);
        }
    };

    useEffect(() => {
        fetchMunicipio();
        fetchAllMunicipios();
        fetchRelatedData();
        fetch('/data/votos_resumo.json')
            .then(r => r.json())
            .then(data => { if (data[municipioId]) setVotos(null); })
            .catch(() => { });
    }, [municipioId]);

    const handleDeleteApoiador = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este apoiador?')) {
            try {
                await deleteApoiador(id);
                fetchRelatedData();
            } catch (err) {
                console.error("Erro ao excluir apoiador", err);
            }
        }
    };


    if (isLoading) {
        return <div className="p-8"><Loader /></div>;
    }

    if (error || !municipio) {
        return <div className="p-8 text-center text-red-500">{error || 'Município não encontrado.'}</div>;
    }

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 animate-in fade-in duration-500 pb-24 md:pb-8">
            <nav className="flex flex-wrap items-center gap-2 mb-6 text-xs md:sm font-medium">
                <button onClick={() => navigateTo('Dashboard')} className="text-primary hover:text-primary/80">Dashboard</button>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <button onClick={() => navigateTo('Municípios')} className="text-primary hover:text-primary/80">Minas Gerais</button>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-navy-custom dark:text-slate-300 font-bold">{municipio.nome}</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-3 mb-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-navy-custom dark:text-white text-3xl md:text-5xl font-black tracking-tight truncate leading-tight">{municipio.nome}</h2>
                            <div className="relative group shrink-0">
                                <select
                                    onChange={(e) => navigateTo('MunicipioDetalhes', { id: e.target.value })}
                                    value={municipioId}
                                    className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full px-3 pr-8 py-1.5 text-[10px] md:text-xs font-black uppercase text-slate-500 dark:text-slate-400 cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                >
                                    <option value="" disabled>Trocar</option>
                                    {allMunicipios.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">keyboard_arrow_down</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <div className="flex h-6 md:h-7 items-center justify-center gap-x-2 rounded-lg bg-primary/10 px-3 border border-primary/25">
                                <span className="text-primary text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em]">{municipio.regiao}</span>
                            </div>
                            <div className="flex h-6 md:h-7 items-center justify-center gap-x-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 border border-slate-200 dark:border-slate-700">
                                <span className="text-slate-500 dark:text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em]">IBGE: {municipio.codigoIBGE}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-navy-custom dark:text-white text-[11px] md:text-sm font-black uppercase px-4 py-3 md:px-6 md:py-3.5 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group">
                        <span className="material-symbols-outlined text-[20px] text-primary group-hover:scale-110 transition-transform">file_download</span>
                        <span>Relatório</span>
                    </button>
                    <button
                        onClick={() => { setEditingApoiador(null); setIsApoiadorModalOpen(true); }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2.5 bg-rose-500 text-white text-[11px] md:text-sm font-black uppercase px-5 py-3 md:px-8 md:py-3.5 rounded-xl shadow-xl shadow-rose-500/30 hover:brightness-110 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
                        <span>Novo Apoiador</span>
                    </button>
                    <button
                        onClick={() => setIsDemandaModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2.5 bg-primary text-white text-[11px] md:text-sm font-black uppercase px-5 py-3 md:px-8 md:py-3.5 rounded-xl shadow-xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                        <span>Nova Demanda</span>
                    </button>
                </div>
            </div>

            {/* Resumo/Hero de Perfil do Município */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Votação Alê 2022</span>
                    <span className="text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                        {municipio.votacaoAle?.toLocaleString('pt-BR') || '—'}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Votação Lincoln 2022</span>
                    <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                        {municipio.votacaoLincoln?.toLocaleString('pt-BR') || '—'}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total de Recursos</span>
                    <span className="text-xl md:text-2xl font-black text-slate-700 dark:text-slate-100 mt-2">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(municipio.totalRecursos || 0)}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Apoiadores Ativos</span>
                    <span className="text-xl md:text-2xl font-black text-rose-500 mt-2">
                        {apoiadores.length} {apoiadores.length === 1 ? 'Apoiador' : 'Apoiadores'}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lideranças Ativas</span>
                    <span className="text-xl md:text-2xl font-black text-amber-500 mt-2">
                        {municipio.liderancas?.length || 0} {municipio.liderancas?.length === 1 ? 'Liderança' : 'Lideranças'}
                    </span>
                </div>
            </div>

            {/* Visual Switcher / Tabs de Integração */}
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 h-13 md:h-14 shadow-inner mb-8 w-full md:max-w-2xl mx-auto">
                <button
                    onClick={() => setActiveTab('perfil')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'perfil' 
                        ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.15)]' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px]">strategy</span>
                    <span>Perfil Político</span>
                </button>
                <button
                    onClick={() => setActiveTab('apoio')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'apoio' 
                        ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.15)]' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
                    <span>Apoio Local</span>
                </button>
                <button
                    onClick={() => setActiveTab('operacional')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all duration-300 ${
                        activeTab === 'operacional' 
                        ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.15)]' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                    <span>Financeiro & Demandas</span>
                </button>
            </div>

            {/* Renderização Condicional com Efeito de Fade */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'perfil' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <PoliticaGestaoCard 
                                municipio={municipio} 
                                assessor={assessores.find(a => a.id === municipio.assessorId)} 
                            />
                            <EleitoradoCard codigoIBGE={municipio.codigoIBGE} />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AtendimentoDemandasCard municipio={municipio} />
                            <div className="space-y-6">
                                <VotacaoKPIs
                                    municipioId={municipio.id}
                                    codigoIBGE={municipio.codigoIBGE}
                                    totalRecursos={municipio.totalRecursos || 0}
                                    selectedMandato={selectedMandato}
                                    votacaoAle={municipio.votacaoAle}
                                    votacaoLincoln={municipio.votacaoLincoln}
                                    compact={true}
                                />
                                <InfoGeraisCard
                                    idh={municipio.idh}
                                    pibPerCapita={municipio.pibPerCapita}
                                    codigoIBGE={municipio.codigoIBGE}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'apoio' && (
                    <div className="space-y-6">
                        <ApoiadoresCard 
                            apoiadores={apoiadores} 
                            onAddClick={() => { setEditingApoiador(null); setIsApoiadorModalOpen(true); }}
                            onEditClick={(a) => { setEditingApoiador(a); setIsApoiadorModalOpen(true); }}
                            onDeleteClick={handleDeleteApoiador}
                            onApoiadorClick={(id) => navigateTo('ApoiadorPerfil', { id })}
                        />
                        <LiderancasLocaisCard liderancas={municipio.liderancas} />
                    </div>
                )}

                {activeTab === 'operacional' && (
                    <div className="space-y-6">
                        <RecursosCard municipioId={municipio.id} />
                        <DemandasCard demandas={municipio.demandas} />
                    </div>
                )}
            </div>

            <DemandaModal
                municipioId={municipio.id}
                isOpen={isDemandaModalOpen}
                onClose={() => setIsDemandaModalOpen(false)}
                onSuccess={fetchMunicipio}
            />

            <ApoiadorModal 
                isOpen={isApoiadorModalOpen}
                onClose={() => setIsApoiadorModalOpen(false)}
                onSuccess={fetchRelatedData}
                municipio={municipio}
                editingApoiador={editingApoiador}
            />
        </div>
    );
};

export default MunicipioDetalhesPage;
