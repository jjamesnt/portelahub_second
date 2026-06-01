
import React, { useState, useMemo } from 'react';
import { Demanda } from '../types';

interface DemandasCardProps {
    demandas: Demanda[];
}

const DemandasCard: React.FC<DemandasCardProps> = ({ demandas }) => {
    const [filtro, setFiltro] = useState('');

    const demandasFiltradas = useMemo(() => {
        if (!filtro) return demandas;
        return demandas.filter(d => d.descricao.toLowerCase().includes(filtro.toLowerCase()));
    }, [demandas, filtro]);
    
    const statusStyle = (status: Demanda['status']) => {
        switch (status) {
            case 'Em Análise': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50';
            case 'Em Execução': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50';
            case 'Concluída': return 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50';
        }
    }
    
    const prioridadeStyle = (prioridade: Demanda['prioridade']) => {
        switch (prioridade) {
            case 'Alta': return 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
            case 'Média': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
            case 'Baixa': return 'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400';
        }
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-wrap justify-between items-center gap-4">
                <h3 className="text-navy-custom dark:text-white text-lg font-bold">Demandas Ativas</h3>
                <div className="relative w-full sm:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                    <input 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                        placeholder="Procurar demanda..." 
                        type="text"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="border-b border-slate-100 dark:border-slate-700">
                        <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                            <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">ID</th>
                            <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Descrição</th>
                            <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">Prioridade</th>
                            <th className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest text-right">Opções</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {demandasFiltradas.map(demanda => (
                            <tr key={demanda.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-5 text-[11px] font-bold text-slate-400">{demanda.id}</td>
                                <td className="px-6 py-5">
                                    <p className="text-sm font-bold text-navy-custom dark:text-white leading-tight">{demanda.descricao}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{demanda.subdescricao}</p>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full uppercase border ${statusStyle(demanda.status)}`}>{demanda.status}</span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`font-bold text-[10px] uppercase px-2 py-1 rounded ${prioridadeStyle(demanda.prioridade)}`}>{demanda.prioridade}</span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button className="text-slate-400 hover:text-navy-custom dark:hover:text-white"><span className="material-symbols-outlined text-[20px]">more_horiz</span></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DemandasCard;
