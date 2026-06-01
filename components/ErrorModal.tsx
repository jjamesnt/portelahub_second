import React from 'react';

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    technicalDetails?: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    technicalDetails
}) => {
    if (!isOpen) return null;

    const copyToClipboard = () => {
        if (technicalDetails) {
            navigator.clipboard.writeText(technicalDetails);
            alert("Detalhes técnicos copiados!");
        }
    };

    return (
        <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-rose-500/20 animate-in zoom-in-95 duration-200">
                <div className="p-8 text-center">
                    <div className="size-20 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 mx-auto mb-6 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl">error</span>
                    </div>
                    
                    <h3 className="text-2xl font-black text-navy-dark dark:text-white mb-3 tracking-tight">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">
                        {message}
                    </p>

                    {technicalDetails && (
                        <div className="mb-6 space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informação Técnica para Suporte</span>
                                <button 
                                    onClick={copyToClipboard}
                                    className="text-[10px] font-bold text-turquoise hover:underline uppercase"
                                >
                                    Copiar
                                </button>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-left">
                                <code className="text-[10px] font-mono text-rose-500 dark:text-rose-400 break-all leading-tight">
                                    {technicalDetails}
                                </code>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-navy-dark dark:bg-white dark:text-navy-dark text-white rounded-2xl font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-navy-dark/20 dark:shadow-none"
                    >
                        Fechar e Reportar
                    </button>
                    
                    <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        Envie os detalhes acima para o suporte@portelahub.com
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;
