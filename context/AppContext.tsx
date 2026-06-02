import React, { createContext, useState, ReactNode, useEffect, useRef } from 'react';
import { AppContextType, AppFilters, Theme, Profile } from '../types';
import { apiClient } from '../services/apiClient';
import { profileService } from '../services/profileService';
import { roleService } from '../services/roleService';

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    master: ['Dashboard', 'Municípios', 'Lideranças', 'Apoiadores', 'Assessores', 'Agenda', 'Recursos', 'Demandas', 'Configurações'],
    admin: ['Dashboard', 'Municípios', 'Lideranças', 'Apoiadores', 'Assessores', 'Agenda', 'Recursos', 'Demandas', 'Configurações'],
    user: ['Dashboard', 'Municípios', 'Lideranças', 'Apoiadores', 'Assessores', 'Agenda', 'Recursos', 'Demandas']
  });
  const [roleDisplayNames, setRoleDisplayNames] = useState<Record<string, string>>({
    master: 'Master',
    admin: 'Coordenador',
    user: 'Usuário'
  });
  const [impersonatedProfile, setImpersonatedProfile] = useState<Profile | null>(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem('impersonated_profile');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const isMounted = useRef(true);

  // Sistema de Toast Global
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isOpen: boolean }>({
    message: '',
    type: 'success',
    isOpen: false
  });
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type, isOpen: true });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, isOpen: false }));
    }, 3500);
  };

  const hideToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const loadPermissions = async () => {
    try {
      const data = await roleService.getRolePermissions();

      const perms: Record<string, string[]> = {};
      const displays: Record<string, string> = {};
      data?.forEach((item: any) => {
        perms[item.role] = item.allowed_items || [];
        displays[item.role] = item.display_name || item.role;
      });

      setRolePermissions(perms);
      setRoleDisplayNames(displays);
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
    }
  };

  useEffect(() => {
    if (user && (profile?.role === 'master' || profile?.role === 'admin')) {
      loadPermissions();
    }
  }, [user, profile?.role]);

  const [filters, setFilters] = useState<AppFilters>({
    regiao: 'Todas as Regiões',
    assessor: 'Todos',
    municipio: 'Todos',
  });

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme') as Theme;
      return storedTheme || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    isMounted.current = true;
    console.log("[AppContext] Monitorando autenticação via JWT...");

    const checkAuth = async () => {
      const token = localStorage.getItem('portela_hub_token');
      
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }

      try {
        console.log("[AppContext] Token encontrado, validando...");
        const me = await profileService.getMe();
        
        if (isMounted.current && me) {
          const userData = (me as any).user || me;
          setProfile(userData);
          setUser(userData);
          setProfileError(null);
        }
      } catch (err: any) {
        console.error("[AppContext] Erro ao validar token:", err);
        setProfileError(err.message || 'Sessão expirada.');
        apiClient.clearToken();
      } finally {
        if (isMounted.current) {
          setIsLoadingAuth(false);
        }
      }
    };

    checkAuth();

    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isLoadingAuth) {
        console.warn("[AppContext] Safety Timeout acionado (8s). Forçando fim do carregamento.");
        setIsLoadingAuth(false);
      }
    }, 8000);

    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [selectedMandato, setSelectedMandatoState] = useState<string>(() => {
    return localStorage.getItem('portela_hub_selected_mandato') || 'Todos';
  });

  useEffect(() => {
    if (selectedMandato === 'Lincoln Portela') {
      document.body.classList.add('mandato-lincoln');
    } else {
      document.body.classList.remove('mandato-lincoln');
    }
  }, [selectedMandato]);

  const setSelectedMandato = (mandato: string) => {
    setSelectedMandatoState(mandato);
    localStorage.setItem('portela_hub_selected_mandato', mandato);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const impersonateUser = (targetProfile: Profile) => {
    console.log(`[AppContext] Personificando usuário: ${targetProfile.email}`);
    setImpersonatedProfile(targetProfile);
    sessionStorage.setItem('impersonated_profile', JSON.stringify(targetProfile));
  };

  const stopImpersonating = () => {
    console.log("[AppContext] Parando personificação");
    setImpersonatedProfile(null);
    sessionStorage.removeItem('impersonated_profile');
  };

  const signOut = async () => {
    console.log("[AppContext] Fazendo logout...");
    apiClient.clearToken();
    setUser(null);
    setProfile(null);
    window.location.href = '/login';
  };

  return (
    <AppContext.Provider value={{
      filters,
      setFilters,
      theme,
      toggleTheme,
      selectedMandato,
      setSelectedMandato,
      isSidebarOpen,
      toggleSidebar,
      user,
      profile: impersonatedProfile || profile,
      setProfile,
      impersonatedProfile,
      profileError,
      isLoading: isLoadingAuth,
      signOut,
      impersonateUser,
      stopImpersonating,
      toast,
      showToast,
      hideToast,
      rolePermissions,
      setRolePermissions,
      roleDisplayNames,
      setRoleDisplayNames,
      updateRolePermission: async (role: string, itemLabel: string, active: boolean) => {
        try {
          const currentPermissions = rolePermissions[role] || [];
          let newPermissions;
          if (active) {
            newPermissions = Array.from(new Set([...currentPermissions, itemLabel]));
          } else {
            newPermissions = currentPermissions.filter(p => p !== itemLabel);
          }
          
          await roleService.updateAllowedItems(role, newPermissions);
          setRolePermissions(prev => ({ ...prev, [role]: newPermissions }));
        } catch (err) {
          console.error('Erro ao atualizar permissão:', err);
          throw err;
        }
      },
      bulkUpdateRolePermissions: async (role: string, itemLabels: string[]) => {
        try {
          await roleService.updateAllowedItems(role, itemLabels);
          setRolePermissions(prev => ({ ...prev, [role]: itemLabels }));
        } catch (err) {
          console.error('Erro ao atualizar permissões em massa:', err);
          throw err;
        }
      },
      createRole: async (name: string) => {
        try {
          const roleId = await roleService.createRole(name);
          setRoleDisplayNames(prev => ({ ...prev, [roleId]: name }));
          setRolePermissions(prev => ({ ...prev, [roleId]: ['Dashboard'] }));
        } catch (err) {
          console.error('Erro ao criar cargo:', err);
          throw err;
        }
      },
      deleteRole: async (roleId: string) => {
        try {
          await roleService.deleteRole(roleId);
          setRolePermissions(prev => {
            const next = { ...prev };
            delete next[roleId];
            return next;
          });
          setRoleDisplayNames(prev => {
            const next = { ...prev };
            delete next[roleId];
            return next;
          });
        } catch (err) {
          console.error('Erro ao excluir cargo:', err);
          throw err;
        }
      },
      renameRole: async (roleId: string, newName: string) => {
        try {
          await roleService.renameRole(roleId, newName);
          setRoleDisplayNames(prev => ({ ...prev, [roleId]: newName }));
        } catch (err) {
          console.error('Erro ao renomear cargo:', err);
          throw err;
        }
      }
    }}>
      {children}
    </AppContext.Provider>
  );
};
