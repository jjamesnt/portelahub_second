import React, { useState } from 'react';
import { RoleCard } from '../RoleCard';

interface PermissionsTabProps {
    rolePermissions: Record<string, string[]>;
    roleDisplayNames: Record<string, string>;
    renameRole: (role: string, name: string) => Promise<any>;
    deleteRole: (role: string) => Promise<any>;
    updateRolePermission: (role: string, item: string, allowed: boolean) => Promise<void>;
    bulkUpdateRolePermissions: (role: string, items: string[]) => Promise<void>;
    createRole: (name: string) => Promise<void>;
}

export const PermissionsTab: React.FC<PermissionsTabProps> = ({
    rolePermissions,
    roleDisplayNames,
    renameRole,
    deleteRole,
    updateRolePermission,
    bulkUpdateRolePermissions,
    createRole
}) => {
    const [isAddingRole, setIsAddingRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg md:text-xl font-black text-navy-dark dark:text-white">Níveis de Acesso e Módulos</h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Configure os cargos do sistema e quais módulos cada um pode acessar.</p>
                </div>
                
                {isAddingRole ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                        <input 
                            type="text"
                            autoFocus
                            placeholder="Nome do cargo..."
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter' && newRoleName.trim()) {
                                    await createRole(newRoleName);
                                    setNewRoleName('');
                                    setIsAddingRole(false);
                                }
                                if (e.key === 'Escape') setIsAddingRole(false);
                            }}
                            className="px-4 py-2 bg-white dark:bg-slate-900 border-2 border-turquoise rounded-xl text-xs font-bold outline-none focus:ring-2 ring-turquoise/20 transition-all w-48"
                        />
                        <button 
                            onClick={async () => {
                                if (newRoleName.trim()) {
                                    await createRole(newRoleName);
                                    setNewRoleName('');
                                    setIsAddingRole(false);
                                }
                            }}
                            className="p-2 bg-turquoise text-white rounded-xl hover:bg-turquoise-dark transition-all shadow-lg shadow-turquoise/20"
                        >
                            <span className="material-symbols-outlined text-sm">check</span>
                        </button>
                        <button 
                            onClick={() => setIsAddingRole(false)}
                            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAddingRole(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-turquoise text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-turquoise-dark transition-all shadow-lg shadow-turquoise/20 self-start"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Novo Nível
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {Object.keys(rolePermissions).map(role => (
                    <RoleCard 
                        key={role}
                        role={role}
                        roleDisplayNames={roleDisplayNames}
                        rolePermissions={rolePermissions}
                        renameRole={renameRole}
                        deleteRole={deleteRole}
                        updateRolePermission={updateRolePermission}
                        bulkUpdateRolePermissions={bulkUpdateRolePermissions}
                    />
                ))}
            </div>
        </div>
    );
};
