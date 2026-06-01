import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useSettingsProfiles } from '../hooks/useSettingsProfiles';
import { usePermissions } from '../hooks/usePermissions';
import { ProfileTab } from '../components/settings/ProfileTab';
import { AppearanceTab } from '../components/settings/AppearanceTab';
import { AccessManagementTab } from '../components/settings/AccessManagementTab';
import { PermissionsTab } from '../components/settings/PermissionsTab';

interface ConfiguracoesPageProps {
    navigateTo: (page: string, params?: { [key: string]: any }) => void;
}

const ConfiguracoesPage: React.FC<ConfiguracoesPageProps> = ({ navigateTo }) => {
    const { 
        theme, toggleTheme, profile, signOut, impersonateUser
    } = useAppContext();
    const { 
        profiles, loadingProfiles, loadProfiles, 
        handleUpdateStatus, handleUpdateRole, handleUpdatePermissions
    } = useSettingsProfiles();
    const {
        rolePermissions, roleDisplayNames, updateRolePermission, bulkUpdateRolePermissions,
        createRole, deleteRole, renameRole
    } = usePermissions();
    
    const [activeTab, setActiveTab] = useState('Aparência');
    const [isNovoUsuarioModalOpen, setIsNovoUsuarioModalOpen] = useState(false);

    const isMaster = profile?.role === 'master';

    useEffect(() => {
        if (activeTab === 'Gestão de Acessos' && isMaster) {
            loadProfiles();
        }
    }, [activeTab, isMaster, loadProfiles]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Meu Perfil':
                return <ProfileTab profile={profile} signOut={signOut} />;
            case 'Aparência':
                return <AppearanceTab theme={theme} toggleTheme={toggleTheme} />;
            case 'Gestão de Acessos':
                if (!isMaster) return null;
                return (
                    <AccessManagementTab 
                        profiles={profiles}
                        loadingProfiles={loadingProfiles}
                        loadProfiles={loadProfiles}
                        isMaster={isMaster}
                        profile={profile}
                        impersonateUser={impersonateUser}
                        handleUpdateStatus={handleUpdateStatus}
                        handleUpdateRole={handleUpdateRole}
                        handleUpdatePermissions={handleUpdatePermissions}
                        roleDisplayNames={roleDisplayNames}
                        rolePermissions={rolePermissions}
                        isNovoUsuarioModalOpen={isNovoUsuarioModalOpen}
                        setIsNovoUsuarioModalOpen={setIsNovoUsuarioModalOpen}
                    />
                );
            case 'Notificações':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h3 className="text-lg md:text-xl font-black text-navy-dark dark:text-white">Notificações</h3>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-6 md:mb-8">Escolha como você recebe as atualizações.</p>
                        <div className="space-y-3 md:space-y-4">
                            {[
                                { id: 'n1', label: 'Novas demandas na sua região', sub: 'Receba alertas sobre novas solicitações locais' },
                                { id: 'n2', label: 'Atualizações de lideranças', sub: 'Notificar quando houver mudanças no status' },
                                { id: 'n3', label: 'Resumo semanal por e-mail', sub: 'Um relatório consolidado toda segunda-feira' }
                            ].map((item, idx) => (
                                <div key={item.id} className="flex items-center justify-between p-4 md:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                    <div className="flex-1 pr-4">
                                        <label htmlFor={item.id} className="font-bold text-sm md:text-base text-navy-dark dark:text-slate-200 cursor-pointer">{item.label}</label>
                                        <p className="text-[10px] md:text-xs text-slate-400">{item.sub}</p>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id={item.id} className="sr-only peer" defaultChecked={idx < 2} />
                                        <div className="w-10 h-5 md:w-11 md:h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:md:h-5 after:md:w-5 after:transition-all peer-checked:bg-turquoise"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'Permissões':
                if (!isMaster) return null;
                return (
                    <PermissionsTab 
                        rolePermissions={rolePermissions}
                        roleDisplayNames={roleDisplayNames}
                        renameRole={renameRole}
                        deleteRole={deleteRole}
                        updateRolePermission={updateRolePermission}
                        bulkUpdateRolePermissions={bulkUpdateRolePermissions}
                        createRole={createRole}
                    />
                );
            default: return null;
        }
    }

    const tabs = ['Meu Perfil', 'Aparência', 'Notificações'];
    if (isMaster) {
        tabs.splice(2, 0, 'Gestão de Acessos');
        tabs.splice(3, 0, 'Permissões');
    }

    return (
        <div className="p-4 md:p-8 pb-24 md:pb-8">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-navy-dark dark:text-white mb-6 md:mb-8">Configurações</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                <div className="md:col-span-1">
                    <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap md:w-full text-left px-4 py-2 md:py-2.5 rounded-xl font-bold text-[11px] md:text-sm transition-all ${activeTab === tab ? 'bg-turquoise text-white shadow-lg shadow-turquoise/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 md:p-8 min-h-[400px]">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default ConfiguracoesPage;
