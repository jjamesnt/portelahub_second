import React, { useState } from 'react';
import { navItems } from './Sidebar';

interface RoleCardProps {
    role: string;
    roleDisplayNames: Record<string, string>;
    rolePermissions: Record<string, string[]>;
    renameRole: (role: string, name: string) => Promise<any>;
    deleteRole: (role: string) => Promise<any>;
    updateRolePermission: (role: string, item: string, allowed: boolean) => Promise<void>;
    bulkUpdateRolePermissions: (role: string, items: string[]) => Promise<void>;
}

export const RoleCard: React.FC<RoleCardProps> = ({ 
    role, 
    roleDisplayNames, 
    rolePermissions, 
    renameRole, 
    deleteRole, 
    updateRolePermission, 
    bulkUpdateRolePermissions 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState('');
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

    const handleBulkUpdate = async (active: boolean) => {
        const itemsToUpdate = active 
            ? navItems.filter(item => item.id !== 'dashboard' && item.id !== 'configuracoes').map(i => i.label)
            : [];
        await bulkUpdateRolePermissions(role, itemsToUpdate);
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                                <div className="relative flex items-center gap-2">
                                    <input 
                                        type="text"
                                        autoFocus
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                                if (tempName.trim() && tempName !== (roleDisplayNames[role] || role.replace(/_/g, ' '))) {
                                                    try {
                                                        await renameRole(role, tempName);
                                                    } catch (err) {
                                                        console.error('Erro ao renomear:', err);
                                                    }
                                                }
                                                setIsEditing(false);
                                            }
                                            if (e.key === 'Escape') setIsEditing(false);
                                        }}
                                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none border-2 transition-all w-48 shadow-lg ${
                                            role === 'master' ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-amber-200/50' :
                                            role === 'admin' ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-blue-200/50' :
                                            'bg-white border-slate-400 text-slate-700 shadow-slate-200/50'
                                        }`}
                                    />
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={async () => {
                                                if (tempName.trim() && tempName !== (roleDisplayNames[role] || role.replace(/_/g, ' '))) {
                                                    try {
                                                        await renameRole(role, tempName);
                                                    } catch (err) {
                                                        console.error('Erro ao renomear:', err);
                                                    }
                                                }
                                                setIsEditing(false);
                                            }}
                                            className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-md shadow-green-200"
                                        >
                                            <span className="material-symbols-outlined text-xs">check</span>
                                        </button>
                                        <button 
                                            onClick={() => setIsEditing(false)}
                                            className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-xs">close</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    role === 'master' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                    role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                    {roleDisplayNames[role] || role.replace(/_/g, ' ')}
                                </div>
                                
                                <div className="flex gap-1 items-center">
                                    <button 
                                        onClick={() => {
                                            setIsEditing(true);
                                            setTempName(roleDisplayNames[role] || role.replace(/_/g, ' '));
                                        }}
                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    {role !== 'master' && role !== 'user' && (
                                        <div className="flex items-center">
                                            {roleToDelete === role ? (
                                                <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-2 py-1">
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                await deleteRole(role);
                                                            } catch (err: any) {
                                                                console.error('Erro ao excluir:', err);
                                                            } finally {
                                                                setRoleToDelete(null);
                                                            }
                                                        }}
                                                        className="text-[10px] font-black text-rose-600 uppercase hover:text-rose-700"
                                                    >
                                                        Confirmar?
                                                    </button>
                                                    <button 
                                                        onClick={() => setRoleToDelete(null)}
                                                        className="text-slate-400 hover:text-slate-600"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setRoleToDelete(role)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Módulos Ativos</h4>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleBulkUpdate(true)}
                        className="px-3 py-1.5 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all border border-green-100 dark:border-green-900/30"
                    >
                        Ativar Tudo
                    </button>
                    <button 
                        onClick={() => handleBulkUpdate(false)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-900/30"
                    >
                        Desativar Tudo
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {navItems.filter(item => item.id !== 'dashboard' && item.id !== 'configuracoes').map(item => {
                    const isAllowed = rolePermissions[role]?.includes(item.label);
                    return (
                        <div key={item.label} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-all hover:border-turquoise/30">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400 text-lg">{item.icon}</span>
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{item.label}</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isAllowed}
                                    onChange={(e) => updateRolePermission(role, item.label, e.target.checked)}
                                />
                                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-turquoise shadow-inner"></div>
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
