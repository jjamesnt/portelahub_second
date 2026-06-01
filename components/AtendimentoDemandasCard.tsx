
import React from 'react';
import { Municipio } from '../types';

interface AtendimentoDemandasCardProps {
    municipio: Municipio;
}

const AtendimentoDemandasCard: React.FC<AtendimentoDemandasCardProps> = ({ municipio }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-full">
            <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-amber-500">assignment</span>
                <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-wider">Atendimento e Demandas</h3>
            </div>

            {/* KPIs de Taxa de Conclusão e Tempo de Resposta */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                    <div className="flex justify-between items-baseline mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Taxa de Conclusão</p>
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md">+5.2%</span>
                    </div>
                    <p className="text-xl font-black text-navy-dark dark:text-white">64%</p>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: '64%' }}></div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                    <div className="flex justify-between items-baseline mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Tempo de Resposta</p>
                        <span className="text-[9px] font-bold text-slate-400">Meta: 10d</span>
                    </div>
                    <p className="text-xl font-black text-navy-dark dark:text-white">12d</p>
                    <div className="flex gap-1 mt-2.5">
                        <div className="h-1.5 flex-1 bg-primary rounded-full"></div>
                        <div className="h-1.5 flex-1 bg-primary rounded-full"></div>
                        <div className="h-1.5 flex-1 bg-primary rounded-full"></div>
                        <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status de Atendimento</p>
                        <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                            municipio.statusAtendimento === 'Contemplado' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                            municipio.statusAtendimento === 'Não contemplado' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                            <span className="material-symbols-outlined text-[18px]">
                                {municipio.statusAtendimento === 'Contemplado' ? 'check_circle' : 'pending'}
                            </span>
                            <span className="text-xs font-black uppercase tracking-wider">{municipio.statusAtendimento || 'Pendente'}</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Atendimento</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            {municipio.tipoAtendimento || '—'}
                        </p>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Principal Demanda</p>
                        <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-1 bg-indigo-50 dark:bg-indigo-900/10 p-2.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50 italic">
                            "{municipio.principalDemanda || 'Nenhuma demanda principal registrada'}"
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sugestão de Programa SEDESE</p>
                        <div className="mt-1 p-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                {municipio.sugestaoSedese || 'Nenhuma sugestão enviada'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observações do Gabinete</p>
                        <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl h-[100px] overflow-y-auto">
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                {municipio.observacao || 'Sem observações adicionais.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AtendimentoDemandasCard;
