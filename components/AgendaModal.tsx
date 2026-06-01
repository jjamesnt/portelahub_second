import React, { useState, useEffect } from 'react';
import { createEvento, updateEvento, deleteEvento, approveSolicitacao } from '../services/api';
import { EventoAgenda, SolicitacaoAgenda } from '../types';

interface AgendaModalProps {
    isOpen: boolean;
    initialDate?: string;
    eventToEdit?: EventoAgenda;
    solicitacaoToApprove?: SolicitacaoAgenda;
    onClose: () => void;
    onSuccess: () => void;
    onRefuse?: (s: SolicitacaoAgenda) => void;
}

const AgendaModal: React.FC<AgendaModalProps> = ({ isOpen, initialDate, eventToEdit, solicitacaoToApprove, onClose, onSuccess, onRefuse }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        titulo: '',
        data: '',
        hora: '',
        tipo: 'Reunião',
        origem: 'Alê Portela',
        privacidade: 'Público',
        local: '',
        descricao: '',
        observacoes_aprovacao: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (eventToEdit) {
                setFormData({
                    titulo: eventToEdit.titulo,
                    data: eventToEdit.data,
                    hora: eventToEdit.hora || '',
                    tipo: eventToEdit.tipo || 'Reunião',
                    origem: eventToEdit.origem || 'Alê Portela',
                    privacidade: eventToEdit.privacidade || 'Público',
                    local: eventToEdit.local || '',
                    descricao: eventToEdit.descricao || '',
                    observacoes_aprovacao: ''
                });
            } else if (solicitacaoToApprove) {
                setFormData({
                    titulo: solicitacaoToApprove.titulo,
                    data: solicitacaoToApprove.data ? solicitacaoToApprove.data.split('T')[0].split(' ')[0] : '',
                    hora: solicitacaoToApprove.hora_inicio || '',
                    tipo: (solicitacaoToApprove.tipo_evento?.includes('Evento') ? 'Evento Público' : 
                          solicitacaoToApprove.tipo_evento?.includes('Reunião') ? 'Reunião' : 'Reunião') as any,
                    origem: (solicitacaoToApprove.origem.includes('Alê') ? 'Alê Portela' : 
                            solicitacaoToApprove.origem.includes('Lincoln') ? 'Lincoln Portela' : 'Marilda Portela') as any,
                    privacidade: 'Público',
                    local: solicitacaoToApprove.local || '',
                    descricao: solicitacaoToApprove.descricao || '',
                    observacoes_aprovacao: ''
                });
            } else {
                setFormData({
                    titulo: '',
                    data: initialDate || new Date().toISOString().split('T')[0],
                    hora: '',
                    tipo: 'Reunião',
                    origem: 'Alê Portela',
                    privacidade: 'Público',
                    local: '',
                    descricao: '',
                    observacoes_aprovacao: ''
                });
            }
        }
    }, [isOpen, initialDate, eventToEdit, solicitacaoToApprove]);

    const [formErrors, setFormErrors] = useState<string[]>([]);
    const tituloRef = React.useRef<HTMLInputElement>(null);
    const dataRef = React.useRef<HTMLInputElement>(null);
    const horaRef = React.useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = [];
        if (!formData.titulo?.trim()) errors.push('titulo');
        if (!formData.data) errors.push('data');
        if (!formData.hora) errors.push('hora');

        setFormErrors(errors);

        if (errors.length > 0) {
            if (errors.includes('titulo')) tituloRef.current?.focus();
            else if (errors.includes('data')) dataRef.current?.focus();
            else if (errors.includes('hora')) horaRef.current?.focus();
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const payload = {
                titulo: formData.titulo,
                data: formData.data,
                hora: formData.hora,
                tipo: formData.tipo as any,
                origem: formData.origem as any,
                privacidade: formData.privacidade as any,
                local: formData.local,
                descricao: formData.descricao
            };

            if (eventToEdit?.id) {
                await updateEvento(eventToEdit.id, payload);
            } else if (solicitacaoToApprove) {
                await approveSolicitacao(solicitacaoToApprove.id, payload, formData.observacoes_aprovacao);
            } else {
                await createEvento(payload);
            }
            onSuccess();
            onClose();
            setFormData({
                titulo: '',
                data: '',
                hora: '',
                tipo: 'Reunião',
                origem: 'Alê Portela',
                privacidade: 'Público',
                local: '',
                descricao: '',
                observacoes_aprovacao: ''
            });
            setFormErrors([]);
        } catch (err: any) {
            setError(err.message || 'Erro ao criar evento');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!eventToEdit?.id || !window.confirm('Tem certeza que deseja excluir este evento?')) return;
        
        setIsSaving(true);
        try {
            await deleteEvento(eventToEdit.id);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Erro ao excluir evento');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10002] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200 border border-white/20">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    <div>
                        <h3 className="font-black text-xl text-navy-dark dark:text-white">
                            {eventToEdit ? 'Editar Evento' : solicitacaoToApprove ? 'Revisar e Aprovar' : 'Novo Evento'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {eventToEdit ? 'Atualizar agenda oficial' : solicitacaoToApprove ? 'Validar solicitação externa' : 'Adicionar à agenda oficial'}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Título do Evento <span className="text-rose-500">*</span></label>
                        <input
                            ref={tituloRef}
                            type="text"
                            name="titulo"
                            value={formData.titulo}
                            onChange={e => {
                                handleInputChange(e);
                                if (formErrors.includes('titulo')) setFormErrors(prev => prev.filter(f => f !== 'titulo'));
                            }}
                            placeholder="Ex: Reunião com Prefeito"
                            className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('titulo') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-turquoise/20 focus:border-turquoise transition-all dark:text-white`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data <span className="text-rose-500">*</span></label>
                            <input
                                ref={dataRef}
                                type="date"
                                name="data"
                                value={formData.data}
                                onChange={e => {
                                    handleInputChange(e);
                                    if (formErrors.includes('data')) setFormErrors(prev => prev.filter(f => f !== 'data'));
                                }}
                                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('data') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-turquoise/20 focus:border-turquoise transition-all dark:text-white`}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hora <span className="text-rose-500">*</span></label>
                            <input
                                ref={horaRef}
                                type="time"
                                name="hora"
                                value={formData.hora}
                                onChange={e => {
                                    handleInputChange(e);
                                    if (formErrors.includes('hora')) setFormErrors(prev => prev.filter(f => f !== 'hora'));
                                }}
                                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('hora') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-turquoise/20 focus:border-turquoise transition-all dark:text-white`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Privacidade</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, privacidade: 'Público' }))}
                                    className={`flex-1 py-2.5 px-2 rounded-2xl border text-[9px] font-black transition-all flex flex-col items-center gap-1 ${formData.privacidade === 'Público' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}
                                >
                                    <span className="material-symbols-outlined text-base">public</span>
                                    PÚBLICO
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, privacidade: 'Particular' }))}
                                    className={`flex-1 py-2.5 px-2 rounded-2xl border text-[9px] font-black transition-all flex flex-col items-center gap-1 ${formData.privacidade === 'Particular' ? 'bg-amber-50 border-amber-500 text-amber-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}
                                >
                                    <span className="material-symbols-outlined text-base">lock</span>
                                    PARTICULAR
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipo</label>
                            <select
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleInputChange}
                                className="w-full px-3 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-turquoise/20 focus:border-turquoise transition-all dark:text-white"
                            >
                                <option value="Reunião">Reunião</option>
                                <option value="Visita Técnica">Visita Técnica</option>
                                <option value="Evento Público">Evento Público</option>
                                <option value="Sessão Plenária">Sessão Plenária</option>
                                <option value="Festa/Comemoração">Festa/Comemoração</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Agenda de Origem *</label>
                        <div className="flex flex-wrap gap-2 p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, origem: 'Todos' }))}
                                className={`flex-1 min-w-[60px] py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${formData.origem === 'Todos'
                                    ? 'bg-navy-dark text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                Todos
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, origem: 'Lincoln Portela' }))}
                                className={`flex-1 min-w-[70px] py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${formData.origem === 'Lincoln Portela'
                                    ? 'bg-[#8db641] text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                Lincoln
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, origem: 'Alê Portela' }))}
                                className={`flex-1 min-w-[60px] py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${formData.origem === 'Alê Portela'
                                    ? 'bg-turquoise text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                Alê
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, origem: 'Marilda Portela' }))}
                                className={`flex-1 min-w-[70px] py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${formData.origem === 'Marilda Portela'
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                Marilda
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Local</label>
                        <input
                            type="text"
                            name="local"
                            value={formData.local}
                            onChange={handleInputChange}
                            placeholder="Câmara, Gabinete..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-turquoise/20 focus:border-turquoise transition-all dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                            {solicitacaoToApprove ? "Observações para o Solicitante" : "Descrição / Detalhes"}
                            {solicitacaoToApprove && <span className="text-turquoise text-[8px] font-bold ml-1">(Opcional)</span>}
                        </label>
                        <textarea
                            name={solicitacaoToApprove ? "observacoes_aprovacao" : "descricao"}
                            value={solicitacaoToApprove ? formData.observacoes_aprovacao : formData.descricao}
                            onChange={handleInputChange}
                            placeholder={solicitacaoToApprove ? "Mensagem que o solicitante receberá na notificação..." : "Detalhes adicionais..."}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-turquoise/20 focus:border-turquoise transition-all dark:text-white resize-none"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex flex-col gap-3">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black hover:bg-slate-200 dark:hover:bg-slate-600 transition-all uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex-1 px-4 py-4 bg-navy-dark dark:bg-turquoise text-white rounded-2xl text-xs font-black hover:brightness-110 shadow-lg transition-all disabled:opacity-70 flex justify-center items-center gap-2 uppercase tracking-widest"
                            >
                                {isSaving ? (
                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[20px]">check</span>
                                )}
                                {eventToEdit ? 'Salvar Alterações' : solicitacaoToApprove ? 'Aprovar Solicitação' : 'Salvar Evento'}
                            </button>
                        </div>
                        
                        {solicitacaoToApprove && (
                            <button
                                type="button"
                                onClick={() => {
                                    // Emitiremos um evento customizado ou passaremos via prop para abrir o modal de recusa
                                    // Para simplificar, vamos disparar o onClose com um flag ou apenas deixar para o pai gerenciar
                                    // Mas aqui no AgendaModal, o pai é o AgendaPage.
                                    // Vou adicionar uma nova prop opcional 'onRefuse'
                                    if (onRefuse) onRefuse(solicitacaoToApprove);
                                }}
                                disabled={isSaving}
                                className="w-full px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-sm">block</span>
                                Recusar esta Solicitação
                            </button>
                        )}
                        
                        {eventToEdit && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isSaving}
                                className="w-full px-4 py-3 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                Excluir Compromisso
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgendaModal;
