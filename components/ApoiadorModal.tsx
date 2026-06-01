
import React, { useState, useEffect } from 'react';
import { Apoiador, Municipio, Assessor } from '../types';
import { upsertApoiador, updateMunicipio, createMunicipio } from '../services/api';
import ImageUpload from './ImageUpload';
import votosData from '../public/data/votos_resumo.json';

interface ApoiadorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    municipio?: Municipio | null;
    allMunicipios?: Municipio[];
    allApoiadores?: Apoiador[];
    allAssessores?: Assessor[];
    editingApoiador?: Apoiador | null;
}

const ApoiadorModal: React.FC<ApoiadorModalProps> = ({ isOpen, onClose, onSuccess, municipio, allMunicipios, allApoiadores, allAssessores, editingApoiador }) => {
    const [formData, setFormData] = useState<any>({
        nome: '',
        cargo: '',
        telefone: '',
        endereco: '',
        email: '',
        fotoUrl: '',
        municipioId: municipio?.id || '',
        statusPrefeito: municipio?.statusPrefeito,
        lincolnFechado: municipio?.lincolnFechado,
        idene: municipio?.idene,
        statusAtendimento: municipio?.statusAtendimento,
        principalDemanda: municipio?.principalDemanda,
        sugestaoSedese: municipio?.sugestaoSedese,
        assessorId: municipio?.assessorId || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isCreatingMunicipio, setIsCreatingMunicipio] = useState(false);
    const [isChangingMunicipio, setIsChangingMunicipio] = useState(false);
    const [newMunicipioData, setNewMunicipioData] = useState({ nome: '', regiao: '' });

    // Autocomplete state
    const [munSearchTerm, setMunSearchTerm] = useState('');
    const [showMunSuggestions, setShowMunSuggestions] = useState(false);
    const munSearchRef = React.useRef<HTMLDivElement>(null);

    const selectedMunicipioApoiadores = formData.municipioId && allApoiadores 
        ? allApoiadores.filter(a => a.id !== editingApoiador?.id && a.municipioId === formData.municipioId)
        : [];

    useEffect(() => {
        setIsCreatingMunicipio(false);
        setNewMunicipioData({ nome: '', regiao: '' });

        if (editingApoiador) {
            const m = allMunicipios?.find(city => city.id === editingApoiador.municipioId);
            setFormData({
                ...editingApoiador,
                statusPrefeito: m?.statusPrefeito || '',
                lincolnFechado: m?.lincolnFechado || false,
                idene: m?.idene || false,
                statusAtendimento: m?.statusAtendimento || '',
                principalDemanda: m?.principalDemanda || '',
                sugestaoSedese: m?.sugestaoSedese || '',
                assessorId: m?.assessorId || ''
            });
            setMunSearchTerm(m?.nome || '');
        } else {
            setFormData({
                nome: '',
                cargo: '',
                telefone: '',
                endereco: '',
                email: '',
                fotoUrl: '',
                municipioId: municipio?.id || '',
                statusPrefeito: municipio?.statusPrefeito || '',
                lincolnFechado: municipio?.lincolnFechado || false,
                idene: municipio?.idene || false,
                statusAtendimento: municipio?.statusAtendimento || '',
                principalDemanda: municipio?.principalDemanda || '',
                sugestaoSedese: municipio?.sugestaoSedese || '',
                assessorId: municipio?.assessorId || ''
            });
            setMunSearchTerm(municipio?.nome || '');
        }
    }, [editingApoiador, municipio, isOpen, allMunicipios]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (munSearchRef.current && !munSearchRef.current.contains(event.target as Node)) {
                setShowMunSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const normalize = (text: string) =>
        text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const filteredMunicipios = allMunicipios
        ? allMunicipios
            .filter(m => {
                const search = normalize(munSearchTerm);
                return normalize(m.nome).includes(search) || 
                       normalize(m.regiao).includes(search);
            })
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .slice(0, 10)
        : [];

    if (!isOpen) return null;

    const handleSave = async () => {
        const anyFormData = formData as any;
        const validMunicipio = isCreatingMunicipio 
            ? (newMunicipioData.nome && newMunicipioData.regiao)
            : formData.municipioId;

        if (!formData.nome || !validMunicipio) return;
        setIsSaving(true);

        try {
            let targetMunicipioId = formData.municipioId;

            // 1. Criar novo município se aplicável
            if (isCreatingMunicipio) {
                const createdM = await createMunicipio({
                    nome: newMunicipioData.nome,
                    regiao: newMunicipioData.regiao,
                    status_atividade: 'Manutenção',
                    assessor_id: anyFormData.assessorId
                });
                targetMunicipioId = createdM.id;
            }

            // 2. Salvar Apoiador
            const payload = { ...formData, municipioId: targetMunicipioId };
            await upsertApoiador(payload);

            // 3. Espelhamento
            const mUpdates: any = {};
            if (anyFormData.statusPrefeito !== undefined) mUpdates.status_prefeito = anyFormData.statusPrefeito;
            if (anyFormData.votacaoAle !== undefined) mUpdates.votacao_ale = anyFormData.votacaoAle;
            if (anyFormData.votacaoLincoln !== undefined) mUpdates.votacao_lincoln = anyFormData.votacaoLincoln;
            if (anyFormData.principalDemanda !== undefined) mUpdates.principal_demanda = anyFormData.principalDemanda;
            if (anyFormData.sugestaoSedese !== undefined) mUpdates.sugestao_sedese = anyFormData.sugestaoSedese;
            if (anyFormData.lincolnFechado !== undefined) mUpdates.lincoln_fechado = anyFormData.lincolnFechado;
            if (anyFormData.idene !== undefined) mUpdates.idene = anyFormData.idene;
            if (anyFormData.statusAtendimento !== undefined) mUpdates.status_atendimento = anyFormData.statusAtendimento;
            if (anyFormData.assessorId !== undefined) mUpdates.assessor_id = anyFormData.assessorId;

            if (Object.keys(mUpdates).length > 0 && targetMunicipioId) {
                await updateMunicipio(targetMunicipioId, mUpdates);
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Erro ao salvar apoiador", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-8 pb-4 shrink-0 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-black text-navy-dark dark:text-white">
                                {editingApoiador ? 'Editar Apoiador' : 'Novo Apoiador'}
                            </h3>
                            {municipio && !isChangingMunicipio ? (
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{municipio.nome}</p>
                                    <button 
                                        onClick={() => setIsChangingMunicipio(true)}
                                        className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                    >
                                        (Trocar)
                                    </button>
                                </div>
                            ) : isChangingMunicipio || !municipio ? (
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px] text-indigo-500 animate-pulse">location_on</span>
                                    <p className="text-xs text-indigo-600 font-black uppercase tracking-wider">
                                        {munSearchTerm || 'Selecione o Município'}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 pt-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    {(!municipio || isChangingMunicipio) && allMunicipios && (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {isCreatingMunicipio ? 'Cadastrando Novas Informações de Município' : 'Selecione o Município para o Apoiador'}
                            </label>
                            
                            {!isCreatingMunicipio ? (
                                <div className="relative" ref={munSearchRef}>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
                                            <input
                                                type="text"
                                                value={munSearchTerm}
                                                onChange={e => {
                                                    setMunSearchTerm(e.target.value);
                                                    setShowMunSuggestions(true);
                                                    if (formData.municipioId) setFormData((prev: any) => ({ ...prev, municipioId: '' }));
                                                }}
                                                onFocus={() => setShowMunSuggestions(true)}
                                                placeholder="Busque o município..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-navy-dark dark:text-white"
                                            />
                                        </div>
                                        <div className="flex gap-1">
                                            {formData.municipioId && (
                                                <button 
                                                    onClick={() => setIsChangingMunicipio(false)}
                                                    className="px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                                                >
                                                    Confirmar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {showMunSuggestions && (munSearchTerm.length > 0 || filteredMunicipios.length > 0) && (
                                        <div className="absolute z-[100] left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                                            <div className="max-h-60 overflow-y-auto">
                                                {filteredMunicipios.map(m => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData((prev: any) => ({ 
                                                                ...prev, 
                                                                municipioId: m.id,
                                                                statusPrefeito: m.statusPrefeito || prev.statusPrefeito,
                                                                lincolnFechado: m.lincolnFechado || prev.lincolnFechado,
                                                                idene: m.idene || prev.idene,
                                                                statusAtendimento: m.statusAtendimento || prev.statusAtendimento,
                                                                principalDemanda: m.principalDemanda || prev.principalDemanda,
                                                                sugestaoSedese: m.sugestaoSedese || prev.sugestaoSedese
                                                            }));
                                                            setMunSearchTerm(m.nome);
                                                            setShowMunSuggestions(false);
                                                        }}
                                                        className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 flex flex-col border-b border-slate-100 dark:border-slate-700 last:border-0"
                                                    >
                                                        <span className="text-sm font-bold">{m.nome}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase">{m.regiao}</span>
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsCreatingMunicipio(true);
                                                        setShowMunSuggestions(false);
                                                        setNewMunicipioData(prev => ({ ...prev, nome: munSearchTerm }));
                                                    }}
                                                    className="w-full px-4 py-3 text-left hover:bg-indigo-50 text-indigo-600 italic"
                                                >
                                                    Cadastrar "{munSearchTerm || 'Novo Município'}"...
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                                    <input 
                                        type="text" 
                                        placeholder="Nome da Cidade"
                                        value={newMunicipioData.nome}
                                        onChange={e => setNewMunicipioData(prev => ({ ...prev, nome: e.target.value }))}
                                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                    />
                                    <div className="flex gap-2">
                                        <select 
                                            value={newMunicipioData.regiao}
                                            onChange={e => setNewMunicipioData(prev => ({ ...prev, regiao: e.target.value }))}
                                            className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                                        >
                                            <option value="">Região?</option>
                                            {['Central Mineira', 'Zona da Mata', 'Norte de Minas', 'Sul de Minas', 'Triângulo Mineiro', 'Alto Paranaíba', 'Oeste de Minas'].map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => setIsCreatingMunicipio(false)} className="px-3 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase">OK</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {formData.municipioId && !editingApoiador && selectedMunicipioApoiadores.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 p-3 rounded-xl text-xs">
                            <p className="font-black text-amber-800 mb-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">warning</span>
                                Apoiadores nesta cidade:
                            </p>
                            <ul className="space-y-1">
                                {selectedMunicipioApoiadores.map(a => (
                                    <li key={a.id} className="flex justify-between items-center">
                                        <span>{a.nome} ({a.cargo})</span>
                                        <button onClick={() => setFormData(a)} className="text-indigo-600 font-bold hover:underline">Editar</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                            <input 
                                type="text"
                                value={formData.nome || ''}
                                onChange={e => setFormData((prev: any) => ({ ...prev, nome: e.target.value }))}
                                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold"
                                placeholder="Nome do apoiador"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo / Função</label>
                            <input 
                                type="text"
                                value={formData.cargo || ''}
                                onChange={e => setFormData((prev: any) => ({ ...prev, cargo: e.target.value }))}
                                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold"
                                placeholder="Ex: Vereador..."
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <ImageUpload 
                            currentImage={formData.fotoUrl}
                            onImageSelected={(img) => setFormData((prev: any) => ({ ...prev, fotoUrl: img }))}
                        />
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Foto do Apoiador</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone</label>
                            <input 
                                type="text"
                                value={formData.telefone || ''}
                                onChange={e => setFormData((prev: any) => ({ ...prev, telefone: e.target.value }))}
                                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</label>
                            <input 
                                type="email"
                                value={formData.email || ''}
                                onChange={e => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
                                className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold"
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
                        <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-3">Dados Políticos</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Prefeito</label>
                                <select 
                                    value={formData.statusPrefeito || ''}
                                    onChange={e => setFormData((prev: any) => ({ ...prev, statusPrefeito: e.target.value }))}
                                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold"
                                >
                                    <option value="">Não informado</option>
                                    <option value="Prefeitura Parceira">Prefeitura Parceira</option>
                                    <option value="Prefeitura Fechada">Prefeitura Fechada</option>
                                    <option value="Não">Não</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lincoln Fechado?</label>
                                <select 
                                    value={formData.lincolnFechado ? 'Sim' : 'Não'}
                                    onChange={e => setFormData((prev: any) => ({ ...prev, lincolnFechado: e.target.value === 'Sim' }))}
                                    className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm font-bold"
                                >
                                    <option value="Não">Não</option>
                                    <option value="Sim">Sim</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal Demanda</label>
                        <textarea 
                            value={formData.principalDemanda || ''}
                            onChange={e => setFormData((prev: any) => ({ ...prev, principalDemanda: e.target.value }))}
                            className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-sm h-20 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 pt-4 shrink-0 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800">
                    <button onClick={onClose} className="px-6 py-2.5 text-xs font-black uppercase text-slate-400">Cancelar</button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || !formData.nome || !formData.municipioId}
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase shadow-xl disabled:opacity-50"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Apoiador'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApoiadorModal;
