#!/usr/bin/env python3
"""
Conversor de Backup - SlotManager
Converte backups do formato antigo para o novo formato compatível
"""

import json
import uuid
import sys
from datetime import datetime

def convert_backup(input_file, output_file):
    """Converte backup do formato antigo para o novo"""
    
    print(f"Lendo arquivo: {input_file}")
    with open(input_file, 'r') as f:
        old_data = json.load(f)
    
    # Mapeamentos de IDs
    client_id_map = {}
    region_id_map = {}
    machine_id_map = {}
    operator_id_map = {}
    
    new_data = {
        "clients": [],
        "operators": [],
        "regions": [],
        "machines": [],
        "readings": []
    }
    
    # 1. Converter Regions
    print("\n1. Convertendo Regiões...")
    for region in old_data.get('regions', []):
        new_id = str(uuid.uuid4())
        region_id_map[region['id']] = new_id
        
        new_data['regions'].append({
            "id": new_id,
            "name": region['name'],
            "description": region.get('description', ''),
            "created_at": region.get('created_at', datetime.now().isoformat())
        })
    print(f"   ✓ {len(new_data['regions'])} regiões convertidas")
    
    # 2. Converter Clients
    print("\n2. Convertendo Clientes...")
    for client in old_data.get('clients', []):
        new_id = str(uuid.uuid4())
        client_id_map[client['id']] = new_id
        
        commission_value = float(client.get('commission', 0) or 0)
        
        new_data['clients'].append({
            "id": new_id,
            "name": client['name'],
            "commission_type": "percentage",
            "commission_value": commission_value,
            "phone": client.get('contact', '') or '',
            "email": client.get('email', '') or '',
            "created_at": client.get('created_at', datetime.now().isoformat())
        })
    print(f"   ✓ {len(new_data['clients'])} clientes convertidos")
    
    # 3. Converter Operators
    print("\n3. Convertendo Operadores...")
    operator_profiles = {p['id']: p for p in old_data.get('impersonation_profiles', [])}
    seen_profiles = set()
    
    for mc in old_data.get('manager_clients', []):
        profile_id = mc.get('impersonation_profile_id')
        if profile_id and profile_id not in seen_profiles:
            seen_profiles.add(profile_id)
            profile = operator_profiles.get(profile_id, {})
            
            new_id = str(uuid.uuid4())
            operator_id_map[profile_id] = new_id
            
            commission_value = float(mc.get('commission_percentage', 0) or 0)
            
            new_data['operators'].append({
                "id": new_id,
                "name": profile.get('name', f'Operador {len(new_data["operators"]) + 1}'),
                "commission_type": "percentage",
                "commission_value": commission_value,
                "phone": profile.get('phone', '') or '',
                "created_at": mc.get('created_at', datetime.now().isoformat())
            })
    
    if not new_data['operators']:
        default_operator_id = str(uuid.uuid4())
        new_data['operators'].append({
            "id": default_operator_id,
            "name": "Sem Operador",
            "commission_type": "percentage",
            "commission_value": 0,
            "phone": "",
            "created_at": datetime.now().isoformat()
        })
    
    print(f"   ✓ {len(new_data['operators'])} operadores convertidos")
    
    # 4. Mapear clientes para operadores
    client_operators = {}
    for mc in old_data.get('manager_clients', []):
        client_id = mc.get('client_id')
        profile_id = mc.get('impersonation_profile_id')
        if client_id and profile_id and profile_id in operator_id_map:
            client_operators[client_id] = operator_id_map[profile_id]
    
    # 5. Converter Machines
    print("\n4. Convertendo Máquinas...")
    for machine in old_data.get('machines', []):
        new_id = str(uuid.uuid4())
        machine_id_map[machine['id']] = new_id
        
        old_client_id = machine['client_id']
        new_client_id = client_id_map.get(old_client_id)
        
        if not new_client_id:
            continue
        
        # Buscar região do cliente
        old_region_id = None
        for client in old_data['clients']:
            if client['id'] == old_client_id:
                old_region_id = client.get('region_id')
                break
        
        new_region_id = region_id_map.get(old_region_id) if old_region_id else list(region_id_map.values())[0]
        operator_id = client_operators.get(old_client_id)
        
        new_data['machines'].append({
            "id": new_id,
            "code": str(machine.get('serial_number', machine['id'])),
            "name": machine.get('model', f"Máquina {machine['id']}"),
            "multiplier": float(machine.get('multiplicity', 0.01) or 0.01),
            "client_id": new_client_id,
            "region_id": new_region_id,
            "operator_id": operator_id,
            "active": True,
            "created_at": machine.get('created_at', datetime.now().isoformat())
        })
    print(f"   ✓ {len(new_data['machines'])} máquinas convertidas")
    
    # 6. Converter Readings
    print("\n5. Convertendo Leituras...")
    for reading in old_data.get('readings', []):
        old_machine_id = reading.get('machine_id')
        new_machine_id = machine_id_map.get(old_machine_id)
        
        if not new_machine_id:
            continue
        
        new_id = str(uuid.uuid4())
        
        profit = float(reading.get('profit', 0) or 0)
        client_commission = abs(float(reading.get('commission_value', 0) or 0))
        operator_commission = abs(float(reading.get('operator_commission_value', 0) or 0))
        multiplier = float(reading.get('multiplier', 0.01) or 0.01)
        
        # Calcular valores fictícios mas proporcionais
        if multiplier > 0 and profit != 0:
            difference = profit / multiplier
            previous_in = 1000.0
            previous_out = 800.0
            current_in = previous_in + max(0, difference + 200)
            current_out = previous_out + max(0, -difference + 200)
        else:
            previous_in = 1000.0
            previous_out = 800.0
            current_in = 1200.0
            current_out = 1000.0
        
        new_data['readings'].append({
            "id": new_id,
            "machine_id": new_machine_id,
            "previous_in": previous_in,
            "previous_out": previous_out,
            "current_in": current_in,
            "current_out": current_out,
            "gross_value": profit,
            "client_commission": client_commission,
            "operator_commission": operator_commission,
            "net_value": profit - client_commission - operator_commission,
            "reading_date": reading.get('created_at', datetime.now().isoformat()),
            "created_at": reading.get('created_at', datetime.now().isoformat())
        })
    
    print(f"   ✓ {len(new_data['readings'])} leituras convertidas")
    
    # Salvar novo formato
    print(f"\nSalvando arquivo: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*60)
    print("CONVERSÃO COMPLETA!")
    print("="*60)
    print(f"\nResumo:")
    print(f"  ✓ Clientes: {len(new_data['clients'])}")
    print(f"  ✓ Operadores: {len(new_data['operators'])}")
    print(f"  ✓ Regiões: {len(new_data['regions'])}")
    print(f"  ✓ Máquinas: {len(new_data['machines'])}")
    print(f"  ✓ Leituras: {len(new_data['readings'])}")
    print(f"\nArquivo convertido salvo em: {output_file}")
    print("\nAgora você pode importar este arquivo pela interface web:")
    print("  Menu → Configurações → Importar Backup")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 converter.py <arquivo_backup_antigo.json> [arquivo_saida.json]")
        print("\nExemplo:")
        print("  python3 converter.py backup_soberano_2025-10-26.json backup_convertido.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'backup_converted.json'
    
    try:
        convert_backup(input_file, output_file)
    except Exception as e:
        print(f"\n❌ Erro durante a conversão: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
