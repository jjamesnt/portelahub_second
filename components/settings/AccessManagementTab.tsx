import React, { useState } from 'react';
import { Profile } from '../../types';
import Loader from '../Loader';
import { NovoUsuarioModal } from '../NovoUsuarioModal';
import { profileService } from '../../services/profileService';
import SuccessModal from '../SuccessModal';

interface AccessManagementTabProps {
    profiles: Profile[];
    loadingProfiles: boolean;
    loadProfiles: () => Promise<void>;
    isMaster: boolean;
    profile: Profile | null;
    impersonateUser: (user: Profile) => void;
    handleUpdateStatus: (userId: string, newStatus: 'active' | 'blocked') => Promise<void>;
    handleUpdateRole: (userId: string, newRole: string) => Promise<void>;
    handleUpdatePermissions: (userId: string, newPermissions: string[]) => Promise<void>;
    roleDisplayNames: Record<string, string>;
    rolePermissions: Record<string, string[]>;
    isNovoUsuarioModalOpen: boolean;
    setIsNovoUsuarioModalOpen: (open: boolean) => void;
}

export const AccessManagementTab: React.FC<AccessManagementTabProps> = ({
    profiles,
    loadingProfiles,
    loadProfiles,
    isMaster,
    profile,
    impersonateUser,
    handleUpdateStatus,
    handleUpdateRole,
    handleUpdatePermissions,
    roleDisplayNames,
    rolePermissions,
    isNovoUsuarioModalOpen,
    setIsNovoUsuarioModalOpen
}) => {
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [editingPermissionsId, setEditingPermissionsId] = useState<string | null>(null);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'municipios', label: 'Municípios', icon: 'location_city' },
        { id: 'liderancas', label: 'Lideranças', icon: 'groups' },
        { id: 'apoiadores', label: 'Apoiadores', icon: 'volunteer_activism' },
        { id: 'assessores', label: 'Assessores', icon: 'badge' },
        { id: 'agenda', label: 'Agenda', icon: 'calendar_today' },
        { id: 'recursos', label: 'Recursos', icon: 'payments' },
        { id: 'demandas', label: 'Demandas', icon: 'assignment' },
        { id: 'configuracoes', label: 'Configurações', icon: 'settings' },
    ];
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg md:text-xl font-black text-navy-dark dark:text-white">Gestão de Usuários</h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Controle quem pode acessar o portal e seus níveis de permissão.</p>
                </div>
                <button
                    onClick={() => setIsNovoUsuarioModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all shadow-md hover:shadow-lg shrink-0"
                >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    Novo Usuário
                </button>
            </div>

            {loadingProfiles ? (
                <div className="py-12 flex justify-center"><Loader /></div>
            ) : (
                <div className="overflow-x-auto -mx-5 md:mx-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700">
                                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Nível</th>
                                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {profiles.map(p => (
                                <React.Fragment key={p.id}>
                                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-navy-dark dark:text-white truncate">{p.full_name}</h4>
                                                <button 
                                                    onClick={async () => {
                                                        const name = prompt('Editar nome do usuário:', p.full_name);
                                                        if (name && name !== p.full_name) {
                                                            try {
                                                                await profileService.updateProfile(p.id, { full_name: name });
                                                                await loadProfiles();
                                                                setSuccessMessage('Nome do usuário atualizado com sucesso!');
                                                                setShowSuccessModal(true);
                                                            } catch (err) {
                                                                console.error('Erro ao editar nome:', err);
                                                                alert('Erro ao editar nome.');
                                                            }
                                                        }
                                                    }}
                                                    className="text-slate-300 hover:text-turquoise transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">edit</span>
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-500 truncate">{p.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`inline-flex self-start px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-rose-100 text-rose-700'
                                                }`}>
                                                {p.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-turquoise uppercase tracking-widest">{p.role === 'agenda' ? 'Agenda Only' : p.role}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {p.id === profile?.id ? (
                                                <span className="text-[10px] font-bold text-slate-300">Você</span>
                                            ) : (
                                                <>
                                                     <div className="flex items-center gap-3">
                                                        {isMaster && (
                                                            <button
                                                                onClick={() => impersonateUser(p)}
                                                                className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group relative"
                                                                title="Modo Suporte: Entrar como este usuário"
                                                            >
                                                                <span className="material-symbols-outlined text-sm md:text-base">visibility</span>
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => setEditingPermissionsId(editingPermissionsId === p.id ? null : p.id)}
                                                            className={`p-2 rounded-xl transition-all shadow-sm ${
                                                                editingPermissionsId === p.id 
                                                                ? 'bg-turquoise text-white' 
                                                                : 'bg-slate-100 text-slate-400 hover:bg-turquoise/10 hover:text-turquoise'
                                                            }`}
                                                            title="Gerenciar Abas de Acesso"
                                                        >
                                                            <span className="material-symbols-outlined text-sm md:text-base">
                                                                {editingPermissionsId === p.id ? 'expand_less' : 'lock_open'}
                                                            </span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleUpdateStatus(p.id, p.status === 'active' ? 'blocked' : 'active')}
                                                            className={`p-2 rounded-xl transition-all shadow-sm ${
                                                                p.status === 'active' 
                                                                ? 'bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white' 
                                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                                            }`}
                                                            title={p.status === 'active' ? "Bloquear Acesso" : "Ativar/Desbloquear"}
                                                        >
                                                            <span className="material-symbols-outlined text-sm md:text-base">
                                                                {p.status === 'active' ? 'block' : 'check_circle'}
                                                            </span>
                                                        </button>

                                                        {isMaster && (
                                                            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl gap-1 border border-slate-200/50 dark:border-slate-800/50">
                                                                {[
                                                                    { id: 'user', icon: 'person', label: roleDisplayNames['user'] || 'Usuário' },
                                                                    ...Object.keys(rolePermissions)
                                                                        .filter(r => r !== 'user' && r !== 'master')
                                                                        .map(r => ({
                                                                            id: r,
                                                                            icon: r === 'admin' ? 'military_tech' : 'badge',
                                                                            label: roleDisplayNames[r] || r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, ' ')
                                                                        })),
                                                                    { id: 'master', icon: 'workspace_premium', label: roleDisplayNames['master'] || 'Master' }
                                                                ].map(r => (
                                                                    <button
                                                                        key={r.id}
                                                                        onClick={() => handleUpdateRole(p.id, r.id)}
                                                                        className={`p-2 rounded-xl transition-all group relative ${
                                                                            p.role === r.id 
                                                                            ? 'bg-white dark:bg-slate-800 text-turquoise shadow-sm scale-105 z-10' 
                                                                            : 'text-slate-400 hover:text-turquoise'
                                                                        }`}
                                                                        title={`Mudar para ${r.label}`}
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm md:text-base">{r.icon}</span>
                                                                        
                                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
                                                                            {r.label}
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isMaster && p.role === 'master' && (
                                                        <button
                                                            onClick={() => handleUpdateRole(p.id, 'admin')}
                                                            className="p-2 bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 rounded-xl hover:bg-slate-600 hover:text-white transition-all shadow-sm font-black"
                                                            title="Rebaixar a Admin: Remover permissões de Master Administrador."
                                                        >
                                                            <span className="material-symbols-outlined text-sm md:text-base">keyboard_arrow_down</span>
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {editingPermissionsId === p.id && (
                                    <tr className="bg-slate-50/80 dark:bg-slate-900/80">
                                        <td colSpan={3} className="px-5 py-6">
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="material-symbols-outlined text-turquoise text-sm">lock_open</span>
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-navy-dark dark:text-white">Permissões de Abas: <span className="text-turquoise">{p.full_name}</span></h5>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                    {navItems.map(item => {
                                                        const isSelected = p.permissions?.includes(item.label);
                                                        const isBaseForRole = rolePermissions[p.role]?.includes(item.label);
                                                        
                                                        return (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => {
                                                                    const current = p.permissions || (rolePermissions[p.role] || []);
                                                                    const next = current.includes(item.label)
                                                                        ? current.filter(l => l !== item.label)
                                                                        : [...current, item.label];
                                                                    handleUpdatePermissions(p.id, next);
                                                                }}
                                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                                                    isSelected 
                                                                    ? 'bg-turquoise/10 border-turquoise/30 text-turquoise' 
                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-turquoise/30 hover:text-turquoise'
                                                                }`}
                                                            >
                                                                <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-turquoise' : 'text-slate-300'}`}>
                                                                    {isSelected ? 'check_circle' : 'circle'}
                                                                </span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-bold truncate">{item.label}</span>
                                                                    {!isSelected && isBaseForRole && (
                                                                        <span className="text-[8px] uppercase tracking-tighter opacity-50">Padrão da Role</span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                
                                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                                                    <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5">info</span>
                                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed font-medium">
                                                        <strong>Atenção:</strong> Ao selecionar permissões manuais, as regras globais da "Role" ({p.role}) serão ignoradas para este usuário específico. 
                                                        Se o usuário for <strong>Master</strong>, ele continuará vendo tudo independentemente destas marcações.
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <NovoUsuarioModal
                isOpen={isNovoUsuarioModalOpen}
                onClose={() => setIsNovoUsuarioModalOpen(false)}
                onSuccess={async () => {
                    await loadProfiles();
                    setSuccessMessage('Novo usuário criado com sucesso!');
                    setShowSuccessModal(true);
                }}
            />

            <SuccessModal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                message={successMessage}
            />
        </div>
    );
};
