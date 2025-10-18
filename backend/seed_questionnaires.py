#!/usr/bin/env python3
"""
Script para popular questionários de avaliação de candidatos
- DISC (28 questões)
- Linguagens de Reconhecimento (30 questões)
- Perfil Comportamental (25 questões)
"""
import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from models import Questionnaire, Question

load_dotenv(Path(__file__).parent / '.env')


async def create_questionnaires(db):
    """Criar os 3 questionários de avaliação"""
    
    # Limpar questionários existentes (apenas os de avaliação)
    await db.questionnaires.delete_many({"key": {"$in": ["disc", "recognition", "behavioral"]}})
    await db.questions.delete_many({"questionnaire_id": {"$regex": "^(disc|recognition|behavioral)"}})
    
    print("✓ Questionários antigos removidos")
    
    # ========================================
    # 1. QUESTIONÁRIO DISC
    # ========================================
    print("\n📋 Criando Questionário DISC...")
    
    disc = Questionnaire(
        id="disc-questionnaire",
        key="disc",
        name="Perfil DISC",
        description="Avalie seu perfil comportamental profissional",
        created_at=datetime.now(timezone.utc)
    )
    await db.questionnaires.insert_one(disc.model_dump())
    
    disc_questions = [
        {"text": "Você prefere tomar decisões rapidamente sem muita análise?", "dimension": "D"},
        {"text": "Gosta de assumir o controle em situações difíceis?", "dimension": "D"},
        {"text": "Prefere competir a colaborar?", "dimension": "D"},
        {"text": "É direto ao ponto em suas comunicações?", "dimension": "D"},
        {"text": "Gosta de desafios e metas agressivas?", "dimension": "D"},
        {"text": "Prefere agir do que planejar detalhadamente?", "dimension": "D"},
        {"text": "Se sente confortável em tomar riscos calculados?", "dimension": "D"},
        
        {"text": "Gosta de conhecer pessoas novas frequentemente?", "dimension": "I"},
        {"text": "Prefere trabalhar em equipe do que sozinho?", "dimension": "I"},
        {"text": "É entusiasmado e expressa suas emoções abertamente?", "dimension": "I"},
        {"text": "Gosta de conversar e compartilhar ideias?", "dimension": "I"},
        {"text": "Prefere ambientes dinâmicos e com muita interação?", "dimension": "I"},
        {"text": "Se motiva facilmente com reconhecimento público?", "dimension": "I"},
        {"text": "Gosta de persuadir e influenciar outras pessoas?", "dimension": "I"},
        
        {"text": "Prefere rotinas e processos bem definidos?", "dimension": "S"},
        {"text": "É paciente e calmo em situações de pressão?", "dimension": "S"},
        {"text": "Valoriza a estabilidade mais que mudanças?", "dimension": "S"},
        {"text": "Prefere ouvir do que falar em reuniões?", "dimension": "S"},
        {"text": "É leal e comprometido com sua equipe?", "dimension": "S"},
        {"text": "Gosta de ajudar os outros sem esperar reconhecimento?", "dimension": "S"},
        {"text": "Prefere trabalhar em projetos de longo prazo?", "dimension": "S"},
        
        {"text": "É detalhista e presta atenção aos pequenos erros?", "dimension": "C"},
        {"text": "Gosta de seguir regras e procedimentos estabelecidos?", "dimension": "C"},
        {"text": "Prefere analisar dados antes de tomar decisões?", "dimension": "C"},
        {"text": "Valoriza precisão e qualidade acima de velocidade?", "dimension": "C"},
        {"text": "Prefere trabalhar com sistemas e processos organizados?", "dimension": "C"},
        {"text": "É cauteloso e evita erros a todo custo?", "dimension": "C"},
        {"text": "Gosta de questionar e validar informações antes de aceitar?", "dimension": "C"},
    ]
    
    for idx, q in enumerate(disc_questions):
        question = Question(
            questionnaire_id=disc.id,
            text=q["text"],
            question_type="scale",
            scale_min=1,
            scale_max=5,
            options=[
                {"value": 1, "label": "Discordo totalmente"},
                {"value": 2, "label": "Discordo"},
                {"value": 3, "label": "Neutro"},
                {"value": 4, "label": "Concordo"},
                {"value": 5, "label": "Concordo totalmente"}
            ],
            order_index=idx,
            created_at=datetime.now(timezone.utc)
        )
        question_dict = question.model_dump()
        question_dict["dimension"] = q["dimension"]  # Metadata para análise
        await db.questions.insert_one(question_dict)
    
    print(f"  ✓ {len(disc_questions)} perguntas DISC criadas")
    
    # ========================================
    # 2. LINGUAGENS DE RECONHECIMENTO
    # ========================================
    print("\n💬 Criando Questionário de Linguagens de Reconhecimento...")
    
    recognition = Questionnaire(
        id="recognition-questionnaire",
        key="recognition",
        name="Linguagens de Reconhecimento",
        description="Descubra como você prefere ser reconhecido",
        created_at=datetime.now(timezone.utc)
    )
    await db.questionnaires.insert_one(recognition.model_dump())
    
    recognition_questions = [
        {"text": "Me sinto valorizado quando recebo elogios verbais", "lang": "words"},
        {"text": "Gosto quando meu gestor dedica tempo para conversar comigo", "lang": "quality_time"},
        {"text": "Aprecio receber presentes ou brindes como reconhecimento", "lang": "gifts"},
        {"text": "Me sinto reconhecido quando alguém me ajuda com minhas tarefas", "lang": "acts"},
        {"text": "Um aperto de mão ou abraço de parabéns significa muito", "lang": "touch"},
        
        {"text": "Palavras de incentivo me motivam mais que qualquer outra coisa", "lang": "words"},
        {"text": "Valorizo quando meu chefe marca reuniões individuais comigo", "lang": "quality_time"},
        {"text": "Certificados e troféus são importantes para mim", "lang": "gifts"},
        {"text": "Quando alguém assume parte do meu trabalho, me sinto apoiado", "lang": "acts"},
        {"text": "Um tapinha nas costas de parabéns me deixa feliz", "lang": "touch"},
        
        {"text": "Mensagens de agradecimento me fazem sentir especial", "lang": "words"},
        {"text": "Prefiro uma conversa de 30 minutos a um email de elogio", "lang": "quality_time"},
        {"text": "Gosto de receber bônus em produtos ou vantagens", "lang": "gifts"},
        {"text": "Me sinto valorizado quando alguém faz algo difícil por mim", "lang": "acts"},
        {"text": "Gestos físicos de celebração são importantes para mim", "lang": "touch"},
        
        {"text": "Reconhecimento público verbal é o que mais me motiva", "lang": "words"},
        {"text": "Almoços ou cafés com o time são formas valiosas de reconhecimento", "lang": "quality_time"},
        {"text": "Prêmios e recompensas tangíveis são importantes", "lang": "gifts"},
        {"text": "Quando alguém me substitui em tarefas, me sinto cuidado", "lang": "acts"},
        {"text": "Cumprimentos físicos demonstram apreço genuíno", "lang": "touch"},
        
        {"text": "Feedback positivo por escrito tem muito valor para mim", "lang": "words"},
        {"text": "Sessões de mentoria são minha forma favorita de reconhecimento", "lang": "quality_time"},
        {"text": "Vale-presentes ou brindes personalizados me agradam", "lang": "gifts"},
        {"text": "Quando delegam tarefas chatas por mim, me sinto respeitado", "lang": "acts"},
        {"text": "High-fives e celebrações físicas são significativos", "lang": "touch"},
        
        {"text": "Cartas ou mensagens de reconhecimento são especiais", "lang": "words"},
        {"text": "Eventos de integração são formas importantes de valorização", "lang": "quality_time"},
        {"text": "Gosto de receber itens de marca da empresa", "lang": "gifts"},
        {"text": "Quando facilitam meu trabalho, me sinto reconhecido", "lang": "acts"},
        {"text": "Abraços ou contato físico demonstram reconhecimento genuíno", "lang": "touch"},
    ]
    
    for idx, q in enumerate(recognition_questions):
        question = Question(
            questionnaire_id=recognition.id,
            text=q["text"],
            question_type="scale",
            scale_min=1,
            scale_max=5,
            options=[
                {"value": 1, "label": "Discordo totalmente"},
                {"value": 2, "label": "Discordo"},
                {"value": 3, "label": "Neutro"},
                {"value": 4, "label": "Concordo"},
                {"value": 5, "label": "Concordo totalmente"}
            ],
            order_index=idx,
            created_at=datetime.now(timezone.utc)
        )
        question_dict = question.model_dump()
        question_dict["language"] = q["lang"]  # Metadata
        await db.questions.insert_one(question_dict)
    
    print(f"  ✓ {len(recognition_questions)} perguntas de Linguagens criadas")
    
    # ========================================
    # 3. PERFIL COMPORTAMENTAL
    # ========================================
    print("\n🎯 Criando Questionário de Perfil Comportamental...")
    
    behavioral = Questionnaire(
        id="behavioral-questionnaire",
        key="behavioral",
        name="Perfil Comportamental",
        description="Avalie suas competências comportamentais",
        created_at=datetime.now(timezone.utc)
    )
    await db.questionnaires.insert_one(behavioral.model_dump())
    
    behavioral_questions = [
        {"text": "Consigo me adaptar rapidamente a mudanças no trabalho", "comp": "adaptability"},
        {"text": "Mantenho a calma em situações de alta pressão", "comp": "resilience"},
        {"text": "Consigo trabalhar bem em equipe e colaborar efetivamente", "comp": "teamwork"},
        {"text": "Comunico minhas ideias de forma clara e objetiva", "comp": "communication"},
        {"text": "Tomo iniciativa sem precisar ser solicitado", "comp": "proactivity"},
        
        {"text": "Consigo resolver conflitos de forma diplomática", "comp": "conflict_resolution"},
        {"text": "Sou criativo na busca de soluções para problemas", "comp": "creativity"},
        {"text": "Organizo bem meu tempo e prioridades", "comp": "time_management"},
        {"text": "Aprendo rapidamente com meus erros", "comp": "learning_agility"},
        {"text": "Consigo liderar e influenciar outras pessoas", "comp": "leadership"},
        
        {"text": "Sou empático e compreendo os sentimentos dos outros", "comp": "empathy"},
        {"text": "Mantenho meu foco mesmo com distrações", "comp": "focus"},
        {"text": "Busco constantemente melhorar meu desempenho", "comp": "continuous_improvement"},
        {"text": "Aceito feedback construtivo de forma positiva", "comp": "receptiveness"},
        {"text": "Sou flexível em minha abordagem de trabalho", "comp": "flexibility"},
        
        {"text": "Demonstro integridade em minhas ações", "comp": "integrity"},
        {"text": "Consigo motivar e inspirar meus colegas", "comp": "motivation"},
        {"text": "Analiso situações de múltiplas perspectivas", "comp": "critical_thinking"},
        {"text": "Sou confiável e cumpro meus compromissos", "comp": "reliability"},
        {"text": "Demonstro resiliência diante de fracassos", "comp": "resilience"},
        
        {"text": "Colaboro ativamente em projetos de equipe", "comp": "collaboration"},
        {"text": "Comunico más notícias de forma apropriada", "comp": "difficult_conversations"},
        {"text": "Busco oportunidades de desenvolvimento pessoal", "comp": "self_development"},
        {"text": "Demonstro entusiasmo e energia no trabalho", "comp": "enthusiasm"},
        {"text": "Consigo equilibrar vida pessoal e profissional", "comp": "work_life_balance"},
    ]
    
    for idx, q in enumerate(behavioral_questions):
        question = Question(
            questionnaire_id=behavioral.id,
            text=q["text"],
            question_type="scale",
            scale_min=1,
            scale_max=5,
            options=[
                {"value": 1, "label": "Nunca"},
                {"value": 2, "label": "Raramente"},
                {"value": 3, "label": "Às vezes"},
                {"value": 4, "label": "Frequentemente"},
                {"value": 5, "label": "Sempre"}
            ],
            order_index=idx,
            created_at=datetime.now(timezone.utc)
        )
        question_dict = question.model_dump()
        question_dict["competence"] = q["comp"]  # Metadata
        await db.questions.insert_one(question_dict)
    
    print(f"  ✓ {len(behavioral_questions)} perguntas Comportamentais criadas")
    
    print("\n✅ Todos os questionários foram criados com sucesso!")


async def main():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    await create_questionnaires(db)
    
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
