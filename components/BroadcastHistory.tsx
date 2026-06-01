import React, { useState, useEffect } from 'react';
import { getNotificationLogs } from '../services/api';
import { NotificationLog } from '../types';
import Loader from './Loader';

interface BroadcastHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    eventId?: string;
}

const BroadcastHistory: React.FC<BroadcastHistoryProps> = ({ isOpen, onClose, eventId }) => {
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const loadLogs = async () => {
                setIsLoading(true);
                try {
                    const data = await getNotificationLogs(eventId);
                    setLogs(data);
                } catch (err) {
                    console.error('Erro ao carregar logs:', err);
                } finally {
                    setIsLoading(false);
                }
            };
            loadLogs();
        }
    }, [isOpen, eventId]);

    const exportToCSV = () => {
        if (logs.length === 0) return;

        const headers = ['Data', 'Evento', 'Local do Evento', 'Tipo Destinatário', 'Canal', 'Status', 'Mensagem', 'Erro'];
        const csvRows = logs.map(log => [
            new Date(log.created_at).toLocaleString('pt-BR'),
            log.agenda?.titulo || 'N/A',
            log.agenda?.local || 'N/A',
            log.recipient_name || 'N/A',
            log.recipient_phone || 'N/A',
            log.recipient_type.toUpperCase(),
            log.channel.toUpperCase(),
            log.status === 'sent' ? 'Sucesso' : 'Erro',
            `"${log.content.replace(/"/g, '""')}"`,
            log.error_message || ''
        ]);

        const csvContent = [headers, ...csvRows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_disparos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10003] flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-navy-dark dark:text-white tracking-tight">Histórico de Disparos</h2>
                            <p className="text-sm text-slate-500 font-medium">Acompanhe o status das divulgações realizadas.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {logs.length > 0 && (
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all uppercase tracking-widest"
                                >
                                    <span className="material-symbols-outlined text-sm">download</span>
                                    Relatório CSV
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <span className="material-symbols-outlined text-slate-400">close</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="py-12 flex justify-center">
                            <Loader />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-12 text-center space-y-4">
                            <div className="size-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto">
                                <span className="material-symbols-outlined text-slate-300 text-3xl">history</span>
                            </div>
                            <p className="text-slate-500 font-medium">Nenhum disparo registrado ainda.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-black text-navy-dark dark:text-white group-hover:text-turquoise transition-colors">
                                                {log.agenda?.titulo || 'Evento não identificado'}
                                            </h4>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-slate-400 text-[16px]">person</span>
                                                <span className="text-xs font-black text-navy-dark dark:text-white">
                                                    {log.recipient_name || 'Destinatário'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-lg">
                                                <span className="material-symbols-outlined text-slate-400 text-[14px]">call</span>
                                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                                                    {log.recipient_phone}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${log.status === 'sent'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                }`}>
                                                {log.status === 'sent' ? 'Enviado' : 'Erro'}
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-tighter bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                {log.channel}
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">
                                                {log.recipient_type}
                                            </span>
                                        </div>

                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap italic leading-relaxed">
                                                "{log.content}"
                                            </p>
                                        </div>

                                        {log.error_message && (
                                            <p className="text-[10px] text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">
                                                Erro: {log.error_message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BroadcastHistory;
