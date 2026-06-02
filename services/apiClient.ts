const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const API_URL = import.meta.env.DEV ? '/supabase-rest' : `${SUPABASE_URL}/rest/v1`;

class ApiClient {
  private cache = new Map<string, { data: any, timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 segundos

  private get token(): string | null {
    const t = localStorage.getItem('portela_hub_token');
    if (t && t.startsWith('sb_secret_')) {
      localStorage.removeItem('portela_hub_token');
      return null;
    }
    return t;
  }

  private async request(path: string, options: RequestInit = {}) {
    let cleanPath = path.startsWith('/api') ? path.replace('/api', '') : path;
    let url = `${API_URL}${cleanPath}`;
    let bodyObj = options.body ? JSON.parse(options.body as string) : null;

    // Tradução de endpoints de usuários (/users) para a tabela pública /profiles do Supabase
    if (cleanPath === '/users' && options.method === 'POST') {
      url = `${API_URL}/profiles`;
      const newUser = {
        email: bodyObj?.email,
        full_name: bodyObj?.nome || bodyObj?.full_name,
        role: bodyObj?.role || 'user',
        status: 'active'
      };
      options.body = JSON.stringify(newUser);
    } else if (cleanPath === '/users') {
      url = `${API_URL}/profiles?select=*`;
    } else if (cleanPath.startsWith('/users/')) {
      const parts = cleanPath.split('/');
      const userId = parts[2];
      const isStatusUpdate = parts[3] === 'status';

      if (isStatusUpdate && options.method === 'PUT') {
        url = `${API_URL}/profiles?id=eq.${userId}`;
        options.method = 'PATCH';
        options.body = JSON.stringify({ status: bodyObj?.status });
      } else if (options.method === 'PUT' || options.method === 'PATCH') {
        url = `${API_URL}/profiles?id=eq.${userId}`;
        options.method = 'PATCH';
        const updates: any = {};
        if (bodyObj) {
          if (bodyObj.nome) updates.full_name = bodyObj.nome;
          if (bodyObj.full_name) updates.full_name = bodyObj.full_name;
          if (bodyObj.role) updates.role = bodyObj.role;
          if (bodyObj.permissions) updates.permissions = bodyObj.permissions;
          if (bodyObj.status) updates.status = bodyObj.status;
        }
        options.body = JSON.stringify(updates);
      } else if (options.method === 'GET') {
        url = `${API_URL}/profiles?id=eq.${userId}`;
      }
    }

    if (cleanPath === '/auth/login') {
      url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
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
      url = `${SUPABASE_URL}/auth/v1/user`;
    } else if (cleanPath === '/sync/bulk-municipios' && bodyObj && bodyObj.data) {
      console.log('[Sync Interceptor] Processing bulk municipios update with empty value handling...');
      const cleanVal = (val: any) => (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) ? null : val;
      const updates = bodyObj.data;
      for (const item of updates) {
        await this.request(`/municipios?id=eq.${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status_prefeito: cleanVal(item.status_prefeito),
            votacao_ale: item.votacao_ale || 0,
            votacao_lincoln: item.votacao_lincoln || 0,
            idene: !!item.idene,
            lincoln_fechado: !!item.lincoln_fechado,
            status_atendimento: cleanVal(item.status_atendimento),
            tipo_atendimento: cleanVal(item.tipo_atendimento),
            principal_demanda: cleanVal(item.principal_demanda),
            sugestao_sedese: cleanVal(item.sugestao_sedese),
            observacao: cleanVal(item.observacao),
            assessor_id: cleanVal(item.assessor_id)
          })
        });
      }
      return { success: true };
    } else if (cleanPath === '/sync/bulk-apoiadores' && bodyObj && bodyObj.data) {
      console.log('[Sync Interceptor] Processing bulk supporters update with empty value handling...');
      const cleanVal = (val: any) => (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) ? null : val;
      const updates = bodyObj.data;
      for (const item of updates) {
        if (item.id) {
          await this.request(`/apoiadores?id=eq.${item.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              municipio_id: cleanVal(item.municipio_id),
              nome: cleanVal(item.nome),
              cargo: cleanVal(item.cargo),
              status_prefeito: cleanVal(item.status_prefeito),
              votacao_ale: item.votacao_ale || 0,
              votacao_lincoln: item.votacao_lincoln || 0,
              principal_demanda: cleanVal(item.principal_demanda),
              sugestao_sedese: cleanVal(item.sugestao_sedese)
            })
          });
        } else {
          await this.request('/apoiadores', {
            method: 'POST',
            body: JSON.stringify({
              municipio_id: cleanVal(item.municipio_id),
              nome: cleanVal(item.nome),
              cargo: cleanVal(item.cargo),
              status_prefeito: cleanVal(item.status_prefeito),
              votacao_ale: item.votacao_ale || 0,
              votacao_lincoln: item.votacao_lincoln || 0,
              principal_demanda: cleanVal(item.principal_demanda),
              sugestao_sedese: cleanVal(item.sugestao_sedese)
            })
          });
        }
      }
      return { success: true };
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
          const data = await this.request('/apoiadores?select=*,municipios(*)');
          // Fetch assessores separately for name lookup
          const assessoresData = await this.request('/assessores?select=id,nome');
          const assessorLookup: Record<string, string> = {};
          (assessoresData || []).forEach((a: any) => { assessorLookup[a.id] = a.nome; });
          
