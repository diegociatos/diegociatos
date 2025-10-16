# Ciatos Recrutamento - Sistema ATS

Sistema completo de Recrutamento & Seleção multi-tenant com painéis específicos por tipo de usuário.

## 🎯 4 Tipos de Usuários com Interfaces Dedicadas

### 1️⃣ **CANDIDATO** - Portal de Candidaturas
**Acesso**: `/candidato/perfil`  
**Credenciais**: candidato1@email.com / candidato123

**Funcionalidades**:
- ✅ Completar perfil profissional (dados pessoais, localização, expectativa salarial)
- ✅ Adicionar experiências profissionais
- ✅ Adicionar formação acadêmica
- ✅ Responder questionários comportamentais:
  - DISC Autoral
  - Linguagens de Reconhecimento
  - Perfil Comportamental
- ✅ Ver vagas disponíveis
- ✅ Candidatar-se às vagas
- ✅ Acompanhar status das candidaturas

**Fluxo do Candidato**:
1. Login → Redireciona para `/candidato/perfil`
2. Completar perfil em 4 abas
3. Acessar `/carreiras` para ver vagas públicas
4. Candidatar-se e acompanhar status

---

### 2️⃣ **CLIENTE** - Painel de Gestão de Vagas
**Acesso**: `/cliente/dashboard`  
**Credenciais**: cliente@techcorp.com / client123

**Funcionalidades**:
- ✅ Cadastrar novas vagas (detalhes completos: função, horário, benefícios, perfil ideal)
- ✅ Ver estatísticas das vagas (total, ativas, candidatos)
- ✅ Acompanhar pipeline de candidatos por vaga
- ✅ Ver dashboard com métricas em tempo real
- ✅ Acessar shortlist de candidatos selecionados pelo RH
- ✅ Entrevistar candidatos pré-selecionados
- ✅ Dar parecer final sobre contratação
- ✅ Ver histórico de pareceres (fica salvo para futuras vagas)

**Fluxo do Cliente**:
1. Login → Redireciona para `/cliente/dashboard`
2. Cadastra vaga detalhada
3. Aguarda revisão do analista de RH
4. Acompanha pipeline de candidatos
5. Recebe notificação quando candidatos chegam ao shortlist
6. Entrevista e avalia candidatos
7. Dá parecer final e contrata

---

### 3️⃣ **ANALISTA DE RECRUTAMENTO** - Painel Completo de RH
**Acesso**: `/dashboard`  
**Credenciais**: recrutador@ciatos.com / recruiter123

**Funcionalidades**:
- ✅ **Acesso completo ao banco de dados**
- ✅ Receber notificações de novas vagas cadastradas
- ✅ Revisar vagas criadas pelos clientes
- ✅ Solicitar informações adicionais aos clientes
- ✅ Publicar vagas no portal de carreiras
- ✅ Gerenciar pipeline Kanban de candidaturas (7 estágios)
- ✅ Triagem automática com algoritmo de pontuação
- ✅ Analisar currículos e perfis comportamentais
- ✅ Realizar entrevistas e dar pareceres
- ✅ Avançar/rejeitar candidatos no pipeline
- ✅ Criar shortlist para o cliente
- ✅ Base de currículos para busca futura
- ✅ Relatórios e métricas avançadas

**Fluxo do Analista**:
1. Login → Redireciona para `/dashboard`
2. Recebe notificação de nova vaga
3. Revisa e publica vaga
4. Candidatos aplicam
5. Triagem automática (scoring)
6. Analisa CVs e perfis comportamentais
7. Entrevista candidatos
8. Dá parecer e avança no pipeline
9. Cria shortlist para o cliente
10. Acompanha até contratação

---

### 4️⃣ **ADMINISTRADOR** - Gestão Total do Sistema
**Acesso**: `/dashboard`  
**Credenciais**: admin@ciatos.com / admin123

**Funcionalidades**:
- ✅ **Acesso administrativo completo**
- ✅ Criar e deletar organizações
- ✅ Criar e deletar usuários
- ✅ Atribuir roles (admin, recruiter, client, candidate)
- ✅ Gerenciar todos os dados do sistema
- ✅ Configurar parâmetros globais
- ✅ Acesso a todas as funcionalidades do recrutador
- ✅ Relatórios consolidados de todas as organizações

**Fluxo do Administrador**:
1. Login → Redireciona para `/dashboard`
2. Gerencia organizações (agência + clientes)
3. Cria usuários e atribui roles
4. Supervisiona todos os processos
5. Acessa relatórios consolidados

---

