import React from 'react';

interface AppearanceTabProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({ theme, toggleTheme }) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-lg md:text-xl font-black text-navy-dark dark:text-white">Aparência</h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-6 md:mb-8">Personalize a aparência do Portela Hub.</p>
            <div className="flex items-center justify-between p-4 md:p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div>
                    <span className="font-bold text-sm md:text-base text-navy-dark dark:text-slate-200">Modo Escuro</span>
                    <p className="text-[10px] md:text-xs text-slate-400">Alternar entre temas claro e escuro</p>
                </div>
                <button
                    onClick={toggleTheme}
                    className={`w-12 h-6 md:w-14 md:h-7 rounded-full flex items-center p-1 transition-all duration-300 ${theme === 'dark' ? 'bg-turquoise shadow-inner' : 'bg-slate-300 shadow-inner'}`}
                >
                    <div className={`size-4 md:size-5 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${theme === 'dark' ? 'translate-x-6 md:translate-x-7' : 'translate-x-0'}`}>
                        <span className="material-symbols-outlined text-[10px] md:text-xs text-slate-400">
                            {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
};
