# Fluxos Completos por Tipo de Usuário - Sistema Ciatos ATS

## 🔄 FLUXO COMPLETO DO CANDIDATO

### 1. Cadastro e Login
- Acessa `/login`
- Faz cadastro ou login com email/senha ou Google
- **Sistema redireciona automaticamente para `/candidato/perfil`**

### 2. Completar Perfil (OBRIGATÓRIO para candidatar)
**Aba 1 - Dados Pessoais**:
- Data de nascimento
- Cidade e Estado
- Expectativa salarial
- Disponibilidade (imediato, 30 dias, etc)

**Aba 2 - Experiência Profissional**:
- Empresa
- Cargo
- Data de início e término
- Trabalho atual (checkbox)
- Responsabilidades e conquistas

**Aba 3 - Formação Acadêmica**:
- Instituição
- Grau (Bacharelado, Mestrado, etc)
- Área de estudo
- Ano de início e conclusão

**Aba 4 - Questionários** (DIFERENCIAL):
- ✅ **DISC Autoral**: Avalia perfil comportamental (D, I, S, C)
- ✅ **Linguagens de Reconhecimento**: Como prefere ser reconhecido
- ✅ **Perfil Comportamental**: Competências comportamentais

### 3. Candidatar-se às Vagas
- Clica em "Ver Vagas Disponíveis"
- Navega para `/carreiras` (portal público)
- Vê vagas publicadas com:
  - Título da vaga
  - Localização
  - Modalidade (presencial/híbrido/remoto)
  - Faixa salarial
- Clica em "Candidatar-se"
- Sistema verifica se perfil está completo
- Cria candidatura automaticamente

### 4. Acompanhar Candidaturas
- No dashboard vê lista de candidaturas
- Status em tempo real:
  - **Submetida** - Candidatura enviada
  - **Em Análise** - RH está avaliando
  - **Entrevista RH** - Aguardando entrevista com recrutador
  - **Pré-Selecionado** - No shortlist!
  - **Entrevista Cliente** - Aguardando entrevista final
  - **Proposta Enviada** - Recebeu oferta
  - **Contratado!** - Sucesso!

---

## 🔄 FLUXO COMPLETO DO CLIENTE

### 1. Login
- Acessa `/login`
- Faz login com credenciais
- **Sistema redireciona automaticamente para `/cliente/dashboard`**

### 2. Cadastrar Nova Vaga
- Clica em "Cadastrar Nova Vaga"
- Preenche formulário COMPLETO:
  - **Básico**: Título, descrição detalhada
  - **Tipo**: CLT, PJ, Estágio
  - **Horário**: Ex: 08h às 18h
  - **Benefícios**: VR, VT, Plano de saúde, etc
  - **Localização**: Cidade, Estado
  - **Modalidade**: Presencial, Híbrido, Remoto
  - **Salário**: Faixa mínima e máxima
  - **Comentários**: Tipo de vaga que precisa (crucial para o analista)
- Salva como **Rascunho**
- **Notificação automática enviada para analista de RH**

### 3. Aguardar Revisão do Analista
- Analista recebe notificação
- Pode solicitar informações adicionais
- Cliente complementa informações se necessário
- Analista publica a vaga

### 4. Acompanhar Pipeline
- Acessa `/cliente/vagas` ou clica na vaga específica
- Vê dashboard com métricas em tempo real:
  - **Total de Candidaturas**
  - **Por Estágio**: Quantos em triagem, entrevista, etc
  - **Pipeline Visual**: Gráfico por fase
  - **Lista de Candidatos** com scores

### 5. Entrevistar Shortlist
- Recebe notificação quando candidatos chegam ao **Shortlist**
- Clica em "Candidatos Selecionados"
- Vê lista de candidatos pré-aprovados pelo RH com:
  - Nome completo
  - Score de pontuação
  - Localização
  - Perfil comportamental (resumo da análise)
  - Experiências relevantes
  - Parecer do analista de RH

### 6. Dar Parecer Final
- Agenda entrevista com candidato
- Após entrevista, dá nota (0-10)
- Escreve parecer detalhado
- Marca recomendação: **Contratar** ou **Não Contratar**
- Parecer fica salvo no histórico do candidato

### 7. Contratação
- Se aprovou, candidato avança para "Contratado"
- Sistema registra data de contratação
- Histórico fica disponível para consultas futuras

---

## 🔄 FLUXO COMPLETO DO ANALISTA DE RECRUTAMENTO

