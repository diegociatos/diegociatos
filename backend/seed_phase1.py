#!/usr/bin/env python3
"""
Seed para FASE 1 - Dashboard do Analista
Popula: organizations, users, userOrgRoles, jobs, candidates, applications, interviews, notifications, auditLogs
"""
import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import random

sys.path.insert(0, str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from models import Organization, User, UserOrgRole, Job, Candidate, Application, Interview, Notification, AuditLog
from utils.auth import hash_password

load_dotenv(Path(__file__).parent / '.env')

# IDs fixos para referência
TENANT_TECHCORP = "tenant-techcorp-001"
TENANT_ALPHA = "tenant-alpha-002"

async def clear_collections(db):
    """Limpar coleções relevantes"""
    collections = ['applications', 'interviews', 'notifications', 'audit_logs']
    for col in collections:
        await db[col].delete_many({})
    print("✓ Coleções limpas")

async def seed_phase1(db):
    """Seed completo da Fase 1"""
    
    # 1. ORGANIZATIONS
    print("\n📦 Criando organizations...")
    orgs = [
        Organization(id=TENANT_TECHCORP, name="TechCorp", org_type="client", tax_id="11111111000100"),
        Organization(id=TENANT_ALPHA, name="AlphaFoods", org_type="client", tax_id="22222222000100")
    ]
    
    for org in orgs:
        existing = await db.organizations.find_one({"id": org.id})
        if not existing:
            await db.organizations.insert_one(org.model_dump())
            print(f"  ✓ {org.name}")
    
    # 2. USERS
    print("\n👤 Criando users...")
    users_data = [
        {"email": "admin@ciatos.com", "password": "admin123", "full_name": "Admin Ciatos", "id": "user-admin"},
        {"email": "recrutador@ciatos.com", "password": "recruiter123", "full_name": "Maria Recrutadora", "id": "user-recruiter"},
        {"email": "cliente@techcorp.com", "password": "client123", "full_name": "João Cliente", "id": "user-client"},
        {"email": "candidato1@email.com", "password": "candidato123", "full_name": "Ana Silva", "id": "user-cand1"},
        {"email": "candidato2@email.com", "password": "candidato123", "full_name": "Carlos Santos", "id": "user-cand2"},
        {"email": "candidato3@email.com", "password": "candidato123", "full_name": "Fernanda Lima", "id": "user-cand3"},
        {"email": "candidato4@email.com", "password": "candidato123", "full_name": "Rafael Costa", "id": "user-cand4"},
        {"email": "candidato5@email.com", "password": "candidato123", "full_name": "Juliana Souza", "id": "user-cand5"},
        {"email": "candidato6@email.com", "password": "candidato123", "full_name": "Pedro Oliveira", "id": "user-cand6"},
    ]
    
    users = []
    for u_data in users_data:
        existing = await db.users.find_one({"email": u_data["email"]})
        if existing:
            print(f"  ⊙ {u_data['full_name']} (já existe)")
            users.append(existing)
        else:
            user = User(
                id=u_data["id"],
                email=u_data["email"],
                password_hash=hash_password(u_data["password"]),
                full_name=u_data["full_name"],
                is_active=True
            )
            await db.users.insert_one(user.model_dump())
            users.append(user.model_dump())
            print(f"  ✓ {user.full_name}")
    
    # 3. USER_ORG_ROLES
    print("\n🔑 Criando userOrgRoles...")
    roles_data = [
        {"user_id": "user-admin", "tenant_id": TENANT_TECHCORP, "role": "admin"},
        {"user_id": "user-recruiter", "tenant_id": TENANT_TECHCORP, "role": "recruiter"},
        {"user_id": "user-recruiter", "tenant_id": TENANT_ALPHA, "role": "recruiter"},
        {"user_id": "user-client", "tenant_id": TENANT_TECHCORP, "role": "client"},
    ]
    
    for r_data in roles_data:
        existing = await db.user_org_roles.find_one({
            "user_id": r_data["user_id"],
            "organization_id": r_data["tenant_id"],
            "role": r_data["role"]
        })
        if not existing:
            role = UserOrgRole(
                user_id=r_data["user_id"],
                organization_id=r_data["tenant_id"],
                role=r_data["role"]
            )
            await db.user_org_roles.insert_one(role.model_dump())
            print(f"  ✓ {r_data['user_id']} -> {r_data['role']} @ {r_data['tenant_id']}")
    
    # 4. CANDIDATES
    print("\n👨‍💼 Criando candidates...")
    candidates_ids = ["user-cand1", "user-cand2", "user-cand3", "user-cand4", "user-cand5", "user-cand6"]
    candidates = []
    
    cities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre"]
    
    for idx, cand_user_id in enumerate(candidates_ids):
        existing = await db.candidates.find_one({"user_id": cand_user_id})
        if not existing:
            candidate = Candidate(
                user_id=cand_user_id,
                location_city=random.choice(cities),
                location_state="SP",
                location_country="Brasil",
                salary_expectation=random.randint(5000, 15000),
                availability="Imediato"
            )
            await db.candidates.insert_one(candidate.model_dump())
            candidates.append(candidate)
            print(f"  ✓ Candidate {idx+1}")
    
    # 5. JOBS
    print("\n💼 Criando jobs...")
    jobs_data = [
        {
            "id": "job-001",
            "tenant_id": TENANT_TECHCORP,
            "title": "Desenvolvedor Full Stack",
            "description": "Vaga para desenvolvedor experiente",
            "status": "published",
            "employment_type": "CLT",
            "created_by": "user-client"
        },
        {
            "id": "job-002",
            "tenant_id": TENANT_TECHCORP,
            "title": "Analista de Dados Sênior",
            "description": "Analista de dados com Python",
            "status": "in_review",
            "employment_type": "CLT",
            "created_by": "user-client"
        },
        {
            "id": "job-003",
            "tenant_id": TENANT_ALPHA,
            "title": "Gerente de Projetos",
            "description": "Gerente de projetos com experiência",
            "status": "published",
            "employment_type": "CLT",
            "created_by": "user-admin"
        },
        {
            "id": "job-004",
            "tenant_id": TENANT_ALPHA,
            "title": "Designer UX/UI",
            "description": "Designer com portfólio",
            "status": "paused",
            "employment_type": "PJ",
            "created_by": "user-admin"
        },
    ]
    
    jobs = []
    for j_data in jobs_data:
        existing = await db.jobs.find_one({"id": j_data["id"]})
        if not existing:
            job = Job(
                id=j_data["id"],
                organization_id=j_data["tenant_id"],
                title=j_data["title"],
                description=j_data["description"],
                status=j_data["status"],
                employment_type=j_data["employment_type"],
                created_by=j_data["created_by"],
                salary_min=5000,
                salary_max=12000
            )
            await db.jobs.insert_one(job.model_dump())
            jobs.append(job)
            print(f"  ✓ {job.title}")
    
    # 6. APPLICATIONS (30+) com stage_history
    print("\n📋 Criando applications com histórico...")
    stages = ["submitted", "screening", "recruiter_interview", "shortlisted", "client_interview", "offer", "hired", "rejected"]
    
    applications = []
    app_id_counter = 1
    
    # Distribuir applications entre as vagas
    for job_data in jobs_data:
        # Cada vaga terá entre 6-10 applications
        num_apps = random.randint(6, 10)
        
        # Pegar candidatos aleatórios, mas sem repetir para a mesma vaga
        used_candidates = []
        
        for i in range(num_apps):
            # Pegar candidato que ainda não aplicou para esta vaga
            available_cands = [c for c in candidates_ids if c not in used_candidates]
            if not available_cands:
                break
                
            candidate_user_id = random.choice(available_cands)
            used_candidates.append(candidate_user_id)
            
            candidate = await db.candidates.find_one({"user_id": candidate_user_id})
            
            # Verificar se já existe application
            existing_app = await db.applications.find_one({
                "job_id": job_data["id"],
                "candidate_id": candidate["id"]
            })
            
            if existing_app:
                continue
            
            # Definir estágio atual
            current_stage = random.choice(stages)
            
            # Criar histórico de mudanças (simular evolução)
            stage_history = []
            
            # Sempre começa em 'submitted'
            stage_history.append({
                "from": None,
                "to": "submitted",
                "changedBy": "user-recruiter",
                "changedAt": (datetime.now(timezone.utc) - timedelta(days=random.randint(5, 15))).isoformat(),
                "note": "Candidatura recebida"
            })
            
            # Se não está mais em submitted, adicionar evolução
            if current_stage != "submitted":
                stage_progression = ["screening", "recruiter_interview", "shortlisted", "client_interview", "offer", "hired"]
                current_idx = stage_progression.index(current_stage) if current_stage in stage_progression else 0
                
                for idx in range(current_idx + 1):
                    if idx < len(stage_progression):
                        stage_history.append({
                            "from": stage_progression[idx - 1] if idx > 0 else "submitted",
                            "to": stage_progression[idx],
                            "changedBy": "user-recruiter",
                            "changedAt": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 4))).isoformat(),
                            "note": f"Aprovado para {stage_progression[idx]}"
                        })
            
            application = Application(
                id=f"app-{app_id_counter:03d}",
                tenant_id=job_data["tenant_id"],
                job_id=job_data["id"],
                candidate_id=candidate["id"],
                current_stage=current_stage,
                status="active",
                scores={"total": random.randint(50, 95), "breakdown": {"skills": random.randint(40, 100)}},
                stage_history=stage_history
            )
            
            await db.applications.insert_one(application.model_dump())
            applications.append(application)
            app_id_counter += 1
    
    print(f"  ✓ {len(applications)} applications criadas")
    
    # 7. INTERVIEWS (algumas)
    print("\n📅 Criando interviews...")
    # Pegar algumas applications em estágio de entrevista
    apps_for_interview = [app for app in applications if app.current_stage in ["recruiter_interview", "client_interview"]]
    
    for idx, app in enumerate(apps_for_interview[:5]):  # apenas 5 interviews
        interview = Interview(
            tenant_id=app.tenant_id,
            application_id=app.id,
            interview_type="recruiter" if app.current_stage == "recruiter_interview" else "client",
            starts_at=datetime.now(timezone.utc) + timedelta(days=random.randint(1, 7)),
            ends_at=datetime.now(timezone.utc) + timedelta(days=random.randint(1, 7), hours=1),
            location={"type": "video_call", "details": "Google Meet"},
            interviewer_user_id="user-recruiter",
            status="scheduled",
            created_by="user-recruiter"
        )
        await db.interviews.insert_one(interview.model_dump())
        print(f"  ✓ Interview {idx+1}")
    
    # 8. NOTIFICATIONS (algumas de exemplo)
    print("\n🔔 Criando notifications...")
    notifications_data = [
        {"user_id": "user-recruiter", "title": "Nova candidatura", "body": "Nova candidatura para Desenvolvedor Full Stack"},
        {"user_id": "user-client", "title": "Vaga publicada", "body": "Sua vaga Desenvolvedor Full Stack foi publicada"},
    ]
    
    for n_data in notifications_data:
        notification = Notification(
            user_id=n_data["user_id"],
            tenant_id=TENANT_TECHCORP,
            channel="system",
            title=n_data["title"],
            body=n_data["body"],
            is_read=False
        )
        await db.notifications.insert_one(notification.model_dump())
        print(f"  ✓ {n_data['title']}")
    
    # 9. AUDIT_LOGS (alguns eventos)
    print("\n📝 Criando auditLogs...")
    for idx, job_data in enumerate(jobs_data[:2]):
        audit = AuditLog(
            actor_user_id=job_data["created_by"],
            tenant_id=job_data["tenant_id"],
            entity="job",
            entity_id=job_data["id"],
            action="created",
            new_values={"title": job_data["title"], "status": job_data["status"]}
        )
        await db.audit_logs.insert_one(audit.model_dump())
        print(f"  ✓ Audit log {idx+1}")
    
    print("\n✅ Seed da FASE 1 concluído com sucesso!")
    print(f"\n📊 Resumo:")
    print(f"   - Organizations: 2")
    print(f"   - Users: {len(users_data)}")
    print(f"   - Jobs: {len(jobs_data)}")
    print(f"   - Applications: {len(applications)}")
    print(f"   - Interviews: 5")
    print(f"   - Notifications: {len(notifications_data)}")

async def main():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Limpar dados antigos
    await clear_collections(db)
    
    # Executar seed
    await seed_phase1(db)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
