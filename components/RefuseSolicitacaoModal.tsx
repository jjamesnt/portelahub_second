import React, { useState } from 'react';
import { SolicitacaoAgenda } from '../types';

interface RefuseSolicitacaoModalProps {
    isOpen: boolean;
    solicitacao: SolicitacaoAgenda | null;
    onClose: () => void;
    onConfirm: (id: string, observacoes: string) => void;
}

const RefuseSolicitacaoModal: React.FC<RefuseSolicitacaoModalProps> = ({
    isOpen,
    solicitacao,
    onClose,
    onConfirm
}) => {
    const [observacoes, setObservacoes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !solicitacao) return null;

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onConfirm(solicitacao.id, observacoes);
            setObservacoes('');
        } catch (err) {
            console.error('Erro ao recusar:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-rose-500/10">
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl">block</span>
                    </div>
                    
                    <h3 className="text-xl font-black text-navy-dark dark:text-white mb-1">Recusar Solicitação</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">
                        {solicitacao.titulo}
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                Motivo / Observações da Recusa
                            </label>
                            <textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Informe o motivo da recusa para o solicitante..."
                                className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all dark:text-white resize-none"
                            />
                            <p className="mt-2 text-[10px] text-slate-400 font-bold leading-tight">
                                Uma notificação será enviada para o solicitante com estas observações.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-sm transition-all active:scale-[0.98] shadow-lg shadow-rose-200 dark:shadow-none disabled:opacity-70 flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined">send</span>
                                )}
                                Confirmar Recusa e Notificar
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefuseSolicitacaoModal;
