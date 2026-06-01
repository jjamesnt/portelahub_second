import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDanger = true
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDanger ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-turquoise/10 text-turquoise'}`}>
                        <span className="material-symbols-outlined text-4xl">{isDanger ? 'warning' : 'info'}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-navy-dark dark:text-white mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onConfirm}
                            className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] ${isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-none' : 'bg-turquoise hover:brightness-110 shadow-lg shadow-turquoise/20'}`}
                        >
                            {confirmText}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
