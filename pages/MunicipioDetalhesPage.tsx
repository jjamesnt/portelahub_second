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
        <div className="max-w-[1400px] mx-auto p-4 md:p-8">
            <nav className="flex flex-wrap items-center gap-2 mb-6 text-xs md:sm font-medium">
                <button onClick={() => navigateTo('Dashboard')} className="text-primary hover:text-primary/80">Dashboard</button>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <button onClick={() => navigateTo('Municípios')} className="text-primary hover:text-primary/80">Minas Gerais</button>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-navy-custom dark:text-slate-300 font-bold">{municipio.nome}</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-3 mb-4">
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


            {/* Row 1: Main KPIs - Recursos + Votos dos Deputados */}
            {/* Top Row: Gestão Política e Informações Gerais */}
            {/* Row 1: Gestão Política e Eleitorado */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <PoliticaGestaoCard 
                    municipio={municipio} 
                    assessor={assessores.find(a => a.id === municipio.assessorId)} 
                />
                <EleitoradoCard codigoIBGE={municipio.codigoIBGE} />
            </div>

            {/* Row 2: Apoiadores Estratégicos e Votos Compacto */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ApoiadoresCard 
                    apoiadores={apoiadores} 
                    onAddClick={() => { setEditingApoiador(null); setIsApoiadorModalOpen(true); }}
                    onEditClick={(a) => { setEditingApoiador(a); setIsApoiadorModalOpen(true); }}
                    onDeleteClick={handleDeleteApoiador}
                />
                <VotacaoKPIs
                    municipioId={municipio.id}
                    codigoIBGE={municipio.codigoIBGE}
                    totalRecursos={municipio.totalRecursos || 0}
                    selectedMandato={selectedMandato}
                    votacaoAle={municipio.votacaoAle}
                    votacaoLincoln={municipio.votacaoLincoln}
                    compact={true}
                />
            </div>

            {/* Row 3: Geral Expandido */}
            <div className="mb-8">
                <InfoGeraisCard
                    idh={municipio.idh}
                    pibPerCapita={municipio.pibPerCapita}
                    codigoIBGE={municipio.codigoIBGE}
                />
            </div>

            <div className="space-y-8 mt-8">
                <RecursosCard municipioId={municipio.id} />
                <DemandasCard demandas={municipio.demandas} />
                <LiderancasLocaisCard liderancas={municipio.liderancas} />
                <AtendimentoDemandasCard municipio={municipio} />
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
