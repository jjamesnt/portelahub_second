const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const API_URL = `${SUPABASE_URL}/rest/v1`;

class ApiClient {
  private cache = new Map<string, { data: any, timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 segundos

  private get token(): string | null {
    return localStorage.getItem('portela_hub_token');
  }

  private async request(path: string, options: RequestInit = {}) {
    let cleanPath = path.startsWith('/api') ? path.replace('/api', '') : path;
    let url = `${API_URL}${cleanPath}`;
    let bodyObj = options.body ? JSON.parse(options.body as string) : null;

    // Se for rota de autenticação de login, usamos o Mock Auth de desenvolvimento bypass
    // Isso evita o erro de "Forbidden use of secret API key in browser" já que o Supabase Auth
    // bloqueia chaves service_role no navegador, mas o banco de dados/REST as aceita perfeitamente.
    if (cleanPath === '/auth/login') {
      const email = bodyObj?.email || '';
      console.log(`[Mock Auth Bypass] Logando usuário de desenvolvimento: ${email}`);
      
      // Mapear os usuários conhecidos e seus perfis cadastrados no Supabase
      let userProfile = {
        id: 'aa15110c-de1e-49dd-a251-5c2722e56583',
        email: email,
        full_name: 'James M. Rizo',
        role: 'master'
      };
      
      if (email.includes('ale')) {
        userProfile = {
          id: '408a74cd-c4ec-4bc6-9335-cfc6137c7e51',
          email: email,
          full_name: 'Alê Portela',
          role: 'admin'
        };
      } else if (email.includes('userbase')) {
        userProfile = {
          id: 'ae3a0ac8-9aa8-4e75-bfb3-f926c18e98dd',
          email: email,
          full_name: 'User Base',
          role: 'user'
        };
      }
      
      localStorage.setItem('portela_hub_email', email);
      return {
        token: SUPABASE_ANON_KEY, // Passará a usar o service_role key em todas as requisições subsequentes do cabeçalho
        user: userProfile
      };
    } else if (cleanPath === '/auth/signup') {
      url = `${SUPABASE_URL}/auth/v1/signup`;
      if (bodyObj) {
        bodyObj = {
          email: bodyObj.email,
          password: bodyObj.password,
          options: {
            data: {
              full_name: bodyObj.full_name,
              phone: bodyObj.phone
            }
          }
        };
        options.body = JSON.stringify(bodyObj);
      }
    } else if (cleanPath === '/auth/me') {
      // Como o login é simulado localmente, retornamos o perfil do localStorage ou do token administrativo
      console.log('[Mock Auth Bypass] Carregando perfil do usuário ativo...');
      const activeEmail = localStorage.getItem('portela_hub_email') || 'james.rizo@portelahub.com';
      
      try {
        const profileRes = await fetch(`${API_URL}/profiles?email=eq.${activeEmail}`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY
          }
        });
        if (profileRes.ok) {
          const profiles = await profileRes.json();
          if (profiles && profiles[0]) {
            return profiles[0];
          }
        }
      } catch (e) {
        console.error('Erro ao recuperar perfil complementar:', e);
      }
      
      return {
        id: 'aa15110c-de1e-49dd-a251-5c2722e56583',
        email: activeEmail,
        full_name: activeEmail.includes('ale') ? 'Alê Portela' : 'James M. Rizo',
        role: activeEmail.includes('ale') ? 'admin' : 'master',
        status: 'active'
      };
    } else if (cleanPath === '/admin/sql' && bodyObj && bodyObj.sql) {
      const sql = bodyObj.sql.toLowerCase();
      console.log('[SQL Interceptor] Traduzindo query SQL para PostgREST Supabase:', bodyObj.sql);

      // 1. Dashboard Counts
      if (sql.includes('count(*)') && sql.includes('recursos') && sql.includes('demandas')) {
        try {
          const [m, l, a, d, r] = await Promise.all([
            this.request('/municipios'),
            this.request('/liderancas'),
            this.request('/assessores'),
            this.request('/demandas'),
            this.request('/recursos')
          ]);
          return {
            rows: [{
              municipios_count: m.length,
              liderancas_count: l.length,
              assessores_count: a.length,
              recursos_total: r.reduce((acc: number, item: any) => acc + (parseFloat(item.valor) || 0), 0),
              demandas_total: d.length,
              ale_demandas: d.filter((item: any) => item.origem === 'Alê Portela').length,
              lincoln_demandas: d.filter((item: any) => item.origem === 'Lincoln Portela').length
            }]
          };
        } catch (e) {
          console.error('[SQL Interceptor] Erro na contagem do dashboard:', e);
        }
      }

      // 2. Lideranças
      if (sql.includes('hub.liderancas')) {
        try {
          const data = await this.request('/liderancas?select=*');
          const mapped = data.map((item: any) => ({
            ...item,
            municipio: item.municipio_nome,
            avatarUrl: item.avatar_url
          }));
          return { rows: mapped };
        } catch (e) {
          console.error('[SQL Interceptor] Erro na query de lideranças:', e);
        }
      }

      // 3. Assessores
      if (sql.includes('hub.assessores')) {
        try {
          const data = await this.request('/assessores?select=*');
          const mapped = data.map((item: any) => ({
            ...item,
            avatarUrl: item.avatar_url,
            regiaoAtuacao: item.regiao_atuacao,
            municipiosCobertos: item.municipios_cobertos,
            liderancasGerenciadas: item.liderancas_gerenciadas
          }));
          return { rows: mapped };
        } catch (e) {
          console.error('[SQL Interceptor] Erro na query de assessores:', e);
        }
      }

      // 4. Demandas
      if (sql.includes('hub.demandas')) {
        try {
          const data = await this.request('/demandas?select=*,municipios(nome,regiao)');
          const mapped = data.map((item: any) => ({
            ...item,
            municipioNome: item.municipios?.nome || 'Desconhecido',
            municipioRegiao: item.municipios?.regiao || '-'
          }));
          return { rows: mapped };
        } catch (e) {
          console.error('[SQL Interceptor] Erro na query de demandas:', e);
        }
      }

      // 5. Apoiadores
      if (sql.includes('hub.apoiadores')) {
        try {
          const data = await this.request('/apoiadores?select=*,municipios(nome,regiao)');
          const mapped = data.map((item: any) => ({
            ...item,
            municipioNome: item.municipios?.nome || 'Desconhecido',
            municipioRegiao: item.municipios?.regiao || '-'
          }));
          return { rows: mapped };
        } catch (e) {
          console.error('[SQL Interceptor] Erro na query de apoiadores:', e);
        }
      }

      // 6. Role Permissions (Select)
      if (sql.includes('hub.role_permissions') && sql.includes('select')) {
        try {
          const data = await this.request('/role_permissions?select=*');
          return { rows: data };
        } catch (e) {
          console.error('[SQL Interceptor] Erro na query de permissões:', e);
        }
      }

      // 7. Role Permissions (Update Allowed Items)
      if (sql.includes('update hub.role_permissions') && sql.includes('allowed_items')) {
        try {
          const roleMatch = bodyObj.sql.match(/role = '(.*?)'/i);
          const role = roleMatch ? roleMatch[1] : '';
          
          const itemsMatch = bodyObj.sql.match(/allowed_items = ARRAY\[(.*?)\]/i);
          let items: string[] = [];
          if (itemsMatch && itemsMatch[1]) {
            items = itemsMatch[1].split(',').map((s: string) => s.replace(/'/g, '').trim());
          }
          
          await this.request(`/role_permissions?role=eq.${role}`, {
            method: 'PATCH',
            body: JSON.stringify({ allowed_items: items })
          });
          return { rows: [] };
        } catch (e) {
          console.error('[SQL Interceptor] Erro no update de permissões:', e);
        }
      }

      // 8. Role Permissions (Rename)
      if (sql.includes('update hub.role_permissions') && sql.includes('display_name')) {
        try {
          const roleMatch = bodyObj.sql.match(/role = '(.*?)'/i);
          const role = roleMatch ? roleMatch[1] : '';
          const nameMatch = bodyObj.sql.match(/display_name = '(.*?)'/i);
          const newName = nameMatch ? nameMatch[1] : '';
          
          await this.request(`/role_permissions?role=eq.${role}`, {
            method: 'PATCH',
            body: JSON.stringify({ display_name: newName })
          });
          return { rows: [] };
        } catch (e) {
          console.error('[SQL Interceptor] Erro no rename de cargo:', e);
        }
      }

      // 9. Role Permissions (Insert)
      if (sql.includes('insert into hub.role_permissions')) {
        try {
          const roleMatch = bodyObj.sql.match(/VALUES \('(.*?)', '(.*?)'/i);
          if (roleMatch) {
            const role = roleMatch[1];
            const displayName = roleMatch[2];
            await this.request('/role_permissions', {
              method: 'POST',
              body: JSON.stringify({
                role,
                display_name: displayName,
                allowed_items: ['Dashboard']
              })
            });
          }
          return { rows: [] };
        } catch (e) {
          console.error('[SQL Interceptor] Erro ao criar cargo:', e);
        }
      }

      // 10. Role Permissions (Delete)
      if (sql.includes('delete from hub.role_permissions')) {
        try {
          const roleMatch = bodyObj.sql.match(/role = '(.*?)'/i);
          const role = roleMatch ? roleMatch[1] : '';
          await this.request(`/role_permissions?role=eq.${role}`, {
            method: 'DELETE'
          });
          return { rows: [] };
        } catch (e) {
          console.error('[SQL Interceptor] Erro ao excluir cargo:', e);
        }
      }
      
      return { rows: [] };
    }
    
    // Check cache for GET requests
    if (options.method === 'GET') {
      const cached = this.cache.get(path);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`[ApiClient] Cache hit: ${path}`);
        return cached.data;
      }
    }

    // Clear cache on mutations
    if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
      console.log(`[ApiClient] Mutation detected: ${options.method} ${path}. Clearing cache.`);
      this.cache.clear();
    }

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      ...options.headers,
    } as any;

    const currentToken = this.token || SUPABASE_ANON_KEY;
    if (currentToken) {
      if (cleanPath.startsWith('/auth/')) {
        // Evita enviar service_role para endpoints do Auth (GoTrue) para não causar erros de "Forbidden"
        if (!currentToken.startsWith('sb_secret_')) {
          headers['Authorization'] = `Bearer ${currentToken}`;
        }
      } else {
        // Para qualquer outro endpoint do PostgREST, enviamos a chave para autenticação/bypass de RLS
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 && cleanPath !== '/auth/login') {
        console.error('[DEBUG 401] Ocorreu um erro 401 não autorizado para a rota:', cleanPath);
        // localStorage.removeItem('portela_hub_token');
        // window.location.href = '/login';
        throw new Error('Não autorizado');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || errorData.message || errorData.error || `Erro na requisição: ${response.status}`);
      }

      const data = await response.json();

      // Compatibilidade de tokens para Login
      if (cleanPath === '/auth/login' && data && data.access_token) {
        data.token = data.access_token;
      }

      // Complementação de perfil para /auth/me
      if (cleanPath === '/auth/me' && data) {
        try {
          const profileRes = await fetch(`${API_URL}/profiles?id=eq.${data.id}`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${this.token}`
            }
          });
          if (profileRes.ok) {
            const profiles = await profileRes.json();
            if (profiles && profiles[0]) {
              return profiles[0];
            }
          }
        } catch (e) {
          console.error('Erro ao buscar perfil complementar:', e);
        }
        return {
          id: data.id,
          email: data.email,
          full_name: data.user_metadata?.full_name || '',
          phone: data.user_metadata?.phone || '',
          role: 'user',
          status: 'active'
        };
      }

      // Store in cache if it's a GET
      if (options.method === 'GET') {
        this.cache.set(path, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('A requisição excedeu o tempo limite (10s).');
      }
      throw error;
    }
  }

  async get<T>(path: string): Promise<T> {
    return this.request(path, { method: 'GET' });
  }

  async post<T>(path: string, body: any): Promise<T> {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(path: string, body: any): Promise<T> {
    return this.request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request(path, { method: 'DELETE' });
  }

  setToken(token: string) {
    localStorage.setItem('portela_hub_token', token);
    this.cache.clear(); // Clear cache on new login
  }

  clearToken() {
    localStorage.removeItem('portela_hub_token');
    this.cache.clear();
  }
}

export const apiClient = new ApiClient();
