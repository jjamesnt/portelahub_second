import React from 'react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    buttonText?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
    isOpen,
    onClose,
    title = 'Sucesso!',
    message,
    buttonText = 'Entendido'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 mx-auto mb-6 flex items-center justify-center animate-bounce duration-1000">
                        <span className="material-symbols-outlined text-5xl">check_circle</span>
                    </div>
                    
                    <h3 className="text-2xl font-black text-navy-dark dark:text-white mb-2 tracking-tight">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 dark:shadow-none active:scale-[0.98]"
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;
