
import React from 'react';
import { Apoiador } from '../types';

interface ApoiadoresReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    apoiadores: Apoiador[];
    filtrosativos: {
        busca: string;
        regiao: string;
        assessor: string;
        statusPrefeito: string;
    };
    usuarioNome?: string;
}

const ApoiadoresReportModal: React.FC<ApoiadoresReportModalProps> = ({ isOpen, onClose, apoiadores, filtrosativos, usuarioNome }) => {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const dataAtual = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Lógica de Paginação: 12 registros por página para A4 Paisagem (evita cortes no rodapé)
    const itemsPerPage = 12;
    const pages = [];
    for (let i = 0; i < apoiadores.length; i += itemsPerPage) {
        pages.push(apoiadores.slice(i, i + itemsPerPage));
    }

    // Caso não haja apoiadores, mostrar pelo menos uma página vazia com os filtros
    if (pages.length === 0) pages.push([]);

    return (
        <div id="report-canvas" className="fixed inset-0 z-[3000] flex flex-col bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300 print:absolute print:inset-0 print:bg-white print:z-0">
            {/* Toolbar - Oculta na impressão */}
            <div className="flex items-center justify-between p-4 bg-navy-dark text-white border-b border-white/10 no-print">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-xs font-bold uppercase tracking-widest">Voltar</span>
                    </button>
                    <div className="h-6 w-px bg-white/20" />
                    <h3 className="text-lg font-black tracking-tight">Relatório de Gestão <span className="text-indigo-400 ml-2">A4 Paisagem</span></h3>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <p className="text-[10px] font-black uppercase text-indigo-300 leading-tight">{apoiadores.length} Registros</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">{pages.length} Página(s)</p>
                    </div>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined">print</span>
                        Gerar PDF / Imprimir
                    </button>
                </div>
            </div>

            {/* Viewport de Pré-visualização */}
            <div className="flex-1 overflow-auto p-4 md:p-12 flex flex-col items-center gap-12 bg-slate-800 dark:bg-slate-950 print:bg-white print:p-0 print:block">
                
                {/* CSS de Impressão de Alta Precisão */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        @page { 
                            size: landscape; 
                            margin: 0; 
                        }
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            animation: none !important;
                            transition: none !important;
                            opacity: 1 !important;
                        }
                        html, body {
                            width: 297mm !important;
                            height: auto !important;
                            overflow: visible !important;
                            background: white !important;
                            visibility: hidden;
                        }
                        #report-canvas, .page-sheet, .page-sheet * {
                            visibility: visible !important;
                        }
                        #report-canvas {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 297mm !important;
                            height: auto !important;
                            display: block !important;
                            overflow: visible !important;
                        }
                        .page-sheet {
                            position: relative !important;
                            margin: 0 !important;
                            padding: 15mm !important;
                            box-shadow: none !important;
                            border: none !important;
                            width: 297mm !important;
                            height: 209mm !important;
                            display: flex !important;
                            flex-direction: column !important;
                            page-break-after: always !important;
                            break-after: page !important;
                        }
                        .no-print { 
                            display: none !important; 
                            visibility: hidden !important;
                        }
                    }
                `}} />

                {pages.map((pageItems, pageIdx) => (
                    <div 
                        key={pageIdx}
                        className="page-sheet bg-white text-slate-900 w-[1120px] h-[793px] flex flex-col shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-[15mm] relative overflow-hidden"
                    >
                        {/* Header da Página */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-[28px] text-indigo-600">hub</span>
                                    <h1 className="text-2xl font-black tracking-tighter text-navy-dark">PORTELA<span className="text-indigo-600">APP</span></h1>
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Gestão Política e Estratégica</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-lg font-black text-slate-900 uppercase">Relatório de Apoiadores</h2>
                                <p className="text-[10px] font-bold text-slate-600">Gerado em: {dataAtual}</p>
                                {usuarioNome && (
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">Emitido por: {usuarioNome}</p>
                                )}
                            </div>
                        </div>

                        {pageIdx === 0 && (
                            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">Região</span>
                                    <span className="text-[10px] font-bold text-slate-800">{filtrosativos.regiao}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">Responsável</span>
                                    <span className="text-[10px] font-bold text-slate-800">{filtrosativos.assessor}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">Prefeitura</span>
                                    <span className="text-[10px] font-bold text-slate-800">{filtrosativos.statusPrefeito}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">Total Geral</span>
                                    <span className="text-[10px] font-bold text-slate-800">{apoiadores.length} registros</span>
                                </div>
                            </div>
                        )}

                        {/* Tabela */}
                        <div className="flex-1 overflow-hidden">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr className="border-y-2 border-slate-900 bg-slate-50">
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[18%]">Apoiador / Cargo</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[15%]">Cidade / Região</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[12%]">Responsável</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[12%]">Contato</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[13%]">Político</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[10%]">Votos (A/L)</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[20%]">Principal Demanda</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map((a, idx) => (
                                        <tr key={a.id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                            <td className="py-2.5 px-2 align-top">
                                                <p className="text-[10px] font-black text-slate-900 leading-tight break-words">{a.nome}</p>
                                                <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-tighter">{a.cargo || '—'}</p>
                                            </td>
                                            <td className="py-2.5 px-2 align-top">
                                                <p className="text-[10px] font-bold text-slate-800 uppercase break-words">{a.municipio?.nome || '—'}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase">Região: {a.municipio?.regiao || '—'}</p>
                                            </td>
                                            <td className="py-2.5 px-2 align-top">
                                                <p className="text-[10px] font-bold text-slate-700 break-words">{(a as any).assessor?.nome || '—'}</p>
                                            </td>
                                            <td className="py-2.5 px-2 align-top">
                                                <p className="text-[9px] font-bold text-slate-700">{a.telefone || '—'}</p>
                                                <p className="text-[8px] text-slate-500 lowercase break-all">{a.email || ''}</p>
                                            </td>
                                            <td className="py-2.5 px-2 align-top">
                                                <div className="flex flex-col gap-0.5">
                                                    {a.municipio?.statusPrefeito && (
                                                        <span className="text-[8px] font-black uppercase text-indigo-600 leading-none">{a.municipio?.statusPrefeito}</span>
                                                    )}
                                                    {a.municipio?.idene && (
                                                        <span className="text-[8px] font-black uppercase text-emerald-600 leading-none">IDENE: SIM</span>
                                                    )}
                                                    {a.municipio?.lincolnFechado && (
                                                        <span className="text-[8px] font-black uppercase text-rose-600 leading-none">Lincoln Fechado</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-2 align-top">
                                                <p className="text-[10px] font-black text-slate-900 whitespace-nowrap">
                                                    {(a.municipio?.votacaoAle || 0).toLocaleString('pt-BR')} <span className="text-slate-300 mx-0.5">|</span> {(a.municipio?.votacaoLincoln || 0).toLocaleString('pt-BR')}
                                                </p>
                                            </td>
                                            <td className="py-2.5 px-2 align-top">
                                                <p className="text-[9px] font-medium text-slate-600 italic leading-tight break-words">
                                                    {a.municipio?.principalDemanda || '—'}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer da Página */}
                        <div className="mt-auto pt-4 border-t border-slate-200 flex justify-between items-center opacity-50">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Documento Gerado via Portela App - Sistema de Gestão Estratégica</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                Página {pageIdx + 1} de {pages.length}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ApoiadoresReportModal;
