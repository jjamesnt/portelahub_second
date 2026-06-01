
import React, { useState, useEffect } from 'react';
import { Recurso } from '../types';
import { createRecurso, getRecursosByMunicipio } from '../services/api';

interface RecursosCardProps {
    municipioId: string;
}

const RecursosCard: React.FC<RecursosCardProps> = ({ municipioId }) => {
    const [recursos, setRecursos] = useState<Recurso[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        tipo: 'Emenda',
        descricao: '',
        valor: '',
        origem: '',
        status: 'Aprovado',
        responsavel: ''
    });

    const fetchRecursos = async () => {
        setIsLoading(true);
        try {
            const data = await getRecursosByMunicipio(municipioId);
            setRecursos(data);
        } catch (error) {
            console.error('Erro ao buscar recursos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecursos();
    }, [municipioId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await createRecurso({
                municipio_id: municipioId,
                tipo: formData.tipo,
                descricao: formData.descricao,
                valor: parseFloat(formData.valor),
                origem: formData.origem,
                status: formData.status,
                responsavel: formData.responsavel,
                data_aprovacao: new Date().toISOString()
            });
            setShowModal(false);
            setFormData({
                tipo: 'Emenda',
                descricao: '',
                valor: '',
                origem: '',
                status: 'Aprovado',
                responsavel: ''
            });
            fetchRecursos(); // Recarrega a lista
        } catch (error) {
            console.error('Erro ao criar recurso:', error);
            alert('Erro ao criar recurso.');
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const [filtroTipo, setFiltroTipo] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('');

    const totalRecursos = recursos.reduce((acc, r) => acc + r.valor, 0);

    const recursosFiltrados = recursos.filter(r => {
        const matchTipo = filtroTipo ? r.tipo === filtroTipo : true;
        const matchStatus = filtroStatus ? r.status === filtroStatus : true;
        return matchTipo && matchStatus;
    });

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-3 md:gap-4 bg-slate-50/30 dark:bg-slate-900/10">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-black text-navy-dark dark:text-white flex items-center gap-2 uppercase text-xs md:text-sm tracking-widest">
                            <span className="material-symbols-outlined text-turquoise text-lg md:text-xl">payments</span>
                            Recursos
                        </h4>
                        <p className="text-[9px] md:text-xs text-slate-500 mt-0.5 font-bold">Total: <span className="text-emerald-600">{formatCurrency(totalRecursos)}</span></p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-[10px] md:text-xs font-black text-white bg-turquoise px-3 py-1.5 rounded-xl hover:bg-turquoise/90 transition-all shadow-lg shadow-turquoise/20 flex items-center gap-1 uppercase">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Novo</span>
                    </button>
                </div>

                {/* Filtros - Mais compactos em Mobile */}
                <div className="flex gap-1.5 md:gap-2">
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="flex-1 md:flex-none text-[9px] md:text-xs font-black uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-turquoise/20"
                    >
                        <option value="">Tipos</option>
                        <option value="Emenda">Emenda</option>
                        <option value="Veículo">Veículo</option>
                        <option value="Equipamento">Equipamento</option>
                        <option value="Obra">Obra</option>
                    </select>
                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="flex-1 md:flex-none text-[9px] md:text-xs font-black uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-turquoise/20"
                    >
                        <option value="">Status</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Em Execução">Em Execução</option>
                        <option value="Concluído">Concluído</option>
                    </select>
                </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Carregando...</div>
                ) : recursosFiltrados.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">Vazio</div>
                ) : (
                    recursosFiltrados.map(recurso => (
                        <div key={recurso.id} className="p-3 md:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                            <div className="flex justify-between items-start mb-1.5">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter
                                            ${recurso.tipo === 'Emenda' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                recurso.tipo === 'Veículo' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    recurso.tipo === 'Obra' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'}`}>
                                            {recurso.tipo}
                                        </span>
                                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter
                                            ${recurso.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                                recurso.status === 'Em Execução' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                                    'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                                            {recurso.status}
                                        </span>
                                    </div>
                                    <p className="text-xs md:text-sm font-black text-navy-dark dark:text-white leading-tight">{recurso.descricao}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="font-black text-emerald-600 text-xs md:text-sm">{formatCurrency(recurso.valor)}</span>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{recurso.origem?.split(' ')[0]}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Cadastro - Otimizado para Mobile */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all animate-in slide-in-from-bottom sm:zoom-in duration-300 flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                            <h3 className="font-black text-lg text-navy-dark dark:text-white uppercase tracking-tight">Novo Recurso</h3>
                            <button onClick={() => setShowModal(false)} className="size-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Recurso</label>
                                <select
                                    name="tipo"
                                    value={formData.tipo}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-turquoise"
                                >
                                    <option value="Emenda">Emenda Parlamentar</option>
                                    <option value="Veículo">Veículo</option>
                                    <option value="Equipamento">Equipamento</option>
                                    <option value="Obra">Obra</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                                <input
                                    type="text"
                                    name="descricao"
                                    value={formData.descricao}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Reforma da Escola X"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-turquoise"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        name="valor"
                                        value={formData.valor}
                                        onChange={handleInputChange}
                                        placeholder="0,00"
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-turquoise"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-turquoise"
                                    >
                                        <option value="Aprovado">Aprovado</option>
                                        <option value="Em Execução">Em Execução</option>
                                        <option value="Concluído">Concluído</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Origem do Recurso</label>
                                <input
                                    type="text"
                                    name="origem"
                                    value={formData.origem}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Emenda Dep. Fulano"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-turquoise"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsável</label>
                                <input
                                    type="text"
                                    name="responsavel"
                                    value={formData.responsavel}
                                    onChange={handleInputChange}
                                    placeholder="Nome do responsável"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-turquoise"
                                />
                            </div>
                            <div className="pt-2 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-800 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-4 bg-turquoise text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-turquoise/30 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                                >
                                    {isSaving ? (
                                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                    )}
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecursosCard;
