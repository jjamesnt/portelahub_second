import React, { useEffect, useState } from 'react';
import { Recurso } from '../types';
import MandatoBadge from '../components/MandatoBadge';

interface ExtendedRecurso extends Recurso {
    municipio_nome: string;
    regiao: string;
}

const RecursosRelatorioPage: React.FC = () => {
    const [recursos, setRecursos] = useState<ExtendedRecurso[]>([]);
    const [filtrosAtivos, setFiltrosAtivos] = useState<{ [key: string]: string }>({});
    const [emissor, setEmissor] = useState('Sistema');
    const [dataEmissao] = useState(new Date().toLocaleString('pt-BR'));

    useEffect(() => {
        const storedData = sessionStorage.getItem('relatorio_recursos');
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData);
                // Suporte para nova estrutura com metadados e legado
                if (parsed.data && Array.isArray(parsed.data)) {
                    setRecursos(parsed.data);
                    setFiltrosAtivos(parsed.filters || {});
                    setEmissor(parsed.issuer || 'Sistema');
                } else {
                    setRecursos(parsed);
                }
            } catch (err) {
                console.error('Erro ao carregar dados do relatório:', err);
            }
        }
    }, []);

    const totalValor = recursos.reduce((acc, r) => acc + r.valor, 0);

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Relatório de Gestão de Recursos',
                    text: `Relatório de recursos totalizando ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValor)}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Erro ao compartilhar:', err);
            }
        } else {
            // Fallback: Copiar para área de transferência
            navigator.clipboard.writeText(window.location.href);
            alert('Link do relatório copiado para a área de transferência!');
        }
    };

    if (recursos.length === 0) {
        return (
            <div className="p-20 text-center flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-6xl text-slate-200">description</span>
                <p className="text-slate-500 font-medium">Nenhum dado encontrado para o relatório.</p>
                <button onClick={() => window.close()} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold">Fechar Aba</button>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen-dynamic text-slate-800 print:text-black w-full overflow-x-hidden">
            {/* Controles do Relatório - Ocultos na Impressão */}
            <div className="w-full max-w-[210mm] mx-auto py-6 flex flex-col sm:flex-row justify-between items-center print:hidden border-b border-slate-100 mb-8 px-4 gap-4">
                <button
                    onClick={() => window.close()}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold self-start sm:self-auto"
                >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    VOLTAR
                </button>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleShare}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200"
                    >
                        <span className="material-symbols-outlined text-base">share</span>
                        COMPARTILHAR
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-navy-dark text-white rounded-lg text-xs font-bold hover:brightness-110 shadow-lg"
                    >
                        <span className="material-symbols-outlined text-base">print</span>
                        IMPRIMIR A4
                    </button>
                </div>
            </div>

            {/* Conteúdo do Relatório - Largura Fixa A4 (210mm) com Margens de Segurança em Desktop */}
            <div className="w-full max-w-[210mm] mx-auto px-4 sm:px-12 py-8 sm:py-16 md:px-20 print:p-0 print:mx-0 print:max-w-none">
                {/* Cabeçalho Minimalista Expandido */}
                <div className="border-b-2 border-slate-900 pb-10 mb-12">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-navy-dark tracking-tight leading-none uppercase">Portela App</h1>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Relatório Consolidado de Gestão de Recursos</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável pela Emissão</p>
                            <p className="text-xs font-bold text-navy-dark uppercase">{emissor}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{dataEmissao}</p>
                        </div>
                    </div>

                    {/* Filtros Ativos (Se houver) */}
                    {Object.keys(filtrosAtivos).length > 0 && (
                        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-6 border-t border-slate-100">
                            {Object.entries(filtrosAtivos).map(([key, value]) => (
                                <div key={key} className="flex gap-2 items-baseline">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{key}:</span>
                                    <span className="text-[10px] font-bold text-navy-dark">{value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grid de Resumo Sem Sobreposição */}
                <div className="grid grid-cols-3 gap-10 mb-14">
                    <div className="border-l-2 border-turquoise pl-5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Consolidado</p>
                        <p className="text-xl font-black text-navy-dark">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValor)}
                        </p>
                    </div>
                    <div className="border-l-2 border-indigo-500 pl-5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Qtd. Destinações</p>
                        <p className="text-xl font-black text-navy-dark">{recursos.length}</p>
                    </div>
                    <div className="border-l-2 border-slate-300 pl-5 flex flex-col justify-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Abrangência</p>
                        <p className="text-[10px] font-bold text-slate-600 text-center uppercase tracking-tight">Dados Oficiais do Sistema</p>
                    </div>
                </div>

                {/* Tabela Organizada com Larguras Fixas Otimizadas */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg w-full">
                    <table className="w-full text-left border-collapse sm:table-fixed min-w-[600px] sm:min-w-0">
                        <thead>
                            <tr className="bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                                <th className="px-4 py-4 w-[20%]">Município</th>
                                <th className="px-5 py-4 w-[33%]">Recurso / Descrição</th>
                                <th className="px-3 py-4 w-[12%] text-center">Origem</th>
                                <th className="px-4 py-4 w-[13%]">Assessor</th>
                                <th className="px-4 py-4 w-[22%] text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recursos.map((r) => (
                                <tr key={r.id} className="break-inside-avoid">
                                    <td className="px-4 py-5 align-top">
                                        <p className="font-bold text-[11px] text-navy-dark leading-tight line-clamp-2">{r.municipio_nome}</p>
                                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">{r.regiao}</p>
                                    </td>
                                    <td className="px-5 py-5 align-top">
                                        <p className="text-[10px] leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                                            {r.descricao}
                                        </p>
                                        <p className="text-[8px] text-indigo-500 font-black uppercase mt-1 tracking-tighter">
                                            Status: {r.status}
                                        </p>
                                    </td>
                                    <td className="px-3 py-5 align-top text-center">
                                        <div className="scale-75 origin-top inline-block">
                                            <MandatoBadge origem={r.origem} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 align-top">
                                        <p className="text-[9px] text-slate-600 font-bold leading-tight line-clamp-2">{r.responsavel || '-'}</p>
                                    </td>
                                    <td className="px-4 py-5 align-top text-right">
                                        <p className="text-[12px] font-black text-navy-dark whitespace-nowrap">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.valor)}
                                        </p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Rodapé de Página com Margem de Segurança */}
                <div className="mt-16 pt-10 border-t border-slate-100 flex justify-between items-center text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] print:fixed print:bottom-12 print:w-[calc(100%-40mm)] print:left-10">
                    <p>Relatório de Auditoria • Portela App</p>
                    <p>Documento Gerado Eletronicamente</p>
                </div>
            </div>

            {/* Configurações de Impressão Refinadas - Foco em Margens de Segurança */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @page { 
                    size: A4 portrait;
                    margin: 20mm; 
                }
                @media print {
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print\\:hidden { display: none !important; }
                    .print\\:fixed { position: fixed !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    table { page-break-inside: auto; width: 100% !important; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                }
            `}} />
        </div>
    );
};

export default RecursosRelatorioPage;
