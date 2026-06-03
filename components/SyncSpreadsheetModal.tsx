import React, { useState, useContext } from 'react';
import { 
    syncSpreadsheetData, 
    syncLiderancasSpreadsheet,
    syncAssessoresSpreadsheet,
    syncRecursosSpreadsheet,
    syncDemandasSpreadsheet
} from '../services/api';
import { AppContext } from '../context/AppContext';

interface SyncSpreadsheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const SyncSpreadsheetModal: React.FC<SyncSpreadsheetModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const context = useContext(AppContext);
    
    // Alvo selecionado
    const [targetType, setTargetType] = useState<'apoiadores' | 'liderancas' | 'assessores' | 'recursos' | 'demandas'>('apoiadores');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // Links salvos localmente por tipo de destino
    const [syncUrlApoiadores, setSyncUrlApoiadores] = useState(localStorage.getItem('portela_hub_sync_url_apoiadores') || localStorage.getItem('portela_hub_sync_url') || '');
    const [syncUrlLiderancas, setSyncUrlLiderancas] = useState(localStorage.getItem('portela_hub_sync_url_liderancas') || '');
    const [syncUrlAssessores, setSyncUrlAssessores] = useState(localStorage.getItem('portela_hub_sync_url_assessores') || '');
    const [syncUrlRecursos, setSyncUrlRecursos] = useState(localStorage.getItem('portela_hub_sync_url_recursos') || '');
    const [syncUrlDemandas, setSyncUrlDemandas] = useState(localStorage.getItem('portela_hub_sync_url_demandas') || '');
    
    const [isSyncing, setIsSyncing] = useState(false);

    if (!isOpen) return null;

    const getUrlForType = (type: typeof targetType) => {
        switch (type) {
            case 'apoiadores': return syncUrlApoiadores;
            case 'liderancas': return syncUrlLiderancas;
            case 'assessores': return syncUrlAssessores;
            case 'recursos': return syncUrlRecursos;
            case 'demandas': return syncUrlDemandas;
        }
    };

    const currentUrl = getUrlForType(targetType);

    const handleUrlChange = (value: string) => {
        switch (targetType) {
            case 'apoiadores':
                setSyncUrlApoiadores(value);
                break;
            case 'liderancas':
                setSyncUrlLiderancas(value);
                break;
            case 'assessores':
                setSyncUrlAssessores(value);
                break;
            case 'recursos':
                setSyncUrlRecursos(value);
                break;
            case 'demandas':
                setSyncUrlDemandas(value);
                break;
        }
    };

    const handleSync = async () => {
        if (!currentUrl.trim()) {
            context?.showToast("Por favor, insira uma URL válida da planilha.", 'error');
            return;
        }

        try {
            setIsSyncing(true);
            let result;

            switch (targetType) {
                case 'apoiadores':
                    localStorage.setItem('portela_hub_sync_url_apoiadores', currentUrl.trim());
                    localStorage.setItem('portela_hub_sync_url', currentUrl.trim()); // Fallback retrocompatibilidade
                    result = await syncSpreadsheetData(currentUrl.trim());
                    context?.showToast(`Importação em Apoiadores bem-sucedida! ✅ ${result.success} processados, ❌ ${result.errors} erros.`, 'success');
                    break;
                case 'liderancas':
                    localStorage.setItem('portela_hub_sync_url_liderancas', currentUrl.trim());
                    result = await syncLiderancasSpreadsheet(currentUrl.trim());
                    context?.showToast(`Importação em Lideranças bem-sucedida! ✅ ${result.success} processados, ❌ ${result.errors} erros.`, 'success');
                    break;
                case 'assessores':
                    localStorage.setItem('portela_hub_sync_url_assessores', currentUrl.trim());
                    result = await syncAssessoresSpreadsheet(currentUrl.trim());
                    context?.showToast(`Importação em Assessores bem-sucedida! ✅ ${result.success} processados, ❌ ${result.errors} erros.`, 'success');
                    break;
                case 'recursos':
                    localStorage.setItem('portela_hub_sync_url_recursos', currentUrl.trim());
                    result = await syncRecursosSpreadsheet(currentUrl.trim());
                    context?.showToast(`Importação em Recursos bem-sucedida! ✅ ${result.success} processados, ❌ ${result.errors} erros.`, 'success');
                    break;
                case 'demandas':
                    localStorage.setItem('portela_hub_sync_url_demandas', currentUrl.trim());
                    result = await syncDemandasSpreadsheet(currentUrl.trim());
                    context?.showToast(`Importação em Demandas bem-sucedida! ✅ ${result.success} processados, ❌ ${result.errors} erros.`, 'success');
                    break;
            }

            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            localStorage.setItem('portela_hub_last_sync', now);

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            context?.showToast("Erro na sincronização: " + err.message, 'error');
            console.error("Erro no sync:", err);
        } finally {
            setIsSyncing(false);
        }
    };

    // Ícones e labels dos alvos
    const options = [
        { value: 'apoiadores', label: 'Guia Apoiadores', icon: 'volunteer_activism' },
        { value: 'liderancas', label: 'Guia Lideranças', icon: 'groups' },
        { value: 'assessores', label: 'Guia Assessores', icon: 'badge' },
        { value: 'recursos', label: 'Guia Recursos', icon: 'payments' },
        { value: 'demandas', label: 'Guia Demandas', icon: 'assignment' }
    ] as const;

    const instructionsMap = {
        apoiadores: {
            columns: [
                'Cidade', 'Nome apoiador', 'Status do Prefeito', 'Votação Alê',
                'Votação Lincoln', 'IDENE?', 'Lincoln Portela fechado?',
                'Status de atendimento', 'Tipo de atendimento', 'Principal Demanda',
                'Sugestão de Programa SEDESE', 'OBSERVAÇÃO', 'Assessor Resp.'
            ],
            description: 'Cadastra ou atualiza os apoiadores associando-os aos seus respectivos municípios.'
        },
        liderancas: {
            columns: [
                'Nome', 'Cidade', 'Partido', 'Cargo', 'Contato', 'Email', 'Status', 'Origem', 'Região'
            ],
            description: 'Cadastra ou atualiza líderes de bairros ou comunidades nas respectivas cidades.'
        },
        assessores: {
            columns: [
                'Nome', 'Email', 'Telefone', 'Região de Atuação', 'Cargo', 'Origem'
            ],
            description: 'Cadastra ou atualiza os assessores do gabinete vinculando suas áreas de atuação.'
        },
        recursos: {
            columns: [
                'Cidade', 'Tipo', 'Descrição', 'Valor', 'Origem', 'Status', 'Data de Aprovação', 'Responsável', 'Observações'
            ],
            description: 'Registra a alocação de emendas, veículos, obras ou equipamentos por município.'
        },
        demandas: {
            columns: [
                'Cidade', 'Título', 'Descrição', 'Status', 'Prioridade', 'Origem'
            ],
            description: 'Registra novas solicitações, projetos locais ou pendências municipais no banco.'
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10005] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center space-y-4">
                    <div className="size-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 mx-auto flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                        <span className="material-symbols-outlined text-3xl animate-pulse">upload_file</span>
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">Importação de Dados</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Configure o destino e o link da planilha para sincronizar os dados.
                        </p>
                    </div>

                    {/* Seletor de Destino Customizado */}
                    <div className="text-left space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Destino da Importação</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => !isSyncing && setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold outline-none text-slate-700 dark:text-slate-200 hover:border-slate-350 dark:hover:border-slate-650 transition-all flex items-center gap-2.5 relative shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[18px] text-indigo-500 shrink-0">
                                    {options.find(o => o.value === targetType)?.icon}
                                </span>
                                <span>{options.find(o => o.value === targetType)?.label}</span>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-200" style={{ transform: isDropdownOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}>
                                    keyboard_arrow_down
                                </span>
                            </button>

                            {isDropdownOpen && (
                                <>
                                    {/* Backdrop transparente para escuta de clique externo */}
                                    <div className="fixed inset-0 z-[10006]" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[10007] py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        {options.map(option => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    setTargetType(option.value);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full px-4 py-3 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                                                    targetType === option.value ? 'text-indigo-650 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20' : 'text-slate-650 dark:text-slate-300'
                                                }`}
                                            >
                                                <span className={`material-symbols-outlined text-[18px] shrink-0 ${targetType === option.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                                                    {option.icon}
                                                </span>
                                                <span className="flex-1">{option.label}</span>
                                                {targetType === option.value && (
                                                    <span className="material-symbols-outlined text-[16px] text-indigo-600 dark:text-indigo-400">check</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Input de URL */}
                    <div className="text-left space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Link da Planilha Publicada (Formato CSV)</label>
                        <input 
                            type="text"
                            placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                            value={currentUrl}
                            onChange={e => handleUrlChange(e.target.value)}
                            disabled={isSyncing}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-navy-dark dark:text-white disabled:opacity-50"
                        />
                    </div>

                    {/* Instruções de Formato Google Sheets Dinâmicas */}
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-4 text-left space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-500 text-sm">info</span>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Instruções Importantes</span>
                        </div>
                        
                        <p className="text-[10px] text-indigo-950/70 dark:text-indigo-300/80 leading-relaxed font-semibold">
                            Para funcionar perfeitamente, a sua planilha deve estar publicada na Web.
                            <br />
                            No Google Sheets, acesse:
                            <br />
                            <strong className="text-indigo-600 dark:text-indigo-400">Arquivo &gt; Compartilhar &gt; Publicar na Web</strong>.
                        </p>

                        <div className="space-y-1.5 border-t border-indigo-100/40 dark:border-indigo-900/25 pt-2">
                            <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Colunas Esperadas:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {instructionsMap[targetType].columns.map((col, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded text-[9px] font-bold">
                                        {col}
                                    </span>
                                ))}
                            </div>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 italic mt-1 font-medium leading-snug">
                                {instructionsMap[targetType].description}
                            </p>
                        </div>

                        <p className="text-[10px] text-indigo-950/70 dark:text-indigo-300/80 leading-relaxed font-semibold border-t border-indigo-100/40 dark:border-indigo-900/25 pt-2">
                            ⚠️ O formato de publicação ideal é:
                            <br />
                            <span className="px-2 py-0.5 mt-1 inline-block bg-emerald-500 text-white rounded font-black text-[9px] uppercase tracking-wider">
                                Valores separados por vírgula (.csv)
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSyncing ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                                    <span>Importando dados...</span>
                                </>
                            ) : (
                                <span>Iniciar Importação</span>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isSyncing}
                            className="w-full py-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SyncSpreadsheetModal;
