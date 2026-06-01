import React, { useEffect, useState } from 'react';

interface EleitoradoCardProps {
    codigoIBGE: string;
}

interface EleitoradoData {
    eleitores: number;
    mulheres: number;
    homens: number;
    isBiometria: boolean;
    locaisVotacao?: number;
    secoes?: number;
}

const EleitoradoCard: React.FC<EleitoradoCardProps> = ({ codigoIBGE }) => {
    const [data, setData] = useState<EleitoradoData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch('/data/eleitorado_resumo.json')
            .then(r => r.json())
            .then(res => {
                if (res[codigoIBGE]) setData(res[codigoIBGE]);
                else setData(null);
                setLoading(false);
            })
            .catch(() => { setLoading(false); });
    }, [codigoIBGE]);

    if (loading) return <div className="h-[200px] bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>;
    if (!data) return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-full flex flex-col justify-center items-center p-6 text-slate-400 min-h-[200px]">
             <span className="material-symbols-outlined text-3xl mb-1">how_to_vote</span>
             <p className="text-xs font-bold uppercase">Eleitorado Indisponível</p>
        </div>
    );

    const pctMulheres = data.eleitores > 0 ? Math.round((data.mulheres / data.eleitores) * 100) : 0;
    const pctHomens = data.eleitores > 0 ? Math.round((data.homens / data.eleitores) * 100) : 0;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/10">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500 text-lg">how_to_vote</span>
                    <h3 className="text-navy-dark dark:text-white text-sm md:text-sm font-black uppercase tracking-widest">Eleitorado (TSE)</h3>
                </div>
                {data.isBiometria && (
                    <span className="text-[8px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Biometria Ativa</span>
                )}
            </div>
            
            <div className="p-4 md:p-5">
                <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Eleitores Aptos</p>
                    <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {data.eleitores.toLocaleString('pt-BR')}
                    </h3>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Feminino ({pctMulheres}%)</span>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">{data.mulheres.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500 rounded-full" style={{ width: `${pctMulheres}%` }}></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Masculino ({pctHomens}%)</span>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">{data.homens.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pctHomens}%` }}></div>
                        </div>
                    </div>
                </div>

                {(data.locaisVotacao || data.secoes) && (
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Locais de Votação</p>
                            <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-0.5">{data.locaisVotacao || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Seções</p>
                            <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-0.5">{data.secoes || '—'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EleitoradoCard;
