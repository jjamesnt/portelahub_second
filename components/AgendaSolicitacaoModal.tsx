import React, { useState, useEffect, useRef } from 'react';
import { createSolicitacaoAgenda, updateSolicitacaoAgenda, getLiderancas, getAssessores, createNotificacao } from '../services/api';
import { SolicitacaoAgenda, Lideranca, Assessor } from '../types';
import { useAppContext } from '../hooks/useAppContext';

interface AgendaSolicitacaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    navigateTo: (page: string, params?: { [key: string]: any }) => void;
    solicitacaoToEdit?: SolicitacaoAgenda;
}

const AgendaSolicitacaoModal: React.FC<AgendaSolicitacaoModalProps> = ({ isOpen, onClose, onSuccess, navigateTo, solicitacaoToEdit }) => {
    // Hooks MUST be declared at the top level
    const { user } = useAppContext();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<string[]>([]);

    const [liderancas, setLiderancas] = useState<Lideranca[]>([]);
    const [assessores, setAssessores] = useState<Assessor[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredLiderancas, setFilteredLiderancas] = useState<Lideranca[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);

    const [selectedOrigens, setSelectedOrigens] = useState<string[]>(['Alê Portela']);

    const [formData, setFormData] = useState({
        solicitante: '',
        assessor_responsavel: '',
        estimativa_publico: '',
        titulo: '',
        data: '',
        hora_inicio: '',
        hora_fim: '',
        horario_chegada: '',
        local: '',
        tipo_evento: '' as any,
        tipo_local: '' as any,
        tempo_participacao: '',
        descricao: ''
    });

    useEffect(() => {
        if (solicitacaoToEdit) {
            setFormData({
                solicitante: solicitacaoToEdit.solicitante || '',
                assessor_responsavel: solicitacaoToEdit.assessor_responsavel || '',
                estimativa_publico: solicitacaoToEdit.estimativa_publico?.toString() || '',
                titulo: solicitacaoToEdit.titulo || '',
                data: solicitacaoToEdit.data || '',
                hora_inicio: solicitacaoToEdit.hora_inicio ? solicitacaoToEdit.hora_inicio.slice(0, 5) : '',
                hora_fim: solicitacaoToEdit.hora_fim ? solicitacaoToEdit.hora_fim.slice(0, 5) : '',
                horario_chegada: solicitacaoToEdit.horario_chegada ? solicitacaoToEdit.horario_chegada.slice(0, 5) : '',
                local: solicitacaoToEdit.local || '',
                tipo_evento: solicitacaoToEdit.tipo_evento || '',
                tipo_local: solicitacaoToEdit.tipo_local || '',
                tempo_participacao: solicitacaoToEdit.tempo_participacao || '',
                descricao: solicitacaoToEdit.descricao || ''
            });
            if (solicitacaoToEdit.solicitante) {
                setSearchTerm(solicitacaoToEdit.solicitante);
            }
            if (solicitacaoToEdit.origem) {
                setSelectedOrigens(solicitacaoToEdit.origem.split(',').map(s => s.trim()));
            }
        } else {
            setFormData({
                solicitante: '',
                assessor_responsavel: '',
                estimativa_publico: '',
                titulo: '',
                data: '',
                hora_inicio: '',
                hora_fim: '',
                horario_chegada: '',
                local: '',
                tipo_evento: '',
                tipo_local: '',
                tempo_participacao: '',
                descricao: ''
            });
            setSearchTerm('');
            setSelectedOrigens(['Alê Portela']);
        }
    }, [solicitacaoToEdit, isOpen]);

    const assessorRef = useRef<HTMLSelectElement>(null);
    const solicitanteRef = useRef<HTMLInputElement>(null);
    const tituloRef = useRef<HTMLInputElement>(null);
    const dataRef = useRef<HTMLInputElement>(null);
    const horaInicioRef = useRef<HTMLInputElement>(null);
    const horaFimRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setIsLoadingData(true);
                try {
                    const [leaders, staff] = await Promise.all([
                        getLiderancas(),
                        getAssessores()
                    ]);
                    setLiderancas(leaders);
                    setAssessores(staff);
                } catch (err) {
                    console.error('Erro ao carregar dados do formulário:', err);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setFilteredLiderancas([]);
            return;
        }

        const normalize = (text: string) =>
            text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        const search = normalize(searchTerm);
        const matches = liderancas.filter(l =>
            normalize(l.nome).includes(search) ||
            normalize(l.municipio).includes(search)
        );
        setFilteredLiderancas(matches.slice(0, 5));
    }, [searchTerm, liderancas]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Conditional return AFTER all hooks
    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when typing
        if (formErrors.includes(name)) {
            setFormErrors(prev => prev.filter(f => f !== name));
        }
    };

    const handleOrigemToggle = (origem: string) => {
        setSelectedOrigens(prev =>
            prev.includes(origem)
                ? prev.filter(o => o !== origem)
                : [...prev, origem]
        );
    };

    const handleSelectLideranca = (l: Lideranca) => {
        setFormData(prev => ({ ...prev, solicitante: l.nome }));
        setSearchTerm(l.nome);
        setShowSuggestions(false);
        if (formErrors.includes('solicitante')) {
            setFormErrors(prev => prev.filter(f => f !== 'solicitante'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = [];
        if (!formData.assessor_responsavel) errors.push('assessor');
        if (!formData.solicitante?.trim()) errors.push('solicitante');
        if (!formData.titulo?.trim()) errors.push('titulo');
        if (!formData.data) errors.push('data');
        if (!formData.hora_inicio) errors.push('hora_inicio');
        if (!formData.hora_fim) errors.push('hora_fim');

        if (selectedOrigens.length === 0) {
            setError('Selecione pelo menos uma pessoa para a agenda (Alê ou Lincoln).');
            return;
        }

        setFormErrors(errors);

        if (errors.length > 0) {
            if (errors.includes('assessor')) assessorRef.current?.focus();
            else if (errors.includes('solicitante')) solicitanteRef.current?.focus();
            else if (errors.includes('titulo')) tituloRef.current?.focus();
            else if (errors.includes('data')) dataRef.current?.focus();
            else if (errors.includes('hora_inicio')) horaInicioRef.current?.focus();
            else if (errors.includes('hora_fim')) horaFimRef.current?.focus();
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const payload = {
                solicitante: formData.solicitante,
                titulo: formData.titulo,
                data: formData.data,
                hora_inicio: formData.hora_inicio,
                hora_fim: formData.hora_fim,
                horario_chegada: formData.horario_chegada || undefined,
                local: formData.local,
                descricao: formData.descricao,
                origem: selectedOrigens.join(', '),
                assessor_responsavel: formData.assessor_responsavel,
                estimativa_publico: formData.estimativa_publico ? parseInt(formData.estimativa_publico) : undefined,
                tipo_evento: formData.tipo_evento || undefined,
                tipo_local: formData.tipo_local || undefined,
                tempo_participacao: formData.tempo_participacao || undefined
            } as any;

            if (solicitacaoToEdit?.id) {
                if (solicitacaoToEdit.status === 'Recusado') {
                    payload.resubmissoes = (solicitacaoToEdit.resubmissoes || 0) + 1;
                }
                await updateSolicitacaoAgenda(solicitacaoToEdit.id, payload);
                
                // Disparar notificação para quem recusou a solicitação originalmente, indicando nova revisão
                if (solicitacaoToEdit.status === 'Recusado' && solicitacaoToEdit.recusado_por) {
                    await createNotificacao(
                        solicitacaoToEdit.recusado_por,
                        'Solicitação Reenviada',
                        `A solicitação "${solicitacaoToEdit.titulo}" foi editada e reenviada.`,
                        `/agenda?solicitacao_id=${solicitacaoToEdit.id}`
                    );
                }
            } else {
                await createSolicitacaoAgenda({ ...payload, criado_por: user?.id });
            }
            
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                solicitante: '',
                assessor_responsavel: '',
                estimativa_publico: '',
                titulo: '',
                data: '',
                hora_inicio: '',
                hora_fim: '',
                horario_chegada: '',
                local: '',
                tipo_evento: '',
                tipo_local: '',
                tempo_participacao: '',
                descricao: ''
            });
            setSearchTerm('');
            setSelectedOrigens(['Alê Portela']);
            setFormErrors([]);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar solicitação');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10002] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-turquoise/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-turquoise">calendar_add_on</span>
                        </div>
                        <h3 className="font-black text-xl text-navy-dark dark:text-white">Solicitar Agenda</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Assessor Responsável */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Assessor Responsável <span className="text-rose-500">*</span></label>
                        <select
                            ref={assessorRef}
                            name="assessor_responsavel"
                            value={formData.assessor_responsavel}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('assessor') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-turquoise/20 focus:border-turquoise transition-all dark:text-white`}
                        >
                            <option value="">Selecione o assessor...</option>
                            {assessores.map(a => (
                                <option key={a.id} value={a.nome}>{a.nome} ({a.regiaoAtuacao})</option>
                            ))}
                        </select>
                    </div>

                    {/* Solicitante */}
                    <div className="relative" ref={searchRef}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">person_search</span>
                            Quem está solicitando? <span className="text-rose-500">*</span>
                        </label>
                        <input
                            ref={solicitanteRef}
                            type="text"
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setFormData(prev => ({ ...prev, solicitante: e.target.value }));
                                setShowSuggestions(true);
                                if (formErrors.includes('solicitante')) setFormErrors(prev => prev.filter(f => f !== 'solicitante'));
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="Buscar liderança ou digitar nome..."
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('solicitante') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-turquoise/20 focus:border-turquoise transition-all dark:text-white`}
                        />
                        {showSuggestions && filteredLiderancas.length > 0 && (
                            <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-150">
                                {filteredLiderancas.map(l => (
                                    <button
                                        key={l.id}
                                        type="button"
                                        onClick={() => handleSelectLideranca(l)}
                                        className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-none"
                                    >
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{l.nome}</p>
                                        <p className="text-[10px] text-slate-400">{l.municipio} - {l.regiao}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">diversity_3</span>
                            Para quem é a agenda? *
                        </label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => handleOrigemToggle('Alê Portela')}
                                className={`flex-1 flex items-center gap-3 p-3 border rounded-xl transition-all ${selectedOrigens.includes('Alê Portela') ? 'bg-turquoise/10 border-turquoise shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}
                            >
                                <div className={`size-5 rounded border flex items-center justify-center ${selectedOrigens.includes('Alê Portela') ? 'border-turquoise bg-turquoise text-white' : 'border-slate-300 bg-white dark:bg-slate-800'}`}>
                                    {selectedOrigens.includes('Alê Portela') && <span className="material-symbols-outlined text-[14px] font-black">check</span>}
                                </div>
                                <span className={`text-sm font-bold ${selectedOrigens.includes('Alê Portela') ? 'text-turquoise' : 'text-slate-500'}`}>Alê Portela</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleOrigemToggle('Lincoln Portela')}
                                className={`flex-1 flex items-center gap-3 p-3 border rounded-xl transition-all ${selectedOrigens.includes('Lincoln Portela') ? 'bg-blue-600/10 border-blue-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}
                            >
                                <div className={`size-5 rounded border flex items-center justify-center ${selectedOrigens.includes('Lincoln Portela') ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white dark:bg-slate-800'}`}>
                                    {selectedOrigens.includes('Lincoln Portela') && <span className="material-symbols-outlined text-[14px] font-black">check</span>}
                                </div>
                                <span className={`text-sm font-bold ${selectedOrigens.includes('Lincoln Portela') ? 'text-blue-600' : 'text-slate-500'}`}>Lincoln Portela</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Título do Compromisso <span className="text-rose-500">*</span></label>
                        <input
                            ref={tituloRef}
                            type="text"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleInputChange}
                            placeholder="Ex: Reunião de Alinhamento Político"
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('titulo') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-turquoise/20 focus:border-turquoise transition-all dark:text-white`}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">category</span>
                                Tipo de Evento
                            </label>
                            <select
                                name="tipo_evento"
                                value={formData.tipo_evento}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-turquoise/20 dark:text-white"
                            >
                                <option value="">Selecione...</option>
                                <option value="Evento formal (dispositivo de honra)">Evento formal (dispositivo de honra)</option>
                                <option value="Encontro">Encontro</option>
                                <option value="Reunião">Reunião</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">location_home</span>
                                Tipo de Local
                            </label>
                            <select
                                name="tipo_local"
                                value={formData.tipo_local}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-turquoise/20 dark:text-white"
                            >
                                <option value="">Selecione...</option>
                                <option value="Igreja">Igreja</option>
                                <option value="Casa/Apto">Casa/Apto</option>
                                <option value="Evento de rua">Evento de rua</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">event</span>
                                Data <span className="text-rose-500">*</span>
                            </label>
                            <input
                                ref={dataRef}
                                type="date"
                                name="data"
                                value={formData.data}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('data') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm dark:text-white`}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">login</span>
                                Horário de Chegada
                            </label>
                            <input
                                type="time"
                                name="horario_chegada"
                                value={formData.horario_chegada}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            Duração do Evento (Início - Fim) *
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                ref={horaInicioRef}
                                type="time"
                                name="hora_inicio"
                                value={formData.hora_inicio}
                                onChange={handleInputChange}
                                className={`flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('hora_inicio') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-xs dark:text-white`}
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                ref={horaFimRef}
                                type="time"
                                name="hora_fim"
                                value={formData.hora_fim}
                                onChange={handleInputChange}
                                className={`flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border ${formErrors.includes('hora_fim') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-xs dark:text-white`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Local / Endereço</label>
                        <input
                            type="text"
                            name="local"
                            value={formData.local}
                            onChange={handleInputChange}
                            placeholder="Ponto de referência ou endereço completo"
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Informações Adicionais</label>
                        <textarea
                            name="descricao"
                            value={formData.descricao}
                            onChange={handleInputChange}
                            placeholder="Pauta da reunião, observações importantes..."
                            rows={2}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-turquoise/20 transition-all dark:text-white resize-none"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-800 pb-2 z-10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-black hover:bg-slate-200 transition-all uppercase tracking-wider"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-4 py-3 bg-turquoise text-white rounded-xl text-sm font-black hover:brightness-110 shadow-lg shadow-turquoise/20 transition-all disabled:opacity-70 flex justify-center items-center gap-2 uppercase tracking-wider"
                        >
                            {isSaving ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">send</span>}
                            Enviar Solicitação
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AgendaSolicitacaoModal;
