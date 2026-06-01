import json
import urllib.request
import os
import gzip

def load_env():
    env = {}
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip()
    except FileNotFoundError:
        print("Erro: .env.local não encontrado.")
    return env

def main():
    env = load_env()
    supabase_url = env.get('VITE_SUPABASE_URL')
    supabase_key = env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("Erro: Credenciais do Supabase não encontradas no .env.local")
        return

    # 1. Buscar municípios de MG no IBGE com tratamento de compressão
    print("Buscando municípios de MG no IBGE...")
    try:
        req = urllib.request.Request("https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios")
        req.add_header('Accept-Encoding', 'gzip')
        with urllib.request.urlopen(req) as response:
            content = response.read()
            if response.info().get('Content-Encoding') == 'gzip':
                content = gzip.decompress(content)
            cities_data = json.loads(content.decode('utf-8'))
            
        print(f"Encontrados {len(cities_data)} municípios no IBGE.")
    except Exception as e:
        print(f"Erro ao buscar dados do IBGE: {e}")
        return

    # 2. Preparar dados para o Supabase
    payload = []
    for c in cities_data:
        regiao = "Minas Gerais"
        if "regiao-imediata" in c:
            regiao = c["regiao-imediata"]["nome"]
        
        payload.append({
            "nome": c["nome"],
            "codigo_ibge": str(c["id"]),
            "regiao": regiao
        })

    # 3. Upsert no Supabase
    api_url = f"{supabase_url}/rest/v1/municipios"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    print(f"Iniciando envio de {len(payload)} municípios para o Supabase...")
    
    batch_size = 100
    success_count = 0
    
    for i in range(0, len(payload), batch_size):
        batch = payload[i:i+batch_size]
        try:
            req = urllib.request.Request(
                api_url, 
                data=json.dumps(batch).encode(), 
                headers=headers, 
                method='POST'
            )
            with urllib.request.urlopen(req) as response:
                if response.status in (200, 201, 204):
                    success_count += len(batch)
                    print(f"Progresso: {success_count}/{len(payload)} processados.")
                else:
                    print(f"Aviso no lote {i}: Status {response.status}")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            print(f"Erro HTTP no lote {i}: {e.code} - {error_body}")
        except Exception as e:
            print(f"Erro inesperado no lote {i}: {e}")

    print(f"\nConcluído! {success_count} municípios processados com sucesso.")

if __name__ == "__main__":
    main()
