#!/usr/bin/env python3
"""
Script para criar 4 usuários SIMPLES e FUNCIONAIS
- 1 Admin
- 1 Analista/Recrutador
- 1 Cliente
- 1 Candidato
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "ats_db"

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("=== CRIANDO 4 USUÁRIOS FUNCIONAIS ===\n")
    
    # 1. ADMIN
    admin_id = f"user-{uuid.uuid4()}"
    await db.users.insert_one({
        "id": admin_id,
        "email": "admin@ciatos.com",
        "full_name": "Administrador Ciatos",
        "hashed_password": pwd_context.hash("admin123"),
        "is_active": True,
        "requires_password_change": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.user_org_roles.insert_one({
        "user_id": admin_id,
        "organization_id": None,
        "role": "admin"
    })
    print("✅ Admin criado: admin@ciatos.com / admin123")
    
    # 2. ORGANIZAÇÃO (para Analista e Cliente)
    org_id = f"org-{uuid.uuid4()}"
    await db.organizations.insert_one({
        "id": org_id,
        "name": "Empresa Teste",
        "email": "contato@empresateste.com",
        "phone": "(11) 9999-9999",
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    print(f"✅ Organização criada: {org_id}")
    
    # 3. ANALISTA/RECRUTADOR
    analyst_id = f"user-{uuid.uuid4()}"
    await db.users.insert_one({
        "id": analyst_id,
        "email": "analista@ciatos.com",
        "full_name": "Analista RH",
        "hashed_password": pwd_context.hash("analista123"),
        "is_active": True,
        "requires_password_change": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.user_org_roles.insert_one({
        "user_id": analyst_id,
        "organization_id": None,  # Sem organização para ver TODAS as vagas
        "role": "recruiter"
    })
    print("✅ Analista criado: analista@ciatos.com / analista123")
    
    # 4. CLIENTE
    client_id = f"user-{uuid.uuid4()}"
    await db.users.insert_one({
        "id": client_id,
        "email": "cliente@empresateste.com",
        "full_name": "Cliente Teste",
        "hashed_password": pwd_context.hash("cliente123"),
        "is_active": True,
        "requires_password_change": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.user_org_roles.insert_one({
        "user_id": client_id,
        "organization_id": org_id,
        "role": "client"
    })
    print("✅ Cliente criado: cliente@empresateste.com / cliente123")
    
    # 5. CANDIDATO
    candidate_user_id = f"user-{uuid.uuid4()}"
    candidate_id = f"candidate-{uuid.uuid4()}"
    
    await db.users.insert_one({
        "id": candidate_user_id,
        "email": "candidato@teste.com",
        "full_name": "Candidato Teste",
        "hashed_password": pwd_context.hash("candidato123"),
        "is_active": True,
        "requires_password_change": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    await db.user_org_roles.insert_one({
        "user_id": candidate_user_id,
        "organization_id": None,
        "role": "candidate"
    })
    await db.candidates.insert_one({
        "id": candidate_id,
        "user_id": candidate_user_id,
        "phone": "(11) 98765-4321",
        "email": "candidato@teste.com",
        "whatsapp": "(11) 98765-4321",
        "contact_email": "candidato@teste.com",
        "location_city": "São Paulo",
        "location_state": "SP",
        "address_zip_code": "01234-567",
        "address_street": "Rua Teste",
        "address_number": "123",
        "address_neighborhood": "Centro",
        "resume_url": "https://example.com/resume.pdf",
        "professional_summary": "Profissional com experiência em diversas áreas",
        "visibility": "pool",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    print("✅ Candidato criado: candidato@teste.com / candidato123")
    
    # 6. CRIAR 3 VAGAS SIMPLES
    print("\n=== CRIANDO VAGAS DE TESTE ===\n")
    
    job1_id = f"job-{uuid.uuid4()}"
    await db.jobs.insert_one({
        "id": job1_id,
        "title": "Desenvolvedor Full Stack",
        "description": "Desenvolvimento de aplicações web com React e Python",
        "status": "published",
        "tenant_id": org_id,
        "organization_id": org_id,
        "created_by": client_id,
        "recruitment_stage": "cadastro",
        "location": "São Paulo, SP",
        "location_city": "São Paulo",
        "location_state": "SP",
        "work_mode": "hibrido",
        "salary_range": "R$ 8.000 - R$ 12.000",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    print(f"✅ Vaga 1: Desenvolvedor Full Stack (cadastro)")
    
    job2_id = f"job-{uuid.uuid4()}"
    await db.jobs.insert_one({
        "id": job2_id,
        "title": "Analista de RH",
        "description": "Recrutamento e seleção de talentos",
        "status": "published",
        "tenant_id": org_id,
        "organization_id": org_id,
        "created_by": client_id,
        "recruitment_stage": "triagem",
        "location": "São Paulo, SP",
        "location_city": "São Paulo",
        "location_state": "SP",
        "work_mode": "presencial",
        "salary_range": "R$ 4.000 - R$ 6.000",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    print(f"✅ Vaga 2: Analista de RH (triagem)")
    
    job3_id = f"job-{uuid.uuid4()}"
    await db.jobs.insert_one({
        "id": job3_id,
        "title": "Designer UX/UI",
        "description": "Criação de interfaces e experiência do usuário",
        "status": "published",
        "tenant_id": org_id,
        "organization_id": org_id,
        "created_by": client_id,
        "recruitment_stage": "entrevistas",
        "location": "São Paulo, SP",
        "location_city": "São Paulo",
        "location_state": "SP",
        "work_mode": "remoto",
        "salary_range": "R$ 6.000 - R$ 10.000",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    print(f"✅ Vaga 3: Designer UX/UI (entrevistas)")
    
    print("\n=== RESUMO FINAL ===")
    print("\n📧 CREDENCIAIS:")
    print("  Admin:     admin@ciatos.com / admin123")
    print("  Analista:  analista@ciatos.com / analista123")
    print("  Cliente:   cliente@empresateste.com / cliente123")
    print("  Candidato: candidato@teste.com / candidato123")
    print(f"\n🏢 Organização: {org_id}")
    print(f"💼 Total de vagas: 3")
    print("\n✅ SETUP COMPLETO E FUNCIONAL!")

if __name__ == "__main__":
    asyncio.run(main())