### 1. Login
- Acessa `/login`
- Faz login com credenciais
- **Sistema redireciona automaticamente para `/dashboard`**

### 2. Receber Notificação de Nova Vaga
- Recebe notificação: "Cliente cadastrou nova vaga"
- Acessa lista de vagas
- Vê vagas em status **"Em Revisão"**

### 3. Revisar e Solicitar Informações
- Abre detalhes da vaga
- Analisa descrição e requisitos
- Se necessário, solicita informações adicionais ao cliente:
  - "Preciso de mais detalhes sobre responsabilidades"
  - "Qual o perfil comportamental ideal?"
  - "Há alguma skill específica obrigatória?"
- Cliente complementa informações

### 4. Configurar Vaga para Publicação
- Define **skills obrigatórias** (must_have)
- Define nível mínimo por skill (1-5)
- Configura **perfil ideal comportamental**
- Ativa/Desativa **Blind Review** (anonimiza candidatos na triagem)
- Clica em "Publicar Vaga"

### 5. Vaga Publicada Automaticamente
- Sistema gera URL pública: `/carreiras/vaga/{id}`
- Registra publicação no `job_publications`
- Vaga aparece no portal de carreiras
- **Candidatos podem se candidatar**

### 6. Triagem Automática + Manual
- Candidatos se candidatam
- **Algoritmo de pontuação executa automaticamente**
- Analista acessa `/applications`
- Vê **Pipeline Kanban** com 7 colunas:
  - Submetida (1)
  - Triagem (3)
  - Entrevista RH (2)
  - Shortlist (1)
  - Entrevista Cliente (0)
  - Proposta (0)
  - Contratado (0)

### 7. Análise Detalhada de Candidatos
- Clica em card do candidato
- Vê informações completas:
  - **Score de pontuação** (0-100)
  - **Breakdown do score** (skills, exp, localização, comportamental, disponibilidade)
  - **CV completo** (experiências, formações)
  - **Perfil comportamental**:
    - DISC: Dominância, Influência, Estabilidade, Conformidade
    - Linguagens de Reconhecimento
    - Competências comportamentais
  - **Matching de skills** (verde=atende, vermelho=não atende)

### 8. Avançar ou Rejeitar Candidatos
**Opção 1 - Avançar**:
- Clica em "Avançar"
- Escolhe próximo estágio
- Adiciona nota (opcional): "Candidato demonstrou ótima comunicação"
- Confirma
- Candidato recebe notificação de avanço

**Opção 2 - Rejeitar**:
- Clica em "Rejeitar"
- Adiciona motivo (opcional): "Não atende skill obrigatória React"
- Confirma
- Candidato recebe notificação (feedback genérico por LGPD)

### 9. Criar Shortlist para Cliente
- Após entrevistar candidatos
- Seleciona os melhores (geralmente 3-5)
- Avança para estágio **"Shortlist"**
- Adiciona parecer detalhado para cada um
- **Cliente recebe notificação**: "Shortlist disponível para Vaga X"

### 10. Base de Currículos para Futuras Vagas
- Todos os candidatos ficam no sistema
- Pode buscar por:
  - Habilidades
  - Cidade
  - Experiência
  - Score anterior
- Quando tiver nova vaga, pode convidar candidatos do pool

### 11. Relatórios e Métricas
- Acessa `/reports`
- Vê métricas por vaga:
  - **Tempo médio de contratação** (TTH)
  - **Taxa de conversão** por estágio
  - **Fontes de candidatos**
  - **Funil de candidatos**
- Exporta relatórios em CSV

---

## 🔄 FLUXO COMPLETO DO ADMINISTRADOR

### 1. Login
- Acessa `/login`
- Faz login com credenciais de admin
- **Sistema redireciona automaticamente para `/dashboard`**

### 2. Gerenciar Organizações
- Acessa `/organizations`
- **Criar Organização**:
  - Nome
  - Tipo: **Agência** (mãe) ou **Cliente**
  - CNPJ
  - Status: Ativa/Inativa
- **Editar/Desativar** organizações existentes

### 3. Gerenciar Usuários
- Acessa `/users`
- **Criar Usuário**:
  - Email
  - Nome completo
  - Telefone
  - Senha inicial
- Usuário recebe email de boas-vindas

### 4. Atribuir Roles (Papéis)
- Seleciona usuário
- Clica em "Atribuir Papel"
- Escolhe:
  - **Organização** (qual empresa)
  - **Role**: Admin, Recruiter, Client, Candidate
