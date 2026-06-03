
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { NotificationsMenu } from './NotificationsMenu';

const Header: React.FC = () => {
    const { theme, toggleTheme, selectedMandato, setSelectedMandato, toggleSidebar, impersonatedProfile, stopImpersonating } = useAppContext();

    return (
        <>
            {impersonatedProfile && (
                <div className="bg-amber-600 dark:bg-amber-700 text-white px-4 md:px-8 py-2.5 flex justify-between items-center z-[5000] sticky top-0 shadow-lg border-b border-amber-500/30 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3 text-[10px] md:text-sm font-black uppercase tracking-wider">
                        <span className="material-symbols-outlined text-lg md:text-xl">visibility</span>
                        <span>MODO SUPORTE: Visualizando como <strong className="bg-white/20 px-2 py-0.5 rounded">{impersonatedProfile.full_name}</strong></span>
                    </div>
                    <button 
                        onClick={stopImpersonating}
                        className="bg-white text-amber-700 hover:bg-amber-50 px-3 md:px-4 py-1 rounded-full text-[9px] md:text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                        ENCERRAR SESSÃO
                    </button>
                </div>
            )}
            <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 md:px-8 shrink-0 gap-2 md:gap-4">

            {/* Mobile Menu Button */}
            <button
                onClick={toggleSidebar}
                className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg shrink-0"
            >
                <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="hidden md:flex items-center gap-6 flex-1 max-w-4xl">
                <div className="relative w-full max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <span className="material-symbols-outlined text-lg">search</span>
                    </span>
                    <input className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Buscar no Portela Hub..." type="text" />
                </div>
            </div>

            <div className="flex-auto md:flex-none overflow-x-auto no-scrollbar min-w-0 flex justify-center md:justify-start px-1">
                <div className="flex items-center gap-0.5 md:gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-0.5 md:p-1 rounded-full border border-slate-200 dark:border-slate-800 whitespace-nowrap min-w-fit shadow-inner mx-auto md:mx-0">
                    <button
                        onClick={() => setSelectedMandato('Todos')}
                        className={`px-2.5 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-xs font-black uppercase tracking-wider transition-all ${selectedMandato === 'Todos'
                            ? 'bg-navy-dark text-white shadow-lg shadow-navy-dark/20'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setSelectedMandato('Lincoln Portela')}
                        className={`px-2.5 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-xs font-black uppercase tracking-wider transition-all ${selectedMandato === 'Lincoln Portela'
                            ? 'bg-[#8db641] text-white shadow-lg shadow-[#8db641]/20'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        Lincoln
                    </button>
                    <button
                        onClick={() => setSelectedMandato('Alê Portela')}
                        className={`px-2.5 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${selectedMandato === 'Alê Portela'
                            ? 'bg-turquoise text-white shadow-lg shadow-turquoise/20'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        Alê
                    </button>
                    <button
                        onClick={() => setSelectedMandato('Marilda Portela')}
                        className={`px-2.5 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider transition-all ${selectedMandato === 'Marilda Portela'
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        Marilda
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-full">
                    <span className="material-symbols-outlined">search</span>
                </button>
                <NotificationsMenu />
                <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <span className="material-symbols-outlined">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
                </button>
            </div>
        </header>
        </>
    );
};
export default Header;
