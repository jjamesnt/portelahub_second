
import React, { useState, useRef } from 'react';
import { createDemanda } from '../services/api';

interface DemandaModalProps {
    municipioId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const DemandaModal: React.FC<DemandaModalProps> = ({ municipioId, isOpen, onClose, onSuccess }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<string[]>([]);

    const tituloRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        status: 'Em Análise',
        prioridade: 'Média'
    });

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Limpar erro ao digitar
        if (formErrors.includes(name)) {
            setFormErrors(prev => prev.filter(err => err !== name));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação estrita
        const errors = [];
        if (!formData.titulo.trim()) errors.push('titulo');
        
        setFormErrors(errors);
        
        if (errors.length > 0) {
            if (errors.includes('titulo')) tituloRef.current?.focus();
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await createDemanda({
                municipio_id: municipioId,
                titulo: formData.titulo,
                descricao: formData.descricao,
                tipo: 'Geral',
                status: formData.status,
                prioridade: formData.prioridade
            });
            
            setFormData({
                titulo: '',
                descricao: '',
                status: 'Em Análise',
                prioridade: 'Média'
            });
            
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao criar demanda');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10002] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all animate-in slide-in-from-bottom sm:zoom-in duration-300 flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                    <h3 className="font-black text-xl text-navy-custom dark:text-white uppercase tracking-tight">Nova Demanda</h3>
                    <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Título / Descrição Curta <span className="text-rose-500">*</span></label>
                        <input
                            ref={tituloRef}
                            type="text"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleInputChange}
                            placeholder="Ex: Reforma da Praça Central"
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('titulo') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white`}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Detalhamento / Subdescrição</label>
                        <textarea
                            name="descricao"
                            value={formData.descricao}
                            onChange={handleInputChange}
                            placeholder="Descreva os detalhes da demanda..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white"
                            >
                                <option value="Em Análise">Em Análise</option>
                                <option value="Em Execução">Em Execução</option>
                                <option value="Concluída">Concluída</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Prioridade</label>
                            <select
                                name="prioridade"
                                value={formData.prioridade}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all dark:text-white"
                            >
                                <option value="Baixa">Baixa</option>
                                <option value="Média">Média</option>
                                <option value="Alta">Alta</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {error}
                        </div>
                    )}

                    <div className="pt-2 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-800 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-4 py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-primary/30 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                        >
                            {isSaving ? (
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-[18px]">save_as</span>
                            )}
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DemandaModal;
