import { useCallback } from 'react';
import { roleService } from '../services/roleService';
import { useAppContext } from './useAppContext';

export const usePermissions = () => {
    const { 
        rolePermissions, 
        roleDisplayNames,
        setRolePermissions,
        setRoleDisplayNames 
    } = useAppContext();

    const loadPermissions = useCallback(async () => {
        try {
            const data = await roleService.getRolePermissions();
            const perms: Record<string, string[]> = {};
            const displays: Record<string, string> = {};
            
            data?.forEach((item: any) => {
                perms[item.role] = item.allowed_items || [];
                displays[item.role] = item.display_name || item.role;
            });

            if (setRolePermissions) setRolePermissions(perms);
            if (setRoleDisplayNames) setRoleDisplayNames(displays);
        } catch (err) {
            console.error('Erro ao recarregar permissões:', err);
        }
    }, [setRolePermissions, setRoleDisplayNames]);

    const updateRolePermission = async (role: string, itemLabel: string, active: boolean) => {
        const currentAllowed = rolePermissions[role] || [];
        let newAllowed: string[];
        
        if (active) {
            newAllowed = [...new Set([...currentAllowed, itemLabel])];
        } else {
            newAllowed = currentAllowed.filter(i => i !== itemLabel);
        }

        // Atualização otimista
        if (setRolePermissions) {
            setRolePermissions(prev => ({
                ...prev,
                [role]: newAllowed
            }));
        }

        try {
            await roleService.updateAllowedItems(role, newAllowed);
        } catch (err) {
            console.error('Erro ao salvar permissão:', err);
            await loadPermissions();
        }
    };

    const bulkUpdateRolePermissions = async (role: string, itemLabels: string[]) => {
        if (setRolePermissions) {
            setRolePermissions(prev => ({
                ...prev,
                [role]: itemLabels
            }));
        }

        try {
            await roleService.updateAllowedItems(role, itemLabels);
        } catch (err) {
            console.error('Erro ao salvar permissões em massa:', err);
            await loadPermissions();
        }
    };

    const createRole = async (roleName: string) => {
        try {
            await roleService.createRole(roleName);
            await loadPermissions();
        } catch (err) {
            console.error('Erro ao criar cargo:', err);
            throw err;
        }
    };

    const deleteRole = async (roleId: string) => {
        try {
            await roleService.deleteRole(roleId);
            await loadPermissions();
            return { success: true };
        } catch (err) {
            console.error('Erro ao excluir cargo:', err);
            throw err;
        }
    };

    const renameRole = async (roleId: string, newDisplayName: string) => {
        if (!newDisplayName.trim()) return;
        try {
            await roleService.renameRole(roleId, newDisplayName);
            await loadPermissions();
            return { success: true };
        } catch (err) {
            console.error('Erro ao renomear cargo:', err);
            throw err;
        }
    };

    return {
        rolePermissions,
        roleDisplayNames,
        updateRolePermission,
        bulkUpdateRolePermissions,
        createRole,
        deleteRole,
        renameRole,
        refreshPermissions: loadPermissions
    };
};
