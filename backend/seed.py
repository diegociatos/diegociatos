#!/usr/bin/env python3
import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from models import (
    Organization, User, UserOrgRole, Skill, 
    Questionnaire, Question
)
from utils.auth import hash_password

load_dotenv(Path(__file__).parent / '.env')

async def seed_database():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🌱 Iniciando seed do banco de dados...")
    
    # Criar organização agência
    agency = Organization(
        name="Ciatos Recrutamento",
        org_type="agency",
        tax_id="12345678000100"
    )
    await db.organizations.insert_one(agency.model_dump())
    print(f"✓ Organização agência criada: {agency.name}")
    
    # Criar organização cliente
    client_org = Organization(
        name="TechCorp Brasil",
        org_type="client",
        tax_id="98765432000199"
    )
    await db.organizations.insert_one(client_org.model_dump())
    print(f"✓ Organização cliente criada: {client_org.name}")
    
    # Criar usuário admin
    admin_user = User(
        email="admin@ciatos.com",
        password_hash=hash_password("admin123"),
        full_name="Administrador Sistema",
        phone="+5511999999999"
    )
    await db.users.insert_one(admin_user.model_dump())
    print(f"✓ Usuário admin criado: {admin_user.email}")
    
    # Criar papel admin
    admin_role = UserOrgRole(
        user_id=admin_user.id,
        organization_id=agency.id,
        role="admin"
    )
    await db.user_org_roles.insert_one(admin_role.model_dump())
    print(f"✓ Papel admin atribuído")
    
    # Criar usuário recrutador
    recruiter_user = User(
        email="recrutador@ciatos.com",
        password_hash=hash_password("recruiter123"),
        full_name="Maria Recrutadora",
        phone="+5511988888888",
        requires_password_change=False  # Para testes, deixar False
    )
    await db.users.insert_one(recruiter_user.model_dump())
    print(f"✓ Usuário recrutador criado: {recruiter_user.email}")
    
    # Criar papel recrutador
    recruiter_role = UserOrgRole(
        user_id=recruiter_user.id,
        organization_id=agency.id,
        role="recruiter"
    )
    await db.user_org_roles.insert_one(recruiter_role.model_dump())
    print(f"✓ Papel recrutador atribuído")
    
    # Criar usuário cliente
    client_user = User(
        email="cliente@techcorp.com",
        password_hash=hash_password("client123"),
        full_name="João Cliente",
        phone="+5511977777777",
        requires_password_change=False  # Para testes, deixar False
    )
    await db.users.insert_one(client_user.model_dump())
    print(f"✓ Usuário cliente criado: {client_user.email}")
    
    # Criar papel cliente
    client_role = UserOrgRole(
        user_id=client_user.id,
        organization_id=client_org.id,
        role="client"
    )
    await db.user_org_roles.insert_one(client_role.model_dump())
    print(f"✓ Papel cliente atribuído")
    
    # Criar habilidades
    skills_data = [
        {"name": "React", "category": "frontend"},
        {"name": "JavaScript", "category": "frontend"},
        {"name": "TypeScript", "category": "frontend"},
        {"name": "Python", "category": "backend"},
        {"name": "FastAPI", "category": "backend"},
        {"name": "MongoDB", "category": "database"},
        {"name": "Docker", "category": "devops"},
        {"name": "Git", "category": "tools"}
    ]
    
    for skill_data in skills_data:
        skill = Skill(**skill_data)
        await db.skills.insert_one(skill.model_dump())
    print(f"✓ {len(skills_data)} habilidades criadas")
    
    # Criar questionário DISC
    disc_questionnaire = Questionnaire(
        key="disc_autoral",
        name="Perfil DISC Autoral",
        description="Avaliação de perfil comportamental baseada em DISC"
    )
    await db.questionnaires.insert_one(disc_questionnaire.model_dump())
    print(f"✓ Questionário DISC criado")
    
    # Criar questões DISC
    disc_questions = [
        {
            "text": "Como você se descreve em situações de trabalho?",
            "question_type": "single",
            "options": [
                {"value": "D", "label": "Direto e objetivo"},
                {"value": "I", "label": "Comunicativo e entusiasmado"},
                {"value": "S", "label": "Paciente e colaborativo"},
                {"value": "C", "label": "Analítico e detalhista"}
            ],
            "order_index": 1
        },
        {
            "text": "Qual seu estilo de tomada de decisão?",
            "question_type": "single",
            "options": [
                {"value": "D", "label": "Rápido e decisivo"},
                {"value": "I", "label": "Baseado em pessoas"},
                {"value": "S", "label": "Consensual e cuidadoso"},
                {"value": "C", "label": "Baseado em dados e análise"}
            ],
            "order_index": 2
        }
    ]
    
    for q_data in disc_questions:
        question = Question(
            questionnaire_id=disc_questionnaire.id,
            **q_data
        )
        await db.questions.insert_one(question.model_dump())
    print(f"✓ {len(disc_questions)} questões DISC criadas")
    
    # Criar questionário Comportamental
    behavioral_questionnaire = Questionnaire(
        key="behavioral_autoral",
        name="Perfil Comportamental Autoral",
        description="Avaliação de competências comportamentais"
    )
    await db.questionnaires.insert_one(behavioral_questionnaire.model_dump())
    print(f"✓ Questionário Comportamental criado")
    
    # Criar índices
    await db.applications.create_index([("job_id", 1), ("candidate_id", 1)], unique=True)
    await db.users.create_index([("email", 1)], unique=True)
    await db.skills.create_index([("name", 1)], unique=True)
    print("✓ Índices criados")
    
    print("\n✅ Seed concluído com sucesso!")
    print("\n📝 Credenciais de teste:")
    print(f"   Admin: admin@ciatos.com / admin123")
    print(f"   Recrutador: recrutador@ciatos.com / recruiter123")
    print(f"   Cliente: cliente@techcorp.com / client123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
