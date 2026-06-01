
import React from 'react';
import { Apoiador } from '../types';

interface ApoiadoresCardProps {
    apoiadores: Apoiador[];
    onAddClick: () => void;
    onEditClick: (apoiador: Apoiador) => void;
    onDeleteClick: (id: string) => void;
}

const ApoiadoresCard: React.FC<ApoiadoresCardProps> = ({ apoiadores, onAddClick, onEditClick, onDeleteClick }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500">volunteer_activism</span>
                    <h3 className="text-sm font-black text-navy-dark dark:text-white uppercase tracking-wider">Apoiadores Estratégicos</h3>
                </div>
                <button 
                    onClick={onAddClick}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-100"
                >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Cadastrar Apoiador
                </button>
            </div>

            {apoiadores.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
                    <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">group_off</span>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum apoiador cadastrado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {apoiadores.map(a => (
                        <div key={a.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all">
                            <div className="flex items-center gap-3">
                                {a.fotoUrl ? (
                                    <img src={a.fotoUrl} alt={a.nome} className="size-10 rounded-xl object-cover border border-white dark:border-slate-700 shadow-sm" />
                                ) : (
                                    <div className="size-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
                                        <span className="material-symbols-outlined text-xl">person</span>
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-navy-dark dark:text-white truncate">{a.nome}</span>
                                    <span className="text-[10px] text-slate-500 font-medium truncate italic mb-1">{a.cargo || 'Apoiador'}</span>
                                    
                                    {/* Badges de Informação Política */}
                                    <div className="flex flex-wrap gap-1">
                                        {a.municipio?.statusAtendimento && (
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                                a.municipio.statusAtendimento === 'Contemplado' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {a.municipio.statusAtendimento}
                                            </span>
                                        )}
                                        {a.municipio?.sugestaoSedese && (
                                            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                                                SEDESE: {a.municipio.sugestaoSedese}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => onEditClick(a)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button 
                                    onClick={() => onDeleteClick(a.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApoiadoresCard;
