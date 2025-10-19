#!/usr/bin/env python3
import os
import re

# Lista de arquivos a serem corrigidos
files_to_fix = [
    '/app/backend/routes/applications.py',
    '/app/backend/routes/users.py',
    '/app/backend/routes/organizations.py',
    '/app/backend/routes/skills.py',
    '/app/backend/routes/notifications.py',
    '/app/backend/routes/notifications_api.py',
    '/app/backend/routes/interviews.py',
    '/app/backend/routes/interviews_api.py',
    '/app/backend/routes/feedbacks.py'
]

for filepath in files_to_fix:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Substituir @router.get("/") por @router.get("")
        new_content = re.sub(r'@router\.get\("/"\)', '@router.get("")', content)
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            print(f'✅ Corrigido: {filepath}')
        else:
            print(f'⏭️  Não precisa: {filepath}')
    else:
        print(f'❌ Não encontrado: {filepath}')

print('\n✅ Script concluído!')
