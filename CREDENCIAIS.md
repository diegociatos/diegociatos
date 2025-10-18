# 🔐 Credenciais de Teste - Ciatos Recrutamento

## Usuários do Sistema

### 👨‍💼 Admin
- **Email:** admin@ciatos.com
- **Senha:** admin123
- **Acesso:** Todos os recursos (Vagas, Candidatos, Candidaturas, Relatórios, Organizações, Gerenciar Usuários)

### 👔 Analista/Recrutador
- **Email:** recrutador@ciatos.com
- **Senha:** recruiter123
- **Acesso:** APENAS Vagas (Kanban) e Candidatos

### 🏢 Cliente
- **Email:** cliente@techcorp.com
- **Senha:** client123
- **Acesso:** Visualizar vagas da sua empresa e candidatos

---

## ✅ Testado e Funcionando

### Painel do Analista
- Login como: **recrutador@ciatos.com / recruiter123**
- Visualiza APENAS 2 cards:
  1. **Vagas** → Abre Kanban de Vagas (estilo Trello)
  2. **Candidatos** → Lista de candidatos
- SEM acesso a: Relatórios, Organizações, Gerenciar Usuários

### Kanban de Vagas (Estilo Trello)
- 6 Fases:
  1. 📋 Cadastro da Vaga
  2. 🔍 Triagem de Currículos
  3. 💬 Entrevistas
  4. ⭐ Seleção
  5. 📤 Envio do Cliente para Entrevista
  6. ✅ Contratação
- Drag & drop entre fases
- Resultado positivo → fecha vaga
- Resultado negativo → volta para Entrevistas

---

**Última atualização:** $(date '+%Y-%m-%d %H:%M:%S')
