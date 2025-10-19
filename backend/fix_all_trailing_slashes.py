#!/usr/bin/env python3
import os
import re

routes_dir = '/app/backend/routes'

count = 0
for filename in os.listdir(routes_dir):
    if filename.endswith('.py'):
        filepath = os.path.join(routes_dir, filename)
        
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Substituir todos os decoradores com trailing slash
        patterns = [
            (r'@router\.get\("/"\)', '@router.get("")'),
            (r'@router\.post\("/"\)', '@router.post("")'),
            (r'@router\.put\("/"\)', '@router.put("")'),
            (r'@router\.patch\("/"\)', '@router.patch("")'),
            (r'@router\.delete\("/"\)', '@router.delete("")'),
        ]
        
        new_content = content
        for pattern, replacement in patterns:
            new_content = re.sub(pattern, replacement, new_content)
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            count += 1
            print(f'✅ {filename}')

print(f'\n✅ Total: {count} arquivos corrigidos')
