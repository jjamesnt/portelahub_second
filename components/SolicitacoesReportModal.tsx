
import React from 'react';
import { SolicitacaoAgenda } from '../types';

interface SolicitacoesReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    solicitacoes: SolicitacaoAgenda[];
    filtrosativos: {
        busca: string;
        tipo: string;
        status: string;
        origem: string;
        periodo: string;
        solicitante: string;
    };
    usuarioNome?: string;
}

const SolicitacoesReportModal: React.FC<SolicitacoesReportModalProps> = ({ isOpen, onClose, solicitacoes, filtrosativos, usuarioNome }) => {
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

    // Lógica de Paginação: 10 registros por página para A4 Paisagem (Agenda tem mais texto)
    const itemsPerPage = 10;
    const pages = [];
    for (let i = 0; i < solicitacoes.length; i += itemsPerPage) {
        pages.push(solicitacoes.slice(i, i + itemsPerPage));
    }

    if (pages.length === 0) pages.push([]);

    return (
        <div id="report-canvas-agenda" className="fixed inset-0 z-[3000] flex flex-col bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300 print:absolute print:inset-0 print:bg-white print:z-0">
            {/* Toolbar */}
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
                    <h3 className="text-lg font-black tracking-tight">Relatório de Solicitações <span className="text-turquoise ml-2">A4 Paisagem</span></h3>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <p className="text-[10px] font-black uppercase text-turquoise leading-tight">{solicitacoes.length} Registros</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">{pages.length} Página(s)</p>
                    </div>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2.5 bg-turquoise hover:bg-turquoise/80 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-turquoise/20 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined">print</span>
                        Gerar PDF / Imprimir
                    </button>
                </div>
            </div>

            {/* Viewport */}
            <div className="flex-1 overflow-auto p-4 md:p-12 flex flex-col items-center gap-12 bg-slate-800 dark:bg-slate-950 print:bg-white print:p-0 print:block">
                
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
                        #report-canvas-agenda, .page-sheet, .page-sheet * {
                            visibility: visible !important;
                        }
                        #report-canvas-agenda {
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
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-[28px] text-turquoise">hub</span>
                                    <h1 className="text-2xl font-black tracking-tighter text-navy-dark">PORTELA<span className="text-turquoise">APP</span></h1>
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Gestão de Agenda e Compromissos</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-lg font-black text-slate-900 uppercase">Relatório de Solicitações</h2>
                                <p className="text-[10px] font-bold text-slate-600">Gerado em: {dataAtual}</p>
                                {usuarioNome && (
                                    <p className="text-[10px] font-black text-turquoise uppercase tracking-tight">Emitido por: {usuarioNome}</p>
                                )}
                            </div>
                        </div>

                        {pageIdx === 0 && (
                            <div className="grid grid-cols-6 gap-4 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Busca</span>
                                    <span className="text-[10px] font-bold text-slate-800">{filtrosativos.busca || '—'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Solicitante</span>
                                    <span className="text-[10px] font-bold text-slate-800">{filtrosativos.solicitante}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Compromisso</span>
                                    <span className="text-[10px] font-bold text-slate-800">{filtrosativos.tipo}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Status</span>
                                    <span className="text-[10px] font-bold text-slate-800">{filtrosativos.status}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Origem</span>
                                    <span className="text-[10px] font-bold text-slate-800">{filtrosativos.origem}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Período</span>
                                    <span className="text-[10px] font-bold text-slate-800">{filtrosativos.periodo}</span>
                                </div>
                            </div>
                        )}

                        {/* Tabela */}
                        <div className="flex-1 overflow-hidden">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr className="border-y-2 border-slate-900 bg-slate-50">
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[15%]">Solicitante</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[20%]">Compromisso</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[10%] text-center">Data</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[10%] text-center">Horário</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[15%]">Local</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[10%] text-center">Status</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[10%] text-center">Origem</th>
                                        <th className="py-2.5 px-2 text-[9px] font-black uppercase tracking-wider text-slate-900 w-[10%] text-center">Público</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageItems.map((s, idx) => (
                                        <tr key={s.id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                            <td className="py-2.5 px-2 align-top">
                                                <p className="text-[10px] font-black text-slate-900 leading-tight break-words">{s.solicitante}</p>
                                            </td>
                                            <td className="py-2.5 px-2 align-top">
                                                <p className="text-[10px] font-bold text-slate-800 break-words leading-tight">{s.titulo}</p>
                                                {s.descricao && (
                                                    <p className="text-[8px] text-slate-500 italic mt-1 line-clamp-2">{s.descricao}</p>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-2 align-top text-center">
                                                <p className="text-[10px] font-bold text-slate-700">{new Date(s.data).toLocaleDateString('pt-BR')}</p>
                                            </td>
                                            <td className="py-2.5 px-2 align-top text-center">
                                                <p className="text-[9px] font-bold text-slate-700">{s.hora_inicio} - {s.hora_fim}</p>
                                            </td>
                                            <td className="py-2.5 px-2 align-top">
                                                <p className="text-[9px] text-slate-700 break-words">{s.local}</p>
                                            </td>
                                            <td className="py-2.5 px-2 align-top text-center">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                                    s.status === 'Aprovado' ? 'text-emerald-600 bg-emerald-50' : 
                                                    s.status === 'Recusado' ? 'text-rose-600 bg-rose-50' : 
                                                    'text-amber-600 bg-amber-50'
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-2 align-top text-center">
                                                <p className="text-[8px] font-bold text-navy-dark">{s.origem}</p>
                                            </td>
                                            <td className="py-2.5 px-2 align-top text-center">
                                                <p className="text-[9px] font-bold text-slate-600">{s.estimativa_publico || '—'}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
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

export default SolicitacoesReportModal;
