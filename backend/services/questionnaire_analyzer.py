"""
Serviço de análise de questionários com IA
Usa Emergent LLM Key para gerar análises detalhadas
"""
import os
from typing import Dict, Any, List
from emergentintegrations.llm.chat import LlmChat, UserMessage


class QuestionnaireAnalyzer:
    """Analisa respostas de questionários e gera perfis com IA"""
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    async def _call_llm(self, prompt: str) -> str:
        """Helper para chamar o LLM"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id="questionnaire-analysis",
                system_message="Você é um especialista em análise de perfis profissionais e comportamentais."
            ).with_model("openai", "gpt-4o-mini")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return response.strip()
        except Exception as e:
            print(f"Erro ao chamar LLM: {e}")
            return ""
    
    async def analyze_disc(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analisa respostas do questionário DISC
        
        Args:
            responses: Lista de respostas com question_id, value, dimension
            
        Returns:
            {
                "scores": {"D": 75, "I": 60, "S": 45, "C": 80},
                "dominant_profile": "C",
                "report": "Relatório detalhado..."
            }
        """
        # Calcular pontuações por dimensão
        dimensions = {"D": [], "I": [], "S": [], "C": []}
        
        for resp in responses:
            dim = resp.get("dimension", "")
            value = resp.get("value", 0)
            if dim in dimensions:
                dimensions[dim].append(value)
        
        # Calcular médias (converter para escala 0-100)
        scores = {}
        for dim, values in dimensions.items():
            if values:
                avg = sum(values) / len(values)
                scores[dim] = round((avg / 5) * 100, 1)
            else:
                scores[dim] = 0
        
        # Identificar perfil dominante
        dominant = max(scores, key=scores.get)
        
        # Gerar relatório com IA
        prompt = f"""Você é um especialista em análise de perfil DISC.

Com base nas pontuações abaixo, gere um relatório profissional de 2-3 parágrafos sobre o perfil do candidato:

Pontuações DISC:
- Dominância (D): {scores['D']}%
- Influência (I): {scores['I']}%
- Estabilidade (S): {scores['S']}%
- Conformidade (C): {scores['C']}%

Perfil dominante: {dominant}

O relatório deve incluir:
1. Características principais do perfil dominante
2. Como o candidato trabalha em equipe
3. Pontos fortes e áreas de atenção
4. Recomendações para gestão e desenvolvimento

Seja objetivo, profissional e construtivo."""

        try:
            report = await self._call_llm(prompt)
            if not report:
                report = f"Perfil DISC com dominância em {dominant}. Pontuações: D={scores['D']}%, I={scores['I']}%, S={scores['S']}%, C={scores['C']}%"
        except Exception as e:
            print(f"Erro na análise DISC: {e}")
            report = f"Perfil DISC com dominância em {dominant}. Pontuações: D={scores['D']}%, I={scores['I']}%, S={scores['S']}%, C={scores['C']}%"
        
        return {
            "scores": scores,
            "dominant_profile": dominant,
            "report": report
        }
    
    async def analyze_recognition(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analisa respostas do questionário de Linguagens de Reconhecimento
        
        Args:
            responses: Lista de respostas com question_id, value, language
            
        Returns:
            {
                "scores": {"words": 85, "quality_time": 70, ...},
                "primary_language": "words",
                "secondary_language": "quality_time",
                "report": "Relatório detalhado..."
            }
        """
        # Calcular pontuações por linguagem
        languages = {
            "words": [],
            "quality_time": [],
            "gifts": [],
            "acts": [],
            "touch": []
        }
        
        for resp in responses:
            lang = resp.get("language", "")
            value = resp.get("value", 0)
            if lang in languages:
                languages[lang].append(value)
        
        # Calcular médias
        scores = {}
        for lang, values in languages.items():
            if values:
                avg = sum(values) / len(values)
                scores[lang] = round((avg / 5) * 100, 1)
            else:
                scores[lang] = 0
        
        # Identificar linguagens primária e secundária
        sorted_langs = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        primary = sorted_langs[0][0]
        secondary = sorted_langs[1][0] if len(sorted_langs) > 1 else primary
        
        # Mapeamento de nomes
        lang_names = {
            "words": "Palavras de Afirmação",
            "quality_time": "Tempo de Qualidade",
            "gifts": "Presentes",
            "acts": "Atos de Serviço",
            "touch": "Toque Físico"
        }
        
        # Gerar relatório com IA
        prompt = f"""Você é um especialista em linguagens de reconhecimento no ambiente corporativo.

Com base nas pontuações abaixo, gere um relatório profissional de 2-3 parágrafos sobre como o candidato prefere ser reconhecido:

Pontuações:
- Palavras de Afirmação: {scores['words']}%
- Tempo de Qualidade: {scores['quality_time']}%
- Presentes: {scores['gifts']}%
- Atos de Serviço: {scores['acts']}%
- Toque Físico: {scores['touch']}%

Linguagem primária: {lang_names[primary]}
Linguagem secundária: {lang_names[secondary]}

O relatório deve incluir:
1. Como o candidato prefere ser reconhecido
2. Formas efetivas de motivação
3. O que evitar no reconhecimento
4. Recomendações práticas para gestores

Seja prático, profissional e focado no ambiente de trabalho."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            
            report = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Erro na análise de Linguagens: {e}")
            report = f"Linguagem primária: {lang_names[primary]} ({scores[primary]}%). Linguagem secundária: {lang_names[secondary]} ({scores[secondary]}%)."
        
        return {
            "scores": scores,
            "primary_language": primary,
            "secondary_language": secondary,
            "report": report
        }
    
    async def analyze_behavioral(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analisa respostas do questionário de Perfil Comportamental
        
        Args:
            responses: Lista de respostas com question_id, value, competence
            
        Returns:
            {
                "scores": {"adaptability": 80, "resilience": 75, ...},
                "top_competences": ["adaptability", "communication", "teamwork"],
                "development_areas": ["time_management", "conflict_resolution"],
                "report": "Relatório detalhado..."
            }
        """
        # Calcular pontuações por competência
        competences = {}
        
        for resp in responses:
            comp = resp.get("competence", "")
            value = resp.get("value", 0)
            
            if comp not in competences:
                competences[comp] = []
            competences[comp].append(value)
        
        # Calcular médias
        scores = {}
        for comp, values in competences.items():
            if values:
                avg = sum(values) / len(values)
                scores[comp] = round((avg / 5) * 100, 1)
            else:
                scores[comp] = 0
        
        # Identificar top 5 e bottom 3
        sorted_comps = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_competences = [c[0] for c in sorted_comps[:5]]
        development_areas = [c[0] for c in sorted_comps[-3:]]
        
        # Mapeamento de nomes
        comp_names = {
            "adaptability": "Adaptabilidade",
            "resilience": "Resiliência",
            "teamwork": "Trabalho em Equipe",
            "communication": "Comunicação",
            "proactivity": "Proatividade",
            "conflict_resolution": "Resolução de Conflitos",
            "creativity": "Criatividade",
            "time_management": "Gestão de Tempo",
            "learning_agility": "Agilidade de Aprendizado",
            "leadership": "Liderança",
            "empathy": "Empatia",
            "focus": "Foco",
            "continuous_improvement": "Melhoria Contínua",
            "receptiveness": "Receptividade a Feedback",
            "flexibility": "Flexibilidade",
            "integrity": "Integridade",
            "motivation": "Motivação",
            "critical_thinking": "Pensamento Crítico",
            "reliability": "Confiabilidade",
            "collaboration": "Colaboração",
            "difficult_conversations": "Conversas Difíceis",
            "self_development": "Autodesenvolvimento",
            "enthusiasm": "Entusiasmo",
            "work_life_balance": "Equilíbrio Vida-Trabalho"
        }
        
        top_names = [comp_names.get(c, c) for c in top_competences]
        dev_names = [comp_names.get(c, c) for c in development_areas]
        
        # Gerar relatório com IA
        prompt = f"""Você é um especialista em análise de competências comportamentais.

Com base nas avaliações, gere um relatório profissional de 2-3 parágrafos sobre o perfil comportamental do candidato:

Top 5 Competências:
{', '.join([f'{c} ({scores[c]}%)' for c in top_competences])}

Áreas de Desenvolvimento:
{', '.join([f'{c} ({scores[c]}%)' for c in development_areas])}

O relatório deve incluir:
1. Visão geral das principais forças comportamentais
2. Como essas competências beneficiam a organização
3. Áreas que merecem atenção e desenvolvimento
4. Recomendações de desenvolvimento profissional

Seja equilibrado, construtivo e focado no potencial."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            
            report = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Erro na análise Comportamental: {e}")
            report = f"Principais competências: {', '.join(top_names)}. Áreas de desenvolvimento: {', '.join(dev_names)}."
        
        return {
            "scores": scores,
            "top_competences": top_competences,
            "development_areas": development_areas,
            "report": report
        }


# Instância global
analyzer = QuestionnaireAnalyzer()
