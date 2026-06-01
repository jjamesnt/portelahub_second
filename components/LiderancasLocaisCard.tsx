
import React from 'react';
import { LiderancaLocal } from '../types';

interface LiderancasLocaisCardProps {
    liderancas: LiderancaLocal[];
}

const LiderancasLocaisCard: React.FC<LiderancasLocaisCardProps> = ({ liderancas }) => {

    const cargoStyle = (cargo: LiderancaLocal['cargo']) => {
        switch (cargo) {
            case 'Prefeito': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Vereador': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/10">
                <h3 className="text-navy-custom dark:text-white text-sm md:text-lg font-black uppercase tracking-widest">Lideranças</h3>
                <button className="bg-primary/10 text-primary text-[9px] md:text-[10px] font-black px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-all uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] md:text-sm">person_add</span>
                    <span className="hidden md:inline">Adicionar</span>
                    <span className="md:hidden">Novo</span>
                </button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
                {liderancas.map(lider => (
                    <div key={lider.nome} className="p-3 md:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 md:gap-3 flex-1 min-w-0">
                            <div className="size-9 md:size-10 rounded-xl bg-navy-custom dark:bg-slate-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">{lider.avatarInitials}</div>
                            <div className="min-w-0">
                                <p className="text-xs md:text-sm font-black text-navy-custom dark:text-white truncate">{lider.nome}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`px-1.5 py-0.5 text-[8px] md:text-[9px] font-black rounded uppercase tracking-tighter ${cargoStyle(lider.cargo)}`}>{lider.cargo}</span>
                                    <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">{lider.partido}</span>
                                </div>
                            </div>
                        </div>
                        <button className="size-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-primary hover:bg-primary/5 transition-all shrink-0">
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                    </div>
                ))}
            </div>
            <div className="p-3 bg-slate-50/50 dark:bg-slate-900/10 text-center border-t border-slate-100 dark:border-slate-700">
                <button className="text-slate-400 text-[9px] font-black hover:text-primary transition-colors uppercase tracking-[0.2em]">Visualizar Tudo</button>
            </div>
        </div>
    );
};

export default LiderancasLocaisCard;
