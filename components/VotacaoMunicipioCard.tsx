import React, { useEffect, useState } from 'react';

interface VotacaoData {
    l: number; // Lincoln
    a: number; // Alê
}

interface VotacaoMunicipioCardProps {
    codigoIBGE: string;
}

const VotacaoMunicipioCard: React.FC<VotacaoMunicipioCardProps> = ({ codigoIBGE }) => {
    const [votos, setVotos] = useState<VotacaoData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadVotos = async () => {
            try {
                const response = await fetch('/data/votos_resumo.json');
                const data = await response.json();
                if (data[codigoIBGE]) {
                    setVotos(data[codigoIBGE]);
                }
            } catch (error) {
                console.error('Erro ao carregar votos:', error);
            } finally {
                setLoading(false);
            }
        };
        loadVotos();
    }, [codigoIBGE]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
                <div className="h-4 w-32 bg-slate-100 dark:bg-slate-700 rounded mb-4"></div>
                <div className="space-y-3">
                    <div className="h-12 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-12 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
                </div>
            </div>
        );
    }

    if (!votos) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <span className="material-symbols-outlined text-6xl">how_to_vote</span>
            </div>

            <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-xl">ballot</span>
                <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-tight">Desempenho Eleitoral <span className="text-slate-400 font-medium ml-1">2022</span></h3>
            </div>

            <div className="space-y-4">
                {/* Lincoln Portela */}
                <div className="relative">
                    <div className="flex justify-between items-end mb-1">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Dep. Federal</p>
                            <h4 className="text-sm font-black text-navy-dark dark:text-white">Lincoln Portela</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-[#8db641] leading-none">{votos.l.toLocaleString('pt-BR')}</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Votos</p>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#8db641] rounded-full transition-all duration-1000"
                            style={{ width: votos.l > 0 ? '100%' : '0%' }}
                        ></div>
                    </div>
                </div>

                {/* Alê Portela */}
                <div className="relative pt-2">
                    <div className="flex justify-between items-end mb-1">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Dep. Estadual</p>
                            <h4 className="text-sm font-black text-navy-dark dark:text-white">Alê Portela</h4>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-black text-primary leading-none">{votos.a.toLocaleString('pt-BR')}</span>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Votos</p>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-1000 delay-300"
                            style={{ width: votos.a > 0 ? '100%' : '0%' }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Total Consolidado</span>
                    <span className="text-navy-dark dark:text-slate-300">{(votos.l + votos.a).toLocaleString('pt-BR')} votos</span>
                </div>
            </div>
        </div>
    );
};

export default VotacaoMunicipioCard;
