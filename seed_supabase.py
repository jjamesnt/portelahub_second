#!/usr/bin/env python3
"""
Seed script: aplica dump_vps_portela.sql no Supabase.
Lê o .env.local para pegar a senha do banco, depois conecta via psycopg2.

Como usar:
  1. Abra o dashboard Supabase > Settings > Database > Database password
  2. Execute: python3 seed_supabase.py --password SUA_SENHA
"""

import sys
import re
import argparse
import psycopg2
from psycopg2.extras import execute_batch

def main():
    parser = argparse.ArgumentParser(description='Seed Supabase com dump_vps_portela.sql')
    parser.add_argument('--password', required=True, help='Senha do banco Supabase')
    args = parser.parse_args()

    # Supabase connection string
    conn_str = f"postgresql://postgres:{args.password}@db.hmbyicviwrrayhztzkch.supabase.co:5432/postgres"

    print("Conectando ao banco de dados...")
    try:
        conn = psycopg2.connect(conn_str, connect_timeout=15)
        conn.autocommit = False
        cur = conn.cursor()
        print("✅ Conectado!")
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        print("\nVerifique se:")
        print("  1. A senha está correta")
        print("  2. Seu IP está autorizado no Supabase (Settings > Database > Connection pooling)")
        sys.exit(1)

    # Read SQL dump
    print("Lendo dump_vps_portela.sql...")
    with open('dump_vps_portela.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Split into individual statements
    # Filter out CREATE SCHEMA and CREATE TABLE (already done via migration)
    statements = []
    current = []
    
    for line in sql_content.split('\n'):
        stripped = line.strip()
        if not stripped or stripped.startswith('--'):
            continue
        current.append(line)
        if stripped.endswith(';'):
            stmt = '\n'.join(current).strip()
            # Only execute INSERT statements (schemas/tables already created)
            if stmt.upper().startswith('INSERT'):
                statements.append(stmt)
            current = []

    print(f"Encontrados {len(statements)} INSERT statements")

    # Execute in batches
    success = 0
    errors = 0
    batch_size = 50

    for i in range(0, len(statements), batch_size):
        batch = statements[i:i+batch_size]
        for stmt in batch:
            try:
                cur.execute(stmt)
                success += 1
            except psycopg2.errors.UniqueViolation:
                conn.rollback()  # Reset after error
                # Re-execute with ON CONFLICT DO NOTHING variant
                try:
                    # Try adding ON CONFLICT DO NOTHING if not present
                    if 'ON CONFLICT' not in stmt.upper():
                        stmt_modified = stmt.rstrip(';') + ' ON CONFLICT (id) DO NOTHING;'
                        cur.execute(stmt_modified)
                        success += 1
                except Exception as e2:
                    errors += 1
            except Exception as e:
                conn.rollback()
                errors += 1
                if errors <= 5:
                    print(f"  Erro: {str(e)[:100]}")
        
        conn.commit()
        print(f"  Progresso: {min(i+batch_size, len(statements))}/{len(statements)} ({success} ok, {errors} erros)")

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n✅ Concluído! {success} inserções com sucesso, {errors} erros.")

if __name__ == '__main__':
    main()
