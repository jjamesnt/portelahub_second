import { apiClient } from './apiClient';

export interface RolePermissionData {
  role: string;
  allowed_items: string[];
  display_name: string;
}

export const roleService = {
  /**
   * Busca todas as permissões de papéis cadastradas no sistema via SQL.
   * Isso contorna o erro 404 do endpoint /api/roles.
   */
  async getRolePermissions(): Promise<RolePermissionData[]> {
    try {
      const response = await apiClient.post<any>('/api/admin/sql', {
        sql: "SELECT role, allowed_items, display_name FROM hub.role_permissions"
      });
      
      if (response && response.rows) {
        return response.rows.map((row: any) => ({
          role: row.role,
          allowed_items: row.allowed_items || [],
          display_name: row.display_name || row.role
        }));
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar permissões via SQL:', error);
      return [];
    }
  },

  /**
   * Atualiza os itens permitidos para um cargo específico.
   */
  async updateAllowedItems(role: string, allowedItems: string[]) {
    // Formata o array para SQL
    const itemsSql = allowedItems.length > 0 
      ? `ARRAY[${allowedItems.map(i => `'${i}'`).join(',')}]` 
      : "'{}'::text[]";

    return apiClient.post<any>('/api/admin/sql', {
      sql: `UPDATE hub.role_permissions SET allowed_items = ${itemsSql} WHERE role = '${role}'`
    });
  },

  /**
   * Cria um novo cargo no sistema.
   */
  async createRole(name: string) {
    const roleId = name.toLowerCase().trim().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4);
    
    await apiClient.post<any>('/api/admin/sql', {
      sql: `INSERT INTO hub.role_permissions (role, display_name, allowed_items) 
            VALUES ('${roleId}', '${name}', ARRAY['Dashboard'])`
    });
    
    return roleId;
  },

  /**
   * Renomeia o nome de exibição de um cargo.
   */
  async renameRole(roleId: string, newDisplayName: string) {
    return apiClient.post<any>('/api/admin/sql', {
      sql: `UPDATE hub.role_permissions SET display_name = '${newDisplayName}' WHERE role = '${roleId}'`
    });
  },

  /**
   * Exclui um cargo.
   */
  async deleteRole(roleId: string) {
    if (roleId === 'master' || roleId === 'admin' || roleId === 'user') {
      throw new Error('Os cargos principais não podem ser excluídos.');
    }
    
    return apiClient.post<any>('/api/admin/sql', {
      sql: `DELETE FROM hub.role_permissions WHERE role = '${roleId}'`
    });
  }
};
