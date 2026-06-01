import { apiClient } from './apiClient';
import { Profile } from '../types';

export const profileService = {
  /**
   * Busca todos os usuários cadastrados no sistema.
   */
  async getProfiles(): Promise<Profile[]> {
    const response = await apiClient.get<{ users: Profile[] }>('/api/users');
    return response.users;
  },

  /**
   * Busca o perfil de um usuário específico pelo ID.
   */
  async getProfile(userId: string): Promise<Profile | null> {
    return apiClient.get<Profile>(`/api/users/${userId}`);
  },

  /**
   * Busca o perfil do usuário logado através do token.
   */
  async getMe(): Promise<Profile | null> {
    return apiClient.get<Profile>('/api/auth/me');
  },

  /**
   * Atualiza as informações de um perfil.
   */
  async updateProfile(userId: string, updates: Partial<Profile>) {
    return apiClient.put<Profile>(`/api/users/${userId}`, updates);
  },

  /**
   * Altera o status (ativo/bloqueado) de um usuário.
   */
  async updateStatus(userId: string, status: 'active' | 'blocked' | 'pending') {
    return apiClient.put<any>(`/api/users/${userId}/status`, { status });
  },

  /**
   * Altera o cargo/nível de acesso de um usuário.
   */
  async updateRole(userId: string, role: string) {
    return apiClient.put<any>(`/api/users/${userId}`, { role });
  },

  async createUser(userData: {
    email: string;
    password?: string;
    nome: string;
    role: string;
  }) {
    return apiClient.post<any>('/api/users', userData);
  }
};
