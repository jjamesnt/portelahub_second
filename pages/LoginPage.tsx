import React, { useState, useContext } from 'react';
import { apiClient } from '../services/apiClient';
import { AppContext } from '../context/AppContext';
import Loader from '../components/Loader';

const LoginPage: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (isSignUp) {
                // Cadastro - Assumindo /api/auth/signup conforme padrão
                const response = await apiClient.post<any>('/api/auth/signup', {
                    email,
                    password,
                    full_name: fullName,
                    phone: phone,
                });

                setMessage({ type: 'success', text: 'Solicitação enviada! Aguarde a aprovação do administrador.' });
                setFullName('');
                setPhone('');
                setPassword('');
            } else {
                // Login
                const response = await apiClient.post<{ token: string, user: any }>('/api/auth/login', {
                    email,
                    password
                });

                if (response.token) {
                    apiClient.setToken(response.token);
                    // Forçar recarregamento ou atualizar contexto
                    window.location.reload();
                }
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Ocorreu um erro no acesso.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 font-inter">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center size-16 bg-turquoise/10 rounded-2xl mb-6">
                        <span className="material-symbols-outlined text-4xl text-turquoise">shield_person</span>
                    </div>
                    <h1 className="text-3xl font-black text-navy-dark dark:text-white tracking-tight">Portela App</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                        {isSignUp ? 'Solicite seu acesso ao portal' : 'Bem-vindo de volta'}
                    </p>
                </div>

                {message && (
                    <div className={`p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                        <span className="material-symbols-outlined text-lg">
                            {message.type === 'success' ? 'check_circle' : 'error'}
                        </span>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    {isSignUp && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">person</span>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Seu nome"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-turquoise transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Telefone / WhatsApp</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">phone</span>
                                    <input
                                        required
                                        type="tel"
                                        placeholder="(00) 00000-0000"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-turquoise transition-all"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">mail</span>
                            <input
                                required
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-turquoise transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">lock</span>
                            <input
                                required
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-turquoise transition-all"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full py-4 bg-turquoise text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-turquoise/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader /> : (isSignUp ? 'Enviar Solicitação' : 'Entrar no Portal')}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-xs font-bold text-slate-500 hover:text-turquoise transition-colors"
                    >
                        {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem acesso? Solicite aqui'}
                    </button>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Suporte especializado</p>
                        <a
                            href="mailto:suporte@portelahub.com"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-black hover:bg-slate-200 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">contact_support</span>
                            Apoio ao Usuário
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
