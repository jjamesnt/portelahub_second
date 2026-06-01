import React, { useState, useEffect } from 'react';
import { broadcastEvent, getAssessores, getLiderancas } from '../services/api';
import { Assessor, Lideranca, EventoAgenda } from '../types';
import Loader from './Loader';
import ErrorModal from './ErrorModal';

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: EventoAgenda;
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose, event }) => {
    const [channel, setChannel] = useState<'whatsapp' | 'sms'>('sms');
    const [recipients, setRecipients] = useState<{
        assessores: boolean;
        liderancas: boolean;
        apoiadores: boolean;
        all: boolean;
    }>({
        assessores: true,
        liderancas: false,
        apoiadores: false,
        all: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [assessores, setAssessores] = useState<Assessor[]>([]);
    const [liderancas, setLiderancas] = useState<Lideranca[]>([]);
    const [success, setSuccess] = useState(false);
    const [errorDetails, setErrorDetails] = useState<{ title: string; message: string; tech?: string } | null>(null);

    const [extraNumbers, setExtraNumbers] = useState('');

    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                setIsLoading(true);
                try {
                    const [a, l] = await Promise.all([getAssessores(), getLiderancas()]);
                    setAssessores(a);
                    setLiderancas(l);
                } catch (err) {
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            };
            loadData();
        }
    }, [isOpen]);

    const handleSend = async () => {
        setIsSending(true);
        try {
            const selectedRecipients: any[] = [];

            // Adicionar destinatários da base
            if (recipients.all) {
                assessores.forEach(a => selectedRecipients.push({ id: a.id, name: a.nome, phone: a.telefone || '', type: 'assessor' }));
                liderancas.forEach(l => selectedRecipients.push({ id: l.id, name: l.nome, phone: l.contato || '', type: 'lideranca' }));
            } else {
                if (recipients.assessores) {
                    assessores.forEach(a => selectedRecipients.push({ id: a.id, name: a.nome, phone: a.telefone || '', type: 'assessor' }));
                }
                if (recipients.liderancas) {
                    liderancas.forEach(l => selectedRecipients.push({ id: l.id, name: l.nome, phone: l.contato || '', type: 'lideranca' }));
                }
            }

            // Adicionar números avulsos
            if (extraNumbers.trim()) {
                const manualPhones = extraNumbers
                    .split(/[,\n;]/)
                    .map(n => n.trim())
                    .filter(n => n.length >= 8); // Filtra números válidos mínimos

                manualPhones.forEach((phone, index) => {
                    selectedRecipients.push({
                        id: `manual-${index}`,
                        name: `Manual: ${phone}`,
                        phone: phone,
                        type: 'avulso'
                    });
                });
            }

            const validRecipients = selectedRecipients.filter(r => r.phone);

            if (validRecipients.length === 0) {
                alert("Nenhum destinatário com telefone encontrado.");
                return;
            }

            const mapUrl = event.local ? `https://maps.google.com/?q=${encodeURIComponent(event.local)}` : '';
            const message = `Portela App informa:\n\n*Agenda: ${event.titulo}*\n📅 ${new Date(event.data).toLocaleDateString('pt-BR')} ${event.hora !== 'Dia Inteiro' ? `às ${event.hora}` : ''}\n📍 ${event.local}${mapUrl ? `\n🗺️ Mapa: ${mapUrl}` : ''}\n${event.descricao ? `\n${event.descricao}` : ''}`;

            await broadcastEvent({
                eventId: event.id,
                recipients: validRecipients,
                channel,
                message
            });

            setSuccess(true);
            setExtraNumbers('');
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setErrorDetails({
                title: "Falha no Envio",
                message: "Não foi possível enviar as mensagens. Verifique os destinatários ou entre em contato com o suporte.",
                tech: `Error: ${err.message || 'Unknown Error'} | EventID: ${event.id} | Channel: ${channel}`
            });
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] flex flex-col">
                {/* Header fixo */}
                <div className="p-8 pb-0 shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-navy-dark dark:text-white tracking-tight">Divulgar Evento</h2>
                            <p className="text-sm text-slate-500 font-medium">Selecione o canal e o público-alvo.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-slate-400">close</span>
                        </button>
                    </div>
                </div>

                <div className="p-8 pt-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    {success ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-300">
                            <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-emerald-500">check_circle</span>
                            </div>
                            <p className="text-lg font-black text-navy-dark dark:text-white">Mensagens enviadas!</p>
                        </div>
                    ) : (
                        <>
                            {/* Escolha do Canal */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    disabled
                                    className="flex flex-col items-center justify-center gap-1 px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 opacity-60 cursor-not-allowed relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xl">chat</span>
                                        <span className="font-bold">WhatsApp</span>
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-tighter bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500">Em breve</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setChannel('sms')}
                                    className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all ${channel === 'sms' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500'}`}
                                >
                                    <span className="material-symbols-outlined text-2xl">sms</span>
                                    <span className="font-bold">SMS</span>
                                </button>
                            </div>

                            {/* Seleção de Público */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Público Alvo</p>
                                <div className="grid grid-cols-1 gap-2">
                                    <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:brightness-95 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={recipients.all}
                                            onChange={(e) => setRecipients({ ...recipients, all: e.target.checked })}
                                            className="size-5 rounded-md border-slate-300 dark:border-slate-600 text-turquoise focus:ring-turquoise"
                                        />
                                        <span className="font-bold text-navy-dark dark:text-white text-sm">Enviar para Todos (Base Completa)</span>
                                    </label>

                                    {!recipients.all && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={recipients.assessores}
                                                    onChange={(e) => setRecipients({ ...recipients, assessores: e.target.checked })}
                                                    className="size-4 rounded text-turquoise"
                                                />
                                                <span className="font-medium text-navy-dark dark:text-white text-xs">Assessores</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={recipients.liderancas}
                                                    onChange={(e) => setRecipients({ ...recipients, liderancas: e.target.checked })}
                                                    className="size-4 rounded text-turquoise"
                                                />
                                                <span className="font-medium text-navy-dark dark:text-white text-xs">Lideranças</span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Envio Avulso */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Envio Avulso (Opcional)</label>
                                <textarea
                                    value={extraNumbers}
                                    onChange={(e) => setExtraNumbers(e.target.value)}
                                    placeholder="Ex: 31999999999, 31888888888..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white min-h-[80px] resize-none"
                                />
                                <p className="text-[9px] text-slate-400 italic">Separe os números por vírgula, ponto e vírgula ou nova linha.</p>
                            </div>

                            {/* Preview da Mensagem */}
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Preview da Mensagem</p>
                                <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 max-h-32 overflow-y-auto">
                                    {(() => {
                                        const mapUrl = event.local ? `https://maps.google.com/?q=${encodeURIComponent(event.local)}` : '';
                                        return `Portela App informa:\n\n*Agenda: ${event.titulo}*\n📅 ${new Date(event.data).toLocaleDateString('pt-BR')} ${event.hora !== 'Dia Inteiro' ? `às ${event.hora}` : ''}\n📍 ${event.local}${mapUrl ? `\n🗺️ Mapa: ${mapUrl}` : ''}\n${event.descricao ? `\n${event.descricao}` : ''}`;
                                    })()}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer fixo */}
                {!success && (
                    <div className="p-8 pt-0 shrink-0">
                        <button
                            onClick={handleSend}
                            disabled={isSending || isLoading}
                            className="w-full py-4 bg-turquoise text-white rounded-2xl font-black text-sm hover:brightness-110 transition-all shadow-xl shadow-turquoise/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSending ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Enviando...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">send</span>
                                    <span>Confirmar Disparo</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            <ErrorModal 
                isOpen={!!errorDetails}
                onClose={() => setErrorDetails(null)}
                title={errorDetails?.title || ''}
                message={errorDetails?.message || ''}
                technicalDetails={errorDetails?.tech}
            />
        </div>
    );
};

export default BroadcastModal;
