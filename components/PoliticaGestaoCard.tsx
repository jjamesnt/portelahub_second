
import React from 'react';
import { Municipio, Assessor } from '../types';

interface PoliticaGestaoCardProps {
    municipio: Municipio;
    assessor?: Assessor;
}

const PoliticaGestaoCard: React.FC<PoliticaGestaoCardProps> = ({ municipio, assessor }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-indigo-500">strategy</span>
                <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-wider">Gestão Política</h3>
            </div>

            <div className="space-y-6">
                <div className="flex justify-between items-center group">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status do Prefeito</p>
                        <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-1">{municipio.statusPrefeito || 'Não informado'}</p>
                    </div>
                    <div className={`size-10 rounded-2xl flex items-center justify-center transition-all ${
                        municipio.statusPrefeito === 'Prefeitura Parceira' ? 'bg-emerald-50 text-emerald-500' : 
                        municipio.statusPrefeito === 'Prefeitura Fechada' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'
                    }`}>
                        <span className="material-symbols-outlined text-[20px]">
                            {municipio.statusPrefeito === 'Prefeitura Parceira' ? 'handshake' : 
                             municipio.statusPrefeito === 'Prefeitura Fechada' ? 'lock' : 'help'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between items-center group">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lincoln Fechado?</p>
                            <p className={`text-xs font-black uppercase mt-1 ${municipio.lincolnFechado ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {municipio.lincolnFechado ? 'Sim' : 'Não'}
                            </p>
                        </div>
                        <div className={`size-8 rounded-xl flex items-center justify-center transition-all ${
                            municipio.lincolnFechado ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                        }`}>
                            <span className="material-symbols-outlined text-[18px]">
                                {municipio.lincolnFechado ? 'check_circle' : 'cancel'}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex justify-between items-center group">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IDENE</p>
                            <p className={`text-xs font-black uppercase mt-1 ${municipio.idene ? 'text-amber-600' : 'text-rose-600'}`}>
                                {municipio.idene ? 'Sim' : 'Não'}
                            </p>
                        </div>
                        <div className={`size-8 rounded-xl flex items-center justify-center transition-all ${
                            municipio.idene ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'
                        }`}>
                            <span className="material-symbols-outlined text-[18px]">
                                {municipio.idene ? 'verified' : 'cancel'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                            <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">person</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Assessor Responsável</p>
                            <p className="text-sm font-black text-navy-dark dark:text-white mt-0.5">{assessor?.nome || 'Não atribuído'}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{assessor?.cargo || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PoliticaGestaoCard;
