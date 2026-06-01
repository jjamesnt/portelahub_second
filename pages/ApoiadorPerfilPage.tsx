
import React, { useState, useEffect } from 'react';
import { getApoiadorById, deleteApoiador } from '../services/api';
import { Apoiador, Municipio, Assessor } from '../types';
import Loader from '../components/Loader';
import ApoiadorModal from '../components/ApoiadorModal';
import ConfirmModal from '../components/ConfirmModal';

interface ApoiadorPerfilPageProps {
    apoiadorId: string;
    navigateTo: (page: string, params?: { [key: string]: any }) => void;
}

const ApoiadorPerfilPage: React.FC<ApoiadorPerfilPageProps> = ({ apoiadorId, navigateTo }) => {
    const [apoiador, setApoiador] = useState<any>(null);
    const [allMunicipios, setAllMunicipios] = useState<Municipio[]>([]);
    const [allApoiadores, setAllApoiadores] = useState<Apoiador[]>([]);
    const [allAssessores, setAllAssessores] = useState<Assessor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [data, munData, apoData, assData] = await Promise.all([
                getApoiadorById(apoiadorId),
                import('../services/api').then(m => m.getMunicipios()),
                import('../services/api').then(m => m.getApoiadores()),
                import('../services/api').then(m => m.getAssessores())
            ]);

            if (data) setApoiador(data);
            setAllMunicipios(munData);
            setAllApoiadores(apoData);
            setAllAssessores(assData);
        } catch (err) {
            console.error("Erro ao carregar perfil do apoiador", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [apoiadorId]);

    const handleDelete = async () => {
        try {
            await deleteApoiador(apoiadorId);
            navigateTo('Apoiadores');
        } catch (err) {
            console.error("Erro ao deletar apoiador", err);
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader /></div>;
    if (!apoiador) return <div className="p-8 text-center font-bold text-slate-500">Apoiador não encontrado</div>;

    const m = apoiador.municipio as Municipio;

    const getStatusPrefeitoColor = (status?: string) => {
        switch (status) {
            case 'Prefeitura Fechada': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            case 'Prefeitura Parceira': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'Não': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
            default: return 'bg-slate-50 text-slate-400 dark:bg-slate-800/50';
        }
    };

    return (
        <div className="p-4 md:p-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest shrink-0">
                    <button onClick={() => navigateTo('Apoiadores')} className="hover:text-indigo-600 transition-colors">Apoiadores</button>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-slate-600 dark:text-slate-300">Perfil do Apoiador</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button 
                        onClick={() => setIsNewModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        Novo Apoiador
                    </button>
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-indigo-600 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Editar
                    </button>
                    <button 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-rose-500 border border-rose-100 dark:border-rose-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Remover
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Lateral: Card de Perfil */}
                <div className="md:col-span-1 space-y-6">

                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500 to-cyan-500 -z-0 opacity-10"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="size-32 rounded-[2rem] bg-slate-100 dark:bg-slate-900 p-1 mb-4 shadow-2xl">
                                {apoiador.fotoUrl && !apoiador.fotoUrl.includes('placeholder') && !apoiador.fotoUrl.includes('via.placeholder') ? (
                                    <img src={apoiador.fotoUrl} alt={apoiador.nome} className="w-full h-full object-cover rounded-[1.8rem]" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-[1.8rem]">
                                        <span className="text-4xl font-black">{apoiador.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                                    </div>
                                )}
                            </div>
                            
                            <h2 className="text-xl font-black text-navy-dark dark:text-white leading-tight">{apoiador.nome}</h2>
                            <span className="mt-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {apoiador.cargo}
                            </span>
                            
                            {/* Assessor Responsável */}
                            {apoiador.assessor && (
                                <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-tight">Responsável:</span>
                                    <span className="text-[10px] font-black text-navy-dark dark:text-white uppercase truncate">{apoiador.assessor.nome}</span>
                                </div>
                            )}

                            <div className="w-full mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
                                <div className="flex items-center gap-3 text-left group">
                                    <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">call</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp</p>
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">{apoiador.telefone || "Não informado"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-left group">
                                    <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">E-mail</p>
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 truncate max-w-[180px]">{apoiador.email || "Não informado"}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-left group">
                                    <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors shrink-0">
                                        <span className="material-symbols-outlined text-[20px]">location_on</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Endereço</p>
                                        <p className="text-xs font-black text-slate-700 dark:text-slate-200 leading-relaxed">{apoiador.endereco || "Não informado"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conteúdo Principal */}
                <div className="md:col-span-2 space-y-6">
                    {/* Munícipio e Status Político */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xl font-black text-navy-dark dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-indigo-500">apartment</span>
                                    {apoiador.municipioNome}
                                </h3>
                                <p className="text-xs text-slate-500 font-extrabold uppercase tracking-[0.15em] mt-1">{m?.regiao}</p>
                            </div>
                            <button 
                                onClick={() => navigateTo('MunicipioDetalhes', { id: apoiador.municipioId })}
                                className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                            >
                                Ver Cidade
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Status do Prefeito</p>
                                <span className={`w-fit px-3 py-1 rounded-full text-[11px] font-black ${getStatusPrefeitoColor(m?.statusPrefeito)}`}>
                                    {m?.statusPrefeito || "Não Informado"}
                                </span>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Lincoln Portela</p>
                                <div className="flex items-center gap-2">
                                    {m?.lincolnFechado ? (
                                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500 text-white flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">beenhere</span>
                                            Fechado
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-500 dark:bg-slate-800">
                                            Não Fechado
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Participação IDENE</p>
                                <span className={`w-fit px-3 py-1 rounded-full text-[11px] font-black ${m?.idene ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {m?.idene ? 'Sim' : 'Não'}
                                </span>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Situação Atendimento</p>
                                <span className={`w-fit px-3 py-1 rounded-full text-[11px] font-black ${
                                    m?.statusAtendimento === 'Contemplado' 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                    {m?.statusAtendimento || "Em Análise"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Votação */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-700">
                        <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-6">Votação Consolidada 2022</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 relative overflow-hidden group">
                                <div className="size-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined">how_to_reg</span>
                                </div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase">Alê Portela</p>
                                <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{m?.votacaoAle?.toLocaleString() || "0"}</p>
                                <p className="text-[10px] font-bold text-indigo-300 dark:text-indigo-500/50 mt-1 uppercase">Votos nominais</p>
                            </div>
                            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20 relative overflow-hidden group">
                                <div className="size-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined">how_to_reg</span>
                                </div>
                                <p className="text-[10px] font-black text-emerald-400 uppercase">Lincoln Portela</p>
                                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{m?.votacaoLincoln?.toLocaleString() || "0"}</p>
                                <p className="text-[10px] font-bold text-emerald-300 dark:text-emerald-500/50 mt-1 uppercase">Votos nominais</p>
                            </div>
                        </div>
                    </div>

                    {/* Demandas e Observações */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-700">
                        <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-widest mb-6">Demanda e Atendimento</h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Principal Demanda</p>
                                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed min-h-[80px]">
                                    {m?.principalDemanda || "Nenhuma demanda registrada até o momento."}
                                </div>
                            </div>
                            {m?.tipoAtendimento && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Atendimento</p>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300">
                                        {m.tipoAtendimento}
                                    </div>
                                </div>
                            )}
                            {m?.sugestaoSedese && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sugestão SEDESE</p>
                                    <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        <span className="text-sm font-black uppercase tracking-wider">{m.sugestaoSedese}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modais */}
            <ApoiadorModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    loadData();
                }}
                editingApoiador={apoiador}
                municipio={m}
                allMunicipios={allMunicipios}
                allApoiadores={allApoiadores}
                allAssessores={allAssessores}
            />

            <ApoiadorModal 
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                onSuccess={() => {
                    setIsNewModalOpen(false);
                    navigateTo('Apoiadores');
                }}
                municipio={m} 
                allMunicipios={allMunicipios}
                allApoiadores={allApoiadores}
                allAssessores={allAssessores}
            />

            <ConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Remover Apoiador"
                message={`Tem certeza que deseja remover o apoiador ${apoiador.nome}? Esta ação não poderá ser desfeita.`}
            />
        </div>
    );
};

export default ApoiadorPerfilPage;