## 📊 Algoritmo de Pontuação Automático

Cada candidatura recebe um score de 0-100 calculado automaticamente:

| Critério | Peso | Descrição |
|----------|------|-----------|
| **Skills** | 40% | Matching de habilidades (-20 pontos se must_have não atendida) |
| **Experiência** | 20% | Anos de experiência vs requisitos da vaga |
| **Localização** | 10% | Cidade/estado + compatibilidade com modalidade |
| **Comportamental** | 20% | Assessments vs perfil ideal da vaga |
| **Disponibilidade** | 10% | Expectativa salarial dentro da faixa |

---

## 🔄 Pipeline de Candidaturas (7 Estágios)

```
submitted → screening → recruiter_interview → shortlisted → 
client_interview → offer → hired

Estados alternativos: rejected, withdrawn
```

**Notificações em cada mudança**:
- Candidato → Confirmação de status
- Analista → Atualizações do pipeline
- Cliente → Shortlist disponível

---

## 🔐 Controle de Acesso (RBAC)

**Hierarquia de Roles**:
```
admin > recruiter > client > candidate
```

**Matriz de Permissões**:

| Ação | Admin | Recruiter | Client | Candidate |
|------|-------|-----------|--------|-----------|
| Criar organização | ✅ | ❌ | ❌ | ❌ |
| Criar usuário | ✅ | ❌ | ❌ | ❌ |
| Publicar vaga | ✅ | ✅ | ❌ | ❌ |
| Criar vaga | ✅ | ✅ | ✅ | ❌ |
| Ver todos candidatos | ✅ | ✅ | ❌ | ❌ |
| Ver shortlist | ✅ | ✅ | ✅ | ❌ |
| Candidatar-se | ❌ | ❌ | ❌ | ✅ |
| Editar perfil | ❌ | ❌ | ❌ | ✅ |

---

## 🧪 Credenciais de Teste

| Tipo | Email | Senha | Acesso |
|------|-------|-------|--------|
| **Admin** | admin@ciatos.com | admin123 | Dashboard completo |
| **Recruiter** | recrutador@ciatos.com | recruiter123 | Dashboard RH |
| **Cliente** | cliente@techcorp.com | client123 | Painel do Cliente |
| **Candidato** | candidato1@email.com | candidato123 | Perfil + Vagas |

---

## 📡 Principais Endpoints

### Autenticação
- `POST /api/auth/login` - Login (redireciona baseado no role)
- `POST /api/auth/google-session` - Login Google OAuth
- `GET /api/auth/me` - Usuário autenticado
- `GET /api/users/me/roles` - Roles do usuário

### Vagas (Client/Recruiter)
- `POST /api/jobs?organization_id=X` - Criar vaga
- `POST /api/jobs/{id}/publish` - Publicar vaga
- `GET /api/jobs/public` - Vagas públicas (portal)

### Candidaturas (Candidato)
- `POST /api/applications` - Candidatar-se
- `GET /api/applications/my` - Minhas candidaturas

### Pipeline (Recruiter)
- `GET /api/applications?job_id=X` - Pipeline da vaga
- `POST /api/applications/{id}/advance` - Avançar estágio
- `POST /api/applications/{id}/reject` - Rejeitar

### Perfil (Candidato)
- `POST /api/candidates/profile` - Atualizar perfil
- `POST /api/candidates/profile/experiences` - Adicionar experiência
- `POST /api/candidates/profile/educations` - Adicionar formação

---

## 🎨 Stack Tecnológica

- **Backend**: FastAPI + MongoDB + Motor + Redis
- **Frontend**: React 19 + Tailwind + shadcn/ui
- **Auth**: JWT + Google OAuth (Emergent)
- **IA**: OpenAI GPT-4o (Emergent LLM Key)
- **Storage**: MinIO/S3

---

## 📦 Sistema Completo

**12 Páginas Frontend**:
1. LoginPage - Autenticação com redirecionamento inteligente
2. DashboardPage - Admin/Recruiter
3. ClientDashboardPage - Cliente
4. CandidateDashboardPage - Candidato
5. JobsPage - Lista de vagas
6. CreateJobPage - Cadastro de vaga
7. JobDashboardPage - Acompanhamento
8. ApplicationsPage - Pipeline Kanban
9. CandidatesPage - Base de candidatos
10. CandidateProfilePage - Perfil completo
11. CareerSitePage - Portal público
12. ReportsPage - Relatórios

**15 Módulos Backend** + **27 Coleções MongoDB**

---

**Sistema ATS Full-Featured com 4 Tipos de Acesso Funcionando!** 🚀
