# Credenciais do Sistema Ciatos Recrutamento

## Usuários Principais

### Administrador
- **Email:** admin@ciatos.com
- **Senha:** admin123
- **Papel:** Administrador do sistema
- **Acesso:** Dashboard Admin, Gerenciamento de Usuários, Gerenciamento de Organizações

### Recrutador/Analista
- **Email:** recrutador@ciatos.com
- **Senha:** recruiter123
- **Papel:** Analista de Recrutamento
- **Acesso:** Dashboard do Analista, Pipeline Kanban, Agendamento de Entrevistas

### Cliente
- **Email:** cliente@techcorp.com
- **Senha:** client123
- **Papel:** Cliente (TechCorp)
- **Acesso:** Dashboard do Cliente, Visualização de Vagas

### Bruno (Usuário Personalizado)
- **Email:** bruno@grupociatos.com.br
- **Senha:** Bruno24
- **Papel:** (verificar roles no sistema)

---

## Outras Credenciais de Teste

### Candidatos
- candidato1@email.com (Ana Silva)
- candidato2@email.com (Carlos Santos)
- candidato3@email.com (Fernanda Lima)
- candidato4@email.com (Rafael Costa)
- candidato5@email.com (Juliana Souza)
- candidato6@email.com (Pedro Oliveira)

**Nota:** As senhas dos candidatos foram geradas automaticamente durante o seed. Se necessário, podem ser resetadas pelo administrador.

---

## Informações Importantes

### Tenants (Organizações)
1. **TechCorp** - ID: tenant-techcorp-001
2. **AlphaFoods** - ID: tenant-alpha-002

### Como Trocar Senha
1. Fazer login com as credenciais fornecidas
2. Se o sistema pedir para trocar senha, usar a página `/change-password`
3. A nova senha deve ter pelo menos 1 caractere

### Resetar Senha de Qualquer Usuário
O administrador pode resetar a senha de qualquer usuário através de:
- Dashboard Admin → Gerenciamento de Usuários → Botão "Alterar Senha"

---

## Problemas Conhecidos Resolvidos

✅ **Login do Admin:** Corrigido - `admin@ciatos.com / admin123`
✅ **Login do Bruno:** Corrigido - `bruno@grupociatos.com.br / Bruno24`
✅ **Troca de senha:** Sistema permite que usuário mantenha ou troque senha após login
✅ **requires_password_change:** Definido como `false` para permitir login direto

---

## Acesso Rápido

### URLs Importantes
- Login: https://recruta-system.preview.emergentagent.com/login
- Dashboard Admin: https://recruta-system.preview.emergentagent.com/admin/usuarios
- Dashboard Analista: https://recruta-system.preview.emergentagent.com/recruiter/dashboard
- Kanban: https://recruta-system.preview.emergentagent.com/jobs/{jobId}/pipeline
- Calendário Entrevistas: https://recruta-system.preview.emergentagent.com/interviews-calendar
- Notificações: https://recruta-system.preview.emergentagent.com/notifications

---

**Última atualização:** 2025-01-16
**Status:** Todos os logins testados e funcionando ✅
