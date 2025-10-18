from fastapi import APIRouter, HTTPException, Request, Cookie, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from server import db
from utils.auth import get_current_user
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()


class AdvancedSearchRequest(BaseModel):
    # Busca por texto
    query: Optional[str] = None
    
    # Localização
    city: Optional[str] = None
    state: Optional[str] = None
    neighborhood: Optional[str] = None
    
    # Formação
    education_level: Optional[str] = None
    education_area: Optional[str] = None
    education_institution: Optional[str] = None
    
    # Idade
    age_range: Optional[str] = None  # "18-25", "26-35", "36-45", "46-55", "56+"
    
    # Skills
    skills: Optional[List[str]] = None
    
    # Busca por IA
    use_ai: bool = False
    ai_query: Optional[str] = None


@router.post("/advanced-search")
async def advanced_search_candidates(
    search: AdvancedSearchRequest,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Busca avançada de candidatos com múltiplos filtros e busca por IA
    """
    user = await get_current_user(request, session_token)
    
    # Construir query MongoDB
    mongo_query = {}
    
    # Filtros de localização
    if search.city:
        mongo_query["location_city"] = {"$regex": search.city, "$options": "i"}
    if search.state:
        mongo_query["location_state"] = {"$regex": search.state, "$options": "i"}
    if search.neighborhood:
        mongo_query["location_neighborhood"] = {"$regex": search.neighborhood, "$options": "i"}
    
    # Filtros de formação
    if search.education_level:
        mongo_query["education_level"] = search.education_level
    if search.education_area:
        mongo_query["education_area"] = {"$regex": search.education_area, "$options": "i"}
    if search.education_institution:
        mongo_query["education_institution"] = {"$regex": search.education_institution, "$options": "i"}
    
    # Filtro de idade
    if search.age_range:
        age_ranges = {
            "18-25": (18, 25),
            "26-35": (26, 35),
            "36-45": (36, 45),
            "46-55": (46, 55),
            "56+": (56, 150)
        }
        if search.age_range in age_ranges:
            min_age, max_age = age_ranges[search.age_range]
            current_year = datetime.now(timezone.utc).year
            
            max_birth_year = current_year - min_age
            min_birth_year = current_year - max_age
            
            mongo_query["birthdate"] = {
                "$gte": datetime(min_birth_year, 1, 1),
                "$lte": datetime(max_birth_year, 12, 31, 23, 59, 59)
            }
    
    # Buscar candidatos
    candidates = await db.candidates.find(mongo_query, {"_id": 0}).to_list(None)
    
    # Enriquecer com dados do usuário
    for candidate in candidates:
        user_data = await db.users.find_one(
            {"id": candidate["user_id"]},
            {"_id": 0, "id": 1, "full_name": 1, "email": 1}
        )
        if user_data:
            candidate["user"] = user_data
        
        # Buscar skills
        if search.skills:
            candidate_skills = await db.candidate_skills.find(
                {"candidate_id": candidate["id"]},
                {"_id": 0}
            ).to_list(None)
            
            # Buscar nomes das skills
            skill_ids = [cs["skill_id"] for cs in candidate_skills]
            skills = await db.skills.find(
                {"id": {"$in": skill_ids}},
                {"_id": 0, "id": 1, "name": 1}
            ).to_list(None)
            
            candidate["skills"] = skills
            
            # Filtrar por skills se especificado
            if search.skills:
                skill_names = [s["name"].lower() for s in skills]
                if not any(req_skill.lower() in skill_names for req_skill in search.skills):
                    candidates.remove(candidate)
                    continue
    
    # Busca por texto simples
    if search.query and not search.use_ai:
        query_lower = search.query.lower()
        filtered_candidates = []
        for candidate in candidates:
            # Buscar em nome, email, resumo, formação
            searchable_text = " ".join([
                candidate.get("user", {}).get("full_name", ""),
                candidate.get("user", {}).get("email", ""),
                candidate.get("professional_summary", ""),
                candidate.get("education_area", ""),
                candidate.get("education_course", ""),
                candidate.get("education_institution", ""),
            ]).lower()
            
            if query_lower in searchable_text:
                filtered_candidates.append(candidate)
        
        candidates = filtered_candidates
    
    # Busca por IA
    if search.use_ai and search.ai_query:
        try:
            candidates_with_scores = await ai_semantic_search(
                search.ai_query,
                candidates
            )
            return {
                "total": len(candidates_with_scores),
                "candidates": candidates_with_scores,
                "used_ai": True
            }
        except Exception as e:
            print(f"Erro na busca por IA: {e}")
            # Fallback para busca normal
            pass
    
    return {
        "total": len(candidates),
        "candidates": candidates,
        "used_ai": False
    }


async def ai_semantic_search(query: str, candidates: List[dict]) -> List[dict]:
    """
    Usa IA para fazer busca semântica e rankear candidatos
    """
    # Inicializar chat LLM
    chat = LlmChat(
        api_key=os.getenv("EMERGENT_LLM_KEY"),
        session_id="candidate-search",
        system_message="""Você é um assistente especializado em recrutamento. 
Sua função é analisar perfis de candidatos e rankeá-los de acordo com a relevância para uma busca específica.
Retorne APENAS um JSON array com os IDs dos candidatos ordenados por relevância (do mais relevante ao menos relevante).
Formato: ["id1", "id2", "id3", ...]"""
    ).with_model("openai", "gpt-4o-mini")
    
    # Preparar informações dos candidatos para a IA
    candidates_summary = []
    for candidate in candidates:
        summary = {
            "id": candidate["id"],
            "name": candidate.get("user", {}).get("full_name", "N/A"),
            "education_level": candidate.get("education_level", "N/A"),
            "education_area": candidate.get("education_area", "N/A"),
            "education_course": candidate.get("education_course", "N/A"),
            "location": f"{candidate.get('location_city', '')}, {candidate.get('location_state', '')}",
            "professional_summary": candidate.get("professional_summary", "N/A"),
            "skills": [s["name"] for s in candidate.get("skills", [])]
        }
        candidates_summary.append(summary)
    
    # Criar prompt
    prompt = f"""
Busca: "{query}"

Candidatos disponíveis:
{candidates_summary}

Analise cada candidato e ordene-os por relevância para a busca. 
Retorne APENAS um array JSON com os IDs ordenados, exemplo: ["id1", "id2", "id3"]
"""
    
    # Enviar para IA
    user_message = UserMessage(text=prompt)
    response = await chat.send_message(user_message)
    
    # Parse da resposta
    import json
    import re
    
    # Extrair JSON da resposta
    json_match = re.search(r'\[.*\]', response, re.DOTALL)
    if json_match:
        ranked_ids = json.loads(json_match.group())
        
        # Reordenar candidatos baseado no ranking da IA
        ranked_candidates = []
        candidates_dict = {c["id"]: c for c in candidates}
        
        for candidate_id in ranked_ids:
            if candidate_id in candidates_dict:
                candidate = candidates_dict[candidate_id].copy()
                candidate["ai_relevance_score"] = len(ranked_ids) - ranked_ids.index(candidate_id)
                ranked_candidates.append(candidate)
        
        # Adicionar candidatos não rankeados no final
        for candidate in candidates:
            if candidate["id"] not in ranked_ids:
                candidate["ai_relevance_score"] = 0
                ranked_candidates.append(candidate)
        
        return ranked_candidates
    
    # Se falhar, retornar ordem original
    return candidates


@router.get("/education-options")
async def get_education_options(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna opções disponíveis para filtros de formação
    """
    await get_current_user(request, session_token)
    
    return {
        "education_levels": [
            {"value": "ensino_medio", "label": "Ensino Médio"},
            {"value": "graduacao", "label": "Graduação"},
            {"value": "pos_graduacao", "label": "Pós-graduação"},
            {"value": "mestrado", "label": "Mestrado"},
            {"value": "doutorado", "label": "Doutorado"}
        ],
        "age_ranges": [
            {"value": "18-25", "label": "18-25 anos"},
            {"value": "26-35", "label": "26-35 anos"},
            {"value": "36-45", "label": "36-45 anos"},
            {"value": "46-55", "label": "46-55 anos"},
            {"value": "56+", "label": "56+ anos"}
        ]
    }
