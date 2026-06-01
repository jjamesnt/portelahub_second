import React, { useState } from 'react';
import { profileService } from '../services/profileService';

interface NovoUsuarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const NovoUsuarioModal: React.FC<NovoUsuarioModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'user' | 'admin' | 'master'>('user');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await profileService.createUser({
                email,
                password,
                nome: fullName,
                role
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Erro ao criar usuário:", err);
            setError(err.message || 'Ocorreu um erro ao criar o usuário. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-navy-dark dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-500">person_add</span>
                            Adicionar Novo Usuário
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Crie um acesso imediatamente aprovado.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium flex items-start gap-3 border border-red-100 dark:border-red-900/30">
                            <span className="material-symbols-outlined shrink-0 text-xl">error</span>
                            <p>{error}</p>
                        </div>
                    )}

                    <form id="create-user-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all text-sm"
                                placeholder="Ex: João da Silva"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all text-sm"
                                    placeholder="joao@exemplo.com"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">WhatsApp</label>
                                <input
                                    type="text"
                                    required
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all text-sm"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Senha Inicial</label>
                            <input
                                type="text"
                                required
                                minLength={6}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all text-sm"
                                placeholder="Mínimo de 6 caracteres"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Nível de Acesso (Role)</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all text-sm appearance-none font-medium"
                            >
                                <option value="user">Usuário Base (Acesso Restrito)</option>
                                <option value="admin">Coordenador / Admin (Gestão de Dados)</option>
                                <option value="master">Master Admin (Controle Total de Acessos)</option>
                            </select>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="create-user-form"
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                                Criando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Criar Usuário
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};
