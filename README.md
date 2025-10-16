# Ciatos Recrutamento - Sistema ATS

Sistema completo de Recrutamento & Seleção multi-tenant com painéis administrativos e portal de carreiras público.

## 🎯 Funcionalidades Implementadas

✅ **Multi-tenant** (agência + empresas-clientes)  
✅ **Autenticação JWT + Google OAuth** (Emergent)  
✅ **Gestão de Vagas** (criar, editar, publicar, pausar)  
✅ **Pipeline de Candidaturas** (7 estágios: submitted → hired)  
✅ **Algoritmo de Pontuação** (40% skills | 20% exp | 10% loc | 20% comportamental | 10% disponibilidade)  
✅ **Avaliações Comportamentais** (DISC, Perfil Comportamental, Reconhecimento)  
✅ **LGPD Compliance** (consentimento, export, anonimização, blind review)  
✅ **Portal de Carreiras Público**  
✅ **Integração OpenAI GPT-4o** (análise de CVs via Emergent LLM Key)  

## 🚀 Quick Start

### Backend
```bash
cd /app/backend
python seed.py  # Popula banco com dados iniciais
# Servidor já rodando em http://0.0.0.0:8001
```

### Frontend
```bash
# Já rodando em http://localhost:3000
# URL pública: https://talentflow-26.preview.emergentagent.com
```

## 👥 Credenciais de Teste

| Papel | Email | Senha |
|-------|-------|-------|
| **Admin** | admin@ciatos.com | admin123 |
| **Recrutador** | recrutador@ciatos.com | recruiter123 |
| **Cliente** | cliente@techcorp.com | client123 |

## 📡 Principais Endpoints

- `POST /api/auth/login` - Login
- `GET /api/jobs` - Listar vagas (privado)
- `GET /api/jobs/public` - Listar vagas públicas
- `POST /api/applications` - Candidatar-se
- `GET /api/applications` - Pipeline de candidaturas
- `GET /api/consents/export` - Exportar dados (LGPD)
- **Swagger**: https://talentflow-26.preview.emergentagent.com/api/docs

## 🎨 Stack Tecnológica

- **Backend**: FastAPI + MongoDB + Motor
- **Frontend**: React 19 + Tailwind + shadcn/ui
- **Auth**: JWT + Google OAuth (Emergent)
- **IA**: OpenAI GPT-4o (Emergent LLM Key)

## 📊 Algoritmo de Pontuação

```
Total Score = (Skills × 0.40) + (Experiência × 0.20) + 
              (Localização × 0.10) + (Comportamental × 0.20) + 
              (Disponibilidade × 0.10)

Penalidade: -20 pontos se skill must_have não atendida
```

## 🔐 LGPD

- ✅ Consentimento granular
- ✅ Export de dados (JSON/CSV)
- ✅ Anonimização programada
- ✅ Blind Review (oculta nome/foto)

---

**Sistema completo e funcional pronto para uso!**
