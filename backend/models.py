from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
import uuid


def generate_id():
    return str(uuid.uuid4())


class Organization(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    org_type: Literal["agency", "client"]
    tax_id: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    email: EmailStr
    password_hash: Optional[str] = None
    full_name: str
    phone: Optional[str] = None
    picture: Optional[str] = None
    is_active: bool = True
    requires_password_change: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())


class UserOrgRole(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    organization_id: str
    role: Literal["admin", "recruiter", "client", "candidate"]
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class Candidate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    
    # Contatos
    phone: Optional[str] = None  # Telefone
    whatsapp: Optional[str] = None  # WhatsApp
    email: Optional[str] = None  # E-mail (pode ser diferente do login)
    
    birthdate: Optional[datetime] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    location_neighborhood: Optional[str] = None  # Bairro
    location_country: str = "Brasil"
    
    # Endereço completo
    address_street: Optional[str] = None  # Rua/Avenida
    address_number: Optional[str] = None  # Número
    address_complement: Optional[str] = None  # Complemento (apto, bloco, etc)
    address_zip_code: Optional[str] = None  # CEP
    
    # Currículo
    resume_url: Optional[str] = None  # URL ou path do currículo
    resume_filename: Optional[str] = None  # Nome original do arquivo
    resume_uploaded_at: Optional[datetime] = None  # Data do upload
    
    # Formação
    education_level: Optional[Literal["ensino_medio", "graduacao", "pos_graduacao", "mestrado", "doutorado"]] = None
    education_area: Optional[str] = None  # Área de formação (ex: Engenharia, Administração)
    education_institution: Optional[str] = None  # Nome da instituição
    education_course: Optional[str] = None  # Nome do curso específico
    
    salary_expectation: Optional[float] = None
    availability: Optional[str] = None
    visibility: Literal["private", "pool"] = "private"
    
    # Campos para busca por IA
    professional_summary: Optional[str] = None  # Resumo profissional
    
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())


class Skill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    category: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class CandidateSkill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    candidate_id: str
    skill_id: str
    level: int  # 1-5
    years: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class Experience(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    candidate_id: str
    company: str
    title: str
    start_date: datetime
    end_date: Optional[datetime] = None
    is_current: bool = False
    responsibilities: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class Education(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    candidate_id: str
    institution: str
    degree: str
    field: str
    start_year: int
    end_year: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class CandidateDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    candidate_id: str
    doc_type: Literal["resume", "cover_letter", "certificate", "other"]
    file_key: str
    parse_json: Optional[Dict[str, Any]] = None
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now())


class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    organization_id: str
    title: str
    description: str
    employment_type: Optional[str] = None
    schedule: Optional[str] = None
    benefits: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    location_country: str = "Brasil"
    work_mode: Literal["presencial", "hibrido", "remoto"] = "presencial"
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    status: Literal["draft", "in_review", "published", "paused", "closed"] = "draft"
    recruitment_stage: Literal["cadastro", "triagem", "entrevistas", "selecao", "envio_cliente", "contratacao"] = "cadastro"
    contratacao_result: Optional[Literal["positivo", "negativo"]] = None
    ideal_profile: Optional[Dict[str, Any]] = None
    blind_review: bool = False
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())


class JobRequiredSkill(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    job_id: str
    skill_id: str
    must_have: bool = False
    min_level: int = 1  # 1-5
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    tenant_id: str  # organization_id (tenantId)
    job_id: str
    candidate_id: str
    current_stage: Literal["submitted", "screening", "recruiter_interview", "shortlisted", "client_interview", "offer", "hired", "rejected", "withdrawn"] = "submitted"
    status: Literal["active", "withdrawn", "rejected", "hired"] = "active"
    scores: Optional[Dict[str, Any]] = None  # { total: Number, breakdown: {...} }
    stage_history: List[Dict[str, Any]] = Field(default_factory=list)  # [{ from?, to, changedBy, changedAt, note? }]
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())


class ApplicationStageHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    application_id: str
    from_stage: Optional[str] = None
    to_stage: str
    changed_by: str
    changed_at: datetime = Field(default_factory=lambda: datetime.now())
    note: Optional[str] = None


class Interview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    tenant_id: str  # organization_id
    application_id: str
    interview_type: Literal["recruiter", "client", "technical"]
    starts_at: datetime
    ends_at: datetime
    timezone: str = "America/Sao_Paulo"
    location: Dict[str, Any] = Field(default_factory=dict)  # {kind: onsite|video|phone, address?, meetUrl?, phone?}
    interviewer_user_id: Optional[str] = None
    created_by: str
    status: Literal["scheduled", "done", "no_show", "canceled"] = "scheduled"
    notes: Optional[str] = None
    confirmations: Dict[str, Any] = Field(default_factory=dict)  # {recruiter?, client?, candidate?}
    reminders: Dict[str, bool] = Field(default_factory=dict)  # {sent24h?, sent2h?}
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())


class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    application_id: str
    author_user_id: str
    role_context: Literal["recruiter", "client"]
    recommendation: Literal["advance", "hold", "reject"]
    comments: Optional[str] = None
    visibility: Literal["internal", "client", "candidate"] = "internal"
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class Questionnaire(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    key: str
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    questionnaire_id: str
    text: str
    question_type: Literal["single", "multiple", "scale", "text"]
    scale_min: Optional[int] = None
    scale_max: Optional[int] = None
    options: Optional[List[Dict[str, Any]]] = None
    order_index: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class QuestionnaireAssignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    application_id: str
    questionnaire_id: str
    assigned_at: datetime = Field(default_factory=lambda: datetime.now())
    completed_at: Optional[datetime] = None


class QuestionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    assignment_id: str
    question_id: str
    response_json: Dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class Assessment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    application_id: str
    kind: Literal["disc", "recognition", "behavioral"]
    data: Dict[str, Any]
    summary: Optional[str] = None
    score: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class Score(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    application_id: str
    total_score: float
    breakdown: Dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())


class Tag(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class CandidateTag(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    candidate_id: str
    tag_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class JobPublication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    job_id: str
    channel: str
    url: Optional[str] = None
    published_at: datetime = Field(default_factory=lambda: datetime.now())


class Consent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    candidate_id: str
    purpose: Literal["recruitment", "future_positions"]
    granted: bool
    granted_at: datetime = Field(default_factory=lambda: datetime.now())
    expires_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None


class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    tenant_id: Optional[str] = None  # organization_id
    channel: Literal["system", "email"]
    notification_type: str  # job_created, stage_changed, etc
    title: str
    body: str
    link: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    sent_at: Optional[datetime] = None
    status: Optional[Literal["pending", "sent", "failed"]] = None
    error_msg: Optional[str] = None


class NotificationPreferences(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    prefs: Dict[str, Dict[str, bool]] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())




class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    actor_user_id: Optional[str] = None
    tenant_id: Optional[str] = None  # organization_id
    entity: str
    entity_id: str
    action: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    occurred_at: datetime = Field(default_factory=lambda: datetime.now())


class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now())


class DataSubjectRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    candidate_id: str
    request_type: Literal["access", "rectify", "erase", "revoke_consent"]
    status: Literal["open", "done"] = "open"
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    resolved_at: Optional[datetime] = None


class JobStageHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    job_id: str
    from_stage: Optional[str] = None
    to_stage: str
    changed_by: str
    changed_at: datetime = Field(default_factory=lambda: datetime.now())
    notes: Optional[str] = None


class JobNote(BaseModel):
    """Anotações do analista sobre o processo seletivo da vaga"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=generate_id)
    job_id: str
    author_id: str  # ID do usuário que criou a nota
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

