import os
import sys
import django

# Configurar Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

def analyze_schemas():
    cursor = connection.cursor()
    
    print("=" * 80)
    print("ANÁLISE DOS SCHEMAS DO BANCO DE DADOS")
    print("=" * 80)
    print()
    
    # 1. Verificar schemas existentes
    print("1. SCHEMAS ENCONTRADOS:")
    print("-" * 80)
    cursor.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('cadfuncional', 'cms', 'public') ORDER BY schema_name")
    schemas = cursor.fetchall()
    for schema in schemas:
        print(f"  - {schema[0]}")
    print()
    
    # 2. Listar tabelas do schema cadfuncional
    print("2. TABELAS DO SCHEMA 'cadfuncional':")
    print("-" * 80)
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'cadfuncional' ORDER BY table_name")
    tables = cursor.fetchall()
    if tables:
        for table in tables:
            print(f"  - {table[0]}")
    else:
        print("  (Nenhuma tabela encontrada)")
    print()
    
    # 3. Listar tabelas do schema cms
    print("3. TABELAS DO SCHEMA 'cms':")
    print("-" * 80)
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'cms' ORDER BY table_name")
    tables = cursor.fetchall()
    if tables:
        for table in tables:
            print(f"  - {table[0]}")
    else:
        print("  (Nenhuma tabela encontrada)")
    print()
    
    # 4. Listar tabelas do schema public
    print("4. TABELAS DO SCHEMA 'public':")
    print("-" * 80)
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
    tables = cursor.fetchall()
    if tables:
        for table in tables:
            print(f"  - {table[0]}")
    else:
        print("  (Nenhuma tabela encontrada)")
    print()
    
    # 5. Identificar tabelas com nome 'reabilita' no schema public
    print("5. TABELAS COM NOME 'reabilita' NO SCHEMA 'public':")
    print("-" * 80)
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%reabilita%' ORDER BY table_name")
    reabilita_tables = cursor.fetchall()
    if reabilita_tables:
        for table in reabilita_tables:
            print(f"  - {table[0]}")
    else:
        print("  (Nenhuma tabela encontrada com 'reabilita' no nome)")
    print()
    
    # 6. Analisar relacionamentos entre tabelas reabilita e schema cadfuncional
    print("6. RELACIONAMENTOS ENTRE TABELAS 'reabilita' E SCHEMA 'cadfuncional':")
    print("-" * 80)
    if reabilita_tables:
        for table in reabilita_tables:
            table_name = table[0]
            print(f"\n  Tabela: {table_name}")
            print(f"  Colunas:")
            cursor.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = '{table_name}' 
                ORDER BY ordinal_position
            """)
            columns = cursor.fetchall()
            for col in columns:
                print(f"    - {col[0]} ({col[1]})")
            
            # Verificar foreign keys para cadfuncional
            cursor.execute(f"""
                SELECT
                    kcu.column_name,
                    ccu.table_schema AS foreign_table_schema,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = 'public'
                    AND tc.table_name = '{table_name}'
                    AND ccu.table_schema = 'cadfuncional'
            """)
            fks = cursor.fetchall()
            if fks:
                print(f"  Foreign Keys para cadfuncional:")
                for fk in fks:
                    print(f"    - {fk[0]} -> {fk[1]}.{fk[2]}.{fk[3]}")
            else:
                print(f"  (Nenhuma foreign key direta para cadfuncional)")
    else:
        print("  (Não há tabelas reabilita para analisar)")
    print()
    
    # 7. Comparar estruturas entre schemas
    print("7. COMPARAÇÃO DE ESTRUTURAS ENTRE SCHEMAS:")
    print("-" * 80)
    
    # Tabelas em cadfuncional
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'cadfuncional' ORDER BY table_name")
    cadfuncional_tables = [t[0] for t in cursor.fetchall()]
    
    # Tabelas em cms
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'cms' ORDER BY table_name")
    cms_tables = [t[0] for t in cursor.fetchall()]
    
    # Tabelas em public
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
    public_tables = [t[0] for t in cursor.fetchall()]
    
    print(f"\n  Quantidade de tabelas:")
    print(f"    - cadfuncional: {len(cadfuncional_tables)}")
    print(f"    - cms: {len(cms_tables)}")
    print(f"    - public: {len(public_tables)}")
    
    # Tabelas com mesmo nome entre schemas
    print(f"\n  Tabelas com mesmo nome entre schemas:")
    all_tables = {}
    for t in cadfuncional_tables:
        all_tables[t] = all_tables.get(t, []) + ['cadfuncional']
    for t in cms_tables:
        all_tables[t] = all_tables.get(t, []) + ['cms']
    for t in public_tables:
        all_tables[t] = all_tables.get(t, []) + ['public']
    
    for table_name, schemas_list in all_tables.items():
        if len(schemas_list) > 1:
            print(f"    - {table_name}: {', '.join(schemas_list)}")
    
    print()
    print("=" * 80)

if __name__ == "__main__":
    analyze_schemas()
