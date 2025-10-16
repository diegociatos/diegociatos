from typing import Dict, Any
import os
from emergentintegrations.llm.chat import LlmChat, UserMessage


class AssessmentService:
    def __init__(self):
        self.api_key = os.getenv("EMERGENT_LLM_KEY")
    
    async def analyze_assessment(self, kind: str, data: Dict[str, Any]) -> str:
        if kind == "disc":
            return await self._analyze_disc(data)
        elif kind == "behavioral":
            return await self._analyze_behavioral(data)
        elif kind == "recognition":
            return await self._analyze_recognition(data)
        else:
            return "Análise não disponível para este tipo"
    
    async def _analyze_disc(self, data: Dict[str, Any]) -> str:
        chat = LlmChat(
            api_key=self.api_key,
            session_id="disc-analysis",
            system_message="Você é um especialista em análise de perfil DISC."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"Analise o seguinte perfil DISC e forneça um resumo em 3-4 linhas sobre o perfil comportamental do candidato: {data}"
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return response
    
    async def _analyze_behavioral(self, data: Dict[str, Any]) -> str:
        chat = LlmChat(
            api_key=self.api_key,
            session_id="behavioral-analysis",
            system_message="Você é um psicólogo organizacional especializado em comportamento."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"Analise as respostas comportamentais e forneça um resumo sobre o perfil do candidato: {data}"
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return response
    
    async def _analyze_recognition(self, data: Dict[str, Any]) -> str:
        summary = "Perfil de Reconhecimento: "
        if data.get("top_language"):
            summary += f"Linguagem preferida: {data['top_language']}"
        return summary