          const mapped = data.map((item: any) => ({
            ...item,
            municipioId: item.municipio_id || item.municipios?.id,
            municipioNome: item.municipios?.nome || 'Desconhecido',
            municipioRegiao: item.municipios?.regiao || '-',
            statusPrefeito: item.municipios?.status_prefeito,
            votacaoAle: item.municipios?.votacao_ale,
            votacaoLincoln: item.municipios?.votacao_lincoln,
            idene: item.municipios?.idene,
            lincolnFechado: item.municipios?.lincoln_fechado,
            statusAtendimento: item.municipios?.status_atendimento,
            tipoAtendimento: item.municipios?.tipo_atendimento,
            principalDemanda: item.municipios?.principal_demanda,
            sugestaoSedese: item.municipios?.sugestao_sedese,
            observacao: item.municipios?.observacao,
            assessorId: item.municipios?.assessor_id,
            assessorNome: item.municipios?.assessor_id ? assessorLookup[item.municipios.assessor_id] || null : null,
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
      // Para chaves administrativas service_role (que começam com 'sb_secret_'), NUNCA devemos enviar o cabeçalho 'Authorization: Bearer'.
      // O gateway do Supabase no navegador valida estritamente o formato de JWT no 'Authorization', rejeitando com 401.
      // O banco de dados PostgREST usa com sucesso a chave 'apikey' (já enviada acima) para dar bypass no RLS.
      if (!currentToken.startsWith('sb_secret_')) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }
    }

    const isGet = !options.method || options.method === 'GET';
    const maxRetries = isGet ? 3 : 1;
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        if (attempt > 1) {
          console.warn(`[ApiClient] Tentativa de reconexão ${attempt}/${maxRetries} para a rota: ${cleanPath}...`);
        }

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 401 && cleanPath !== '/auth/login') {
          const tokenSnippet = this.token ? `${this.token.substring(0, 12)}... (len: ${this.token.length})` : 'Nenhum';
          console.error('[DEBUG 401] Ocorreu um erro 401 não autorizado para a rota:', cleanPath, 'Token:', tokenSnippet);
          throw new Error(`Não autorizado (401) ao acessar ${cleanPath}. Token: ${tokenSnippet}`);
        }

        let data: any = {};
        const responseText = await response.text();
        if (responseText && responseText.trim().length > 0) {
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.warn('[ApiClient] Failed to parse response as JSON, falling back to text:', e);
            data = { text: responseText };
          }
        }

        if (!response.ok) {
          if (isGet && response.status >= 500 && attempt < maxRetries) {
            console.warn(`[ApiClient] Servidor indisponível (${response.status}) na tentativa ${attempt}. Tentando novamente...`);
            const backoff = attempt * 1000;
            await new Promise(r => setTimeout(r, backoff));
            continue;
          }
          throw new Error(data.error_description || data.message || data.error || `Erro na requisição: ${response.status}`);
        }

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

        let returnData = data;
        if (cleanPath.startsWith('/users/') && cleanPath !== '/users' && Array.isArray(data)) {
          returnData = data[0] || null;
        }

        // Store in cache if it's a GET
        if (options.method === 'GET') {
          this.cache.set(path, { data: returnData, timestamp: Date.now() });
        }

        return returnData;

      } catch (error: any) {
        clearTimeout(timeoutId);
        lastError = error;

        const isNetworkError = error instanceof TypeError || error.name === 'AbortError' || error.message?.includes('Network') || error.message?.includes('Failed to fetch');

        if (isGet && isNetworkError && attempt < maxRetries) {
          const backoff = attempt === 1 ? 500 : 1500;
          console.warn(`[ApiClient] Falha na tentativa ${attempt} (${error.message || 'Erro de rede'}). Reconectando em ${backoff}ms...`);
          await new Promise(r => setTimeout(r, backoff));
        } else {
          if (error.name === 'AbortError') {
            throw new Error('A requisição excedeu o tempo limite (10s).');
          }
          throw error;
        }
      }
    }

    throw lastError || new Error('Falha de rede persistente após múltiplas tentativas de conexão.');
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
