#!/usr/bin/env python3
"""
Script para atualizar vagas existentes com recruitment_stage
"""
import asyncio
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

async def update_jobs():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Buscar todas as vagas sem recruitment_stage
    jobs_without_stage = await db.jobs.find(
        {"recruitment_stage": {"$exists": False}}
    ).to_list(None)
    
    print(f"Encontradas {len(jobs_without_stage)} vagas sem recruitment_stage")
    
    for job in jobs_without_stage:
        # Atualizar com stage padrão baseado no status
        stage = "cadastro"  # Padrão
        
        # Se a vaga está publicada, colocar na triagem
        if job.get("status") == "published":
            stage = "triagem"
        elif job.get("status") == "closed":
            stage = "contratacao"
        
        await db.jobs.update_one(
            {"id": job["id"]},
            {"$set": {"recruitment_stage": stage, "contratacao_result": None}}
        )
        print(f"✓ Atualizada vaga: {job['title']} -> {stage}")
    
    print(f"\n✅ {len(jobs_without_stage)} vagas atualizadas!")
    client.close()

if __name__ == "__main__":
    asyncio.run(update_jobs())
