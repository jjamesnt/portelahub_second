import { useState, useCallback } from 'react';
import { profileService } from '../services/profileService';
import { Profile } from '../types';

export const useSettingsProfiles = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);

    const loadProfiles = useCallback(async () => {
        setLoadingProfiles(true);
        try {
            const response: any = await profileService.getProfiles();
            const rawList = response.users || response.profiles || response.data || (Array.isArray(response) ? response : []);
            
            const flattenedList = rawList.map((item: any) => ({
                ...(item.user || item),
                role: item.role || item.user?.role || (item.user || item).role
            }));
            
            setProfiles(flattenedList);
        } catch (err) {
            console.error('Erro ao carregar perfis:', err);
        } finally {
            setLoadingProfiles(false);
        }
    }, []);

    const handleUpdateStatus = async (userId: string, newStatus: 'active' | 'blocked') => {
        try {
            await profileService.updateStatus(userId, newStatus);
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, status: newStatus } : p));
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            throw err;
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            await profileService.updateRole(userId, newRole);
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
        } catch (err) {
            console.error('Erro ao atualizar cargo:', err);
            throw err;
        }
    };

    const handleUpdatePermissions = async (userId: string, newPermissions: string[]) => {
        try {
            await profileService.updateProfile(userId, { permissions: newPermissions });
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, permissions: newPermissions } : p));
        } catch (err) {
            console.error('Erro ao atualizar permissões:', err);
            throw err;
        }
    };

    return {
        profiles,
        loadingProfiles,
        loadProfiles,
        handleUpdateStatus,
        handleUpdateRole,
        handleUpdatePermissions
    };
};
