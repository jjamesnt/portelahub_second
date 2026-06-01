import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { getNotificacoes, marcarNotificacaoComoLida } from '../services/api';
import { NotificacaoSistema } from '../types';

export const NotificationsMenu: React.FC = () => {
    const { user } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [notificacoes, setNotificacoes] = useState<NotificacaoSistema[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user?.id) return;

        const fetchNotificacoes = async () => {
            const data = await getNotificacoes(user.id);
            setNotificacoes(data);
            setUnreadCount(data.filter(n => !n.lida).length);
        };

        fetchNotificacoes();
        // Em um cenário ideal teríamos um subscription realtime aqui
        const interval = setInterval(fetchNotificacoes, 60000); // Polling a cada 1 min
        return () => clearInterval(interval);
    }, [user?.id, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notificacao: NotificacaoSistema) => {
        if (!notificacao.lida) {
            await marcarNotificacaoComoLida(notificacao.id);
            setNotificacoes(prev => prev.map(n => n.id === notificacao.id ? { ...n, lida: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        if (notificacao.link) {
            window.location.href = notificacao.link; // Usa o direcionamento do browser para recarregar a rota atual
        }
        
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors relative"
            >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white font-bold items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[100] overflow-hidden flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">notifications_active</span>
                            Notificações
                        </h3>
                        {unreadCount > 0 && (
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                {unreadCount} novas
                            </span>
                        )}
                    </div>

                    <div className="overflow-y-auto no-scrollbar flex-1 p-2">
                        {notificacoes.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-4xl opacity-50">notifications_paused</span>
                                <p className="text-sm">Você não tem notificações.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {notificacoes.map((notificacao) => (
                                    <button
                                        key={notificacao.id}
                                        onClick={() => handleNotificationClick(notificacao)}
                                        className={`w-full text-left p-3 rounded-lg transition-colors border-l-4 ${
                                            notificacao.lida 
                                            ? 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30 opacity-70' 
                                            : 'border-primary bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm ${notificacao.lida ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>
                                                {notificacao.titulo}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                            {notificacao.mensagem}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
