import React, { useEffect, useState } from 'react';

interface VotacaoEstadualKPIsProps {
    selectedMandato: string;
}

const VotacaoEstadualKPIs: React.FC<VotacaoEstadualKPIsProps> = ({ selectedMandato }) => {
    const [totais, setTotais] = useState<{ lincoln: number; ale: number; marilda: number } | null>(null);

    useEffect(() => {
        fetch('/data/votos_resumo.json')
            .then(r => r.json())
            .then((data: Record<string, { l: number; a: number; m: number }>) => {
                let lincoln = 0;
                let ale = 0;
                let marilda = 0;
                Object.entries(data).forEach(([code, v]) => {
                    lincoln += v.l;
                    ale += v.a;
                    marilda += (v.m || 0);
                });
                setTotais({ lincoln, ale, marilda });
            })
            .catch(() => { });
    }, []);

    const total = totais ? totais.lincoln + totais.ale + totais.marilda : 0;
    const maxVotos = totais ? Math.max(totais.lincoln, totais.ale, totais.marilda) : 1;

    const lincolnCard = (
        <div key="lincoln" className={`rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden border-2 transition-all duration-500
            ${selectedMandato === 'Lincoln Portela'
                ? 'border-[#8db641] bg-gradient-to-br from-[#8db641]/20 via-white to-white dark:from-[#8db641]/30 dark:via-slate-800 dark:to-slate-800 scale-[1.02] ring-4 ring-[#8db641]/20 z-10 shadow-[#8db641]/20'
                : selectedMandato === 'Todos'
                    ? 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#8db641]/30'
                    : 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 opacity-40 grayscale scale-[0.98]'}`}>

            {selectedMandato === 'Lincoln Portela' && (
                <div className="absolute top-3 right-3 bg-[#8db641] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm z-20">
                    Ativo
                </div>
            )}

            <div className="absolute -bottom-3 -right-3 opacity-[0.05]">
                <span className="material-symbols-outlined text-[70px] md:text-[100px] text-[#8db641]">star</span>
            </div>

            <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#8db641] text-white shadow-lg shadow-[#8db641]/30">
                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                </div>
                <div>
                    <p className="text-[10px] font-black text-[#5a7629] dark:text-[#a0c655] uppercase tracking-tighter leading-none">Deputado Federal</p>
                    <p className="text-sm font-black text-navy-dark dark:text-white uppercase">Lincoln Portela</p>
                </div>
            </div>

            <div className="flex items-baseline gap-1 mt-2">
                <h3 className="text-2xl md:text-3xl font-black text-[#8db641] tracking-tighter">
                    {totais ? totais.lincoln.toLocaleString('pt-BR') : '—'}
                </h3>
                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase">votos</span>
            </div>

            {totais && (
                <div className="mt-4 space-y-2">
                    <div className="h-2 w-full bg-[#8db641]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#8db641] rounded-full transition-all duration-1000" style={{ width: `${(totais.lincoln / maxVotos) * 100}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );

    const aleCard = (
        <div key="ale" className={`rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden border-2 transition-all duration-500
            ${selectedMandato === 'Alê Portela'
                ? 'border-primary bg-gradient-to-br from-primary/20 via-white to-white dark:from-primary/30 dark:via-slate-800 dark:to-slate-800 scale-[1.02] ring-4 ring-primary/20 z-10 shadow-primary/20'
                : selectedMandato === 'Todos'
                    ? 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/30'
                    : 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 opacity-40 grayscale scale-[0.98]'}`}>

            {selectedMandato === 'Alê Portela' && (
                <div className="absolute top-3 right-3 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm z-20">
                    Ativo
                </div>
            )}

            <div className="absolute -bottom-3 -right-3 opacity-[0.05]">
                <span className="material-symbols-outlined text-[70px] md:text-[100px] text-primary">auto_awesome</span>
            </div>

            <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined text-[18px]">apartment</span>
                </div>
                <div>
                    <p className="text-[10px] font-black text-primary dark:text-primary-light uppercase tracking-tighter leading-none">Deputada Estadual</p>
                    <p className="text-sm font-black text-navy-dark dark:text-white uppercase">Alê Portela</p>
                </div>
            </div>

            <div className="flex items-baseline gap-1 mt-2">
                <h3 className="text-2xl md:text-3xl font-black text-primary tracking-tighter">
                    {totais ? totais.ale.toLocaleString('pt-BR') : '—'}
                </h3>
                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase">votos</span>
            </div>

            {totais && (
                <div className="mt-4 space-y-2">
                    <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000 delay-200" style={{ width: `${(totais.ale / maxVotos) * 100}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );

    const marildaCard = (
        <div key="marilda" className={`rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden border-2 transition-all duration-500
            ${selectedMandato === 'Marilda Portela'
                ? 'border-orange-500 bg-gradient-to-br from-orange-500/20 via-white to-white dark:from-orange-500/30 dark:via-slate-800 dark:to-slate-800 scale-[1.02] ring-4 ring-orange-500/20 z-10 shadow-orange-500/20'
                : selectedMandato === 'Todos'
                    ? 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-500/30'
                    : 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 opacity-40 grayscale scale-[0.98]'}`}>

            {selectedMandato === 'Marilda Portela' && (
                <div className="absolute top-3 right-3 bg-orange-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm z-20">
                    Ativo
                </div>
            )}

            <div className="absolute -bottom-3 -right-3 opacity-[0.05]">
                <span className="material-symbols-outlined text-[70px] md:text-[100px] text-orange-500">person</span>
            </div>

            <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
                    <span className="material-symbols-outlined text-[18px]">groups</span>
                </div>
                <div>
                    <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-tighter leading-none">Vereadora • BH</p>
                    <p className="text-sm font-black text-navy-dark dark:text-white uppercase">Marilda Portela</p>
                </div>
            </div>

            <div className="flex items-baseline gap-1 mt-2">
                <h3 className="text-2xl md:text-3xl font-black text-orange-500 tracking-tighter">
                    {totais ? totais.marilda.toLocaleString('pt-BR') : '7.294'}
                </h3>
                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase">votos em 2024</span>
            </div>

            {totais && (
                <div className="mt-4 space-y-2">
                    <div className="h-2 w-full bg-orange-500/10 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full transition-all duration-1000 delay-300" style={{ width: `${(totais.marilda / (maxVotos || 1)) * 100}%` }}></div>
                    </div>
                </div>
            )}
        </div>
    );

    const cards = [];
    if (selectedMandato === 'Lincoln Portela') {
        cards.push(lincolnCard, aleCard, marildaCard);
    } else if (selectedMandato === 'Alê Portela') {
        cards.push(aleCard, lincolnCard, marildaCard);
    } else if (selectedMandato === 'Marilda Portela') {
        cards.push(marildaCard, lincolnCard, aleCard);
    } else {
        cards.push(lincolnCard, aleCard, marildaCard);
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards}
        </div>
    );
};

export default VotacaoEstadualKPIs;