- Confirma atribuição
- Usuário pode ter múltiplos roles em diferentes organizações

**Exemplo prático**:
- Maria pode ser:
  - **Recruiter** na Agência Ciatos
  - **Client** na empresa TechCorp (se for contato principal)

### 5. Supervisionar Todos os Processos
- Tem acesso a **TODAS** as funcionalidades do recrutador
- Pode ver vagas de todas as organizações
- Pode intervir em qualquer pipeline
- Acessa dados agregados de toda a plataforma

### 6. Configurar Parâmetros Globais
- Regras de retenção de dados (LGPD)
- Templates de notificações
- Questionários padrão
- Configurações de scoring

### 7. Relatórios Consolidados
- Acessa dashboard com métricas de TODAS as organizações:
  - Total de vagas ativas
  - Total de candidatos no sistema
  - Taxa de contratação geral
  - Tempo médio de contratação (TTH) por organização
  - NPS (quando implementado)

---

## 📊 Comparação de Permissões

| Funcionalidade | Candidato | Cliente | Recruiter | Admin |
|----------------|-----------|---------|-----------|-------|
| **Completar próprio perfil** | ✅ | ❌ | ❌ | ❌ |
| **Candidatar-se** | ✅ | ❌ | ❌ | ❌ |
| **Ver próprias candidaturas** | ✅ | ❌ | ❌ | ❌ |
| **Criar vaga (rascunho)** | ❌ | ✅ | ✅ | ✅ |
| **Publicar vaga** | ❌ | ❌ | ✅ | ✅ |
| **Ver shortlist da própria vaga** | ❌ | ✅ | ✅ | ✅ |
| **Entrevistar shortlist** | ❌ | ✅ | ✅ | ✅ |
| **Dar parecer final** | ❌ | ✅ | ✅ | ✅ |
| **Gerenciar pipeline completo** | ❌ | ❌ | ✅ | ✅ |
| **Acessar base de candidatos** | ❌ | ❌ | ✅ | ✅ |
| **Ver todos os candidatos** | ❌ | ❌ | ✅ | ✅ |
| **Criar organização** | ❌ | ❌ | ❌ | ✅ |
| **Criar usuários** | ❌ | ❌ | ❌ | ✅ |
| **Atribuir roles** | ❌ | ❌ | ❌ | ✅ |
| **Relatórios consolidados** | ❌ | ❌ | Parcial | ✅ |

---

## 🔔 Sistema de Notificações

### Eventos que Geram Notificações:

1. **Cliente cadastra vaga** → Analista recebe notificação
2. **Analista solicita info** → Cliente recebe notificação
3. **Vaga publicada** → Sistema registra URL pública
4. **Candidato se candidata** → Analista recebe notificação + Candidato recebe confirmação
5. **Candidato avança no pipeline** → Candidato recebe atualização de status
6. **Candidato chega ao Shortlist** → Cliente recebe notificação
7. **Entrevista agendada** → Candidato + Entrevistador recebem confirmação
8. **Proposta enviada** → Candidato recebe notificação
9. **Contratado** → Todos recebem confirmação

---

## 💡 Casos de Uso Completos

### Caso 1: Cliente precisa contratar Desenvolvedor React
1. Cliente faz login → vai para `/cliente/dashboard`
2. Clica em "Cadastrar Nova Vaga"
3. Preenche: "Desenvolvedor React Pleno, experiência com TypeScript, Redux..."
4. Salva → Analista notificado
5. Analista revisa, define React como must_have, publica
6. 15 candidatos se candidatam
7. Sistema pontua automaticamente (scores: 45, 67, 82, 91, ...)
8. Analista filtra por score > 70, entrevista os 5 melhores
9. Cria shortlist com 3 candidatos
10. Cliente recebe notificação, entrevista os 3
11. Escolhe 1, dá parecer, contrata

### Caso 2: Candidato busca vaga de Marketing
1. Candidato acessa `/login`, cadastra-se
2. É redirecionado para `/candidato/perfil`
3. Completa 4 abas (dados, experiências, formação, questionários)
4. Clica em "Ver Vagas"
5. Vê vaga "Analista de Marketing Digital"
6. Clica em "Candidatar-se"
7. Recebe confirmação
8. Acompanha status no dashboard: "Submetida" → "Em Análise" → "Pré-Selecionado!"
9. Aguarda contato do RH para entrevista

---

**Sistema completo com todos os 4 fluxos integrados e funcionando!** 🎯
