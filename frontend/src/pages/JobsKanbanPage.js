import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../services/api';

const JobsKanbanPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState({});
  const [showContratacaoModal, setShowContratacaoModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [contratacaoResult, setContratacaoResult] = useState('positivo');
  const [contratacaoNotes, setContratacaoNotes] = useState('');
  const [userRole, setUserRole] = useState(null); // Para detectar se é cliente ou recrutador
  
  // Estados para comentários
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  
  const stageLabels = {
    cadastro: 'Cadastro da Vaga',
    triagem: 'Triagem de Currículos',
    entrevistas: 'Entrevistas',
    selecao: 'Seleção',
    envio_cliente: 'Envio do Cliente para Entrevista',
    contratacao: 'Contratação'
  };
  
  const stageIcons = {
    cadastro: '📋',
    triagem: '🔍',
    entrevistas: '💬',
    selecao: '⭐',
    envio_cliente: '📤',
    contratacao: '✅'
  };
  
  const stageColors = {
    cadastro: '#f3f4f6',
    triagem: '#dbeafe',
    entrevistas: '#fef3c7',
    selecao: '#e9d5ff',
    envio_cliente: '#fed7aa',
    contratacao: '#d1fae5'
  };
  
  useEffect(() => {
    loadKanban();
    checkUserRole();
  }, []);
  
  const checkUserRole = async () => {
    try {
      const res = await api.get('/users/me/roles');
      const roles = res.data || [];
      const isClient = roles.some(r => r.role === 'client');
      const isRecruiter = roles.some(r => r.role === 'recruiter' || r.role === 'admin');
      setUserRole(isClient ? 'client' : (isRecruiter ? 'recruiter' : null));
    } catch (err) {
      console.error('Erro ao verificar role:', err);
    }
  };
  
  const loadKanban = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs-kanban/kanban');
      setStages(res.data.stages || {});
    } catch (err) {
      console.error('Erro ao carregar kanban:', err);
      alert('Erro ao carregar kanban de vagas');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    // Se largou no mesmo lugar
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    
    const fromStage = source.droppableId;
    const toStage = destination.droppableId;
    const jobId = draggableId;
    
    // Se está movendo para "contratacao", abrir modal
    if (toStage === 'contratacao' && fromStage !== 'contratacao') {
      const job = stages[fromStage].find(j => j.id === jobId);
      setSelectedJob(job);
      setShowContratacaoModal(true);
      return;
    }
    
    // Atualizar UI otimisticamente
    const newStages = { ...stages };
    const [movedJob] = newStages[fromStage].splice(source.index, 1);
    newStages[toStage].splice(destination.index, 0, movedJob);
    setStages(newStages);
    
    // Atualizar no backend
    try {
      await api.patch(`/jobs-kanban/${jobId}/stage`, {
        to_stage: toStage
      });
    } catch (err) {
      console.error('Erro ao mover vaga:', err);
      alert('Erro ao mover vaga. Recarregando...');
      loadKanban();
    }
  };
  
  const handleContratacaoSubmit = async () => {
    if (!selectedJob) return;
    
    try {
      await api.patch(`/jobs-kanban/${selectedJob.id}/contratacao-result`, {
        result: contratacaoResult,
        notes: contratacaoNotes
      });
      
      setShowContratacaoModal(false);
      setSelectedJob(null);
      setContratacaoNotes('');
      setContratacaoResult('positivo');
      
      // Recarregar kanban
      loadKanban();
      
      if (contratacaoResult === 'positivo') {
        alert('Contratação positiva registrada! Vaga fechada com sucesso.');
      } else {
        alert('Contratação negativa registrada. Vaga retornou para Entrevistas.');
      }
    } catch (err) {
      console.error('Erro ao definir resultado:', err);
      alert('Erro ao definir resultado da contratação');
    }
  };
  
  const handleCardClick = (job, stage) => {
    // Se estiver na fase de contratação, abrir modal
    if (stage === 'contratacao') {
      setSelectedJob(job);
      setShowContratacaoModal(true);
    } else {
      // Buscar detalhes completos da vaga e abrir modal
      setSelectedJob(job);
      loadJobDetails(job.id);
      loadNotes(job.id);
      loadCandidates(job.id);
      setShowNotesModal(true);
    }
  };
  
  const loadJobDetails = async (jobId) => {
    try {
      const res = await api.get(`/jobs/${jobId}`);
      setSelectedJob(res.data);
    } catch (err) {
      console.error('Erro ao carregar detalhes da vaga:', err);
    }
  };
  
  const loadCandidates = async (jobId) => {
    try {
      setLoadingCandidates(true);
      const res = await api.get(`/applications?job_id=${jobId}`);
      setCandidates(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar candidatos:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };
  
  const loadNotes = async (jobId) => {
    try {
      setLoadingNotes(true);
      const res = await api.get(`/jobs-kanban/${jobId}/notes`);
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
    } finally {
      setLoadingNotes(false);
    }
  };
  
  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedJob) return;
    
    try {
      await api.post(`/jobs-kanban/${selectedJob.id}/notes`, {
        content: newNote
      });
      setNewNote('');
      loadNotes(selectedJob.id);
      alert('Anotação adicionada com sucesso!');
    } catch (err) {
      console.error('Erro ao adicionar nota:', err);
      alert('Erro ao adicionar anotação');
    }
  };
  
  const handleDeleteNote = async (noteId) => {
    if (!confirm('Deseja realmente deletar esta anotação?')) return;
    
    try {
      await api.delete(`/jobs-kanban/${selectedJob.id}/notes/${noteId}`);
      loadNotes(selectedJob.id);
      alert('Anotação deletada com sucesso!');
    } catch (err) {
      console.error('Erro ao deletar nota:', err);
      alert('Erro ao deletar anotação');
    }
  };
  
  const handleMoveToNextStage = async () => {
    if (!selectedJob) return;
    
    const stageOrder = ['cadastro', 'triagem', 'entrevistas', 'selecao', 'envio_cliente', 'contratacao'];
    const currentStageIndex = stageOrder.indexOf(selectedJob.recruitment_stage);
    
    if (currentStageIndex === -1 || currentStageIndex >= stageOrder.length - 1) {
      alert('Esta vaga já está na última fase ou precisa definir resultado de contratação');
      return;
    }
    
    const nextStage = stageOrder[currentStageIndex + 1];
    
    if (!confirm(`Mover vaga para: ${stageLabels[nextStage]}?`)) return;
    
    try {
      await api.patch(`/jobs-kanban/${selectedJob.id}/stage`, {
        to_stage: nextStage
      });
      
      setShowNotesModal(false);
      setSelectedJob(null);
      loadKanban();
      alert(`Vaga movida para: ${stageLabels[nextStage]}`);
    } catch (err) {
      console.error('Erro ao mover vaga:', err);
      alert('Erro ao mover vaga');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando kanban...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-800">📊 Kanban de Vagas</h1>
              {userRole === 'client' && (
                <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                  👁️ Modo Visualização
                </div>
              )}
            </div>
            <button
              onClick={loadKanban}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </nav>
      
      {/* Kanban Board */}
      <div className="p-6 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 min-w-max pb-6">
            {Object.keys(stageLabels).map((stageKey) => (
              <div key={stageKey} className="flex-shrink-0 w-80">
                {/* Column Header - Estilo Trello */}
                <div 
                  className="rounded-t-xl p-4 mb-2"
                  style={{ backgroundColor: stageColors[stageKey] }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{stageIcons[stageKey]}</span>
                      <h3 className="font-bold text-gray-800 text-sm">{stageLabels[stageKey]}</h3>
                    </div>
                    <span className="bg-white bg-opacity-80 px-2.5 py-1 rounded-full text-xs font-bold text-gray-700">
                      {stages[stageKey]?.length || 0}
                    </span>
                  </div>
                </div>
                
                {/* Cards Container */}
                <Droppable droppableId={stageKey}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[400px] p-2 rounded-b-xl transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-100 bg-opacity-50' : 'bg-transparent'
                      }`}
                    >
                      {stages[stageKey]?.map((job, index) => (
                        <Draggable 
                          key={job.id} 
                          draggableId={job.id} 
                          index={index}
                          isDragDisabled={userRole === 'client'}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 ${
                                snapshot.isDragging ? 'shadow-2xl rotate-3 scale-105' : ''
                              }`}
                            >
                              {/* Card Content */}
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-2" {...provided.dragHandleProps}>
                                  <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
                                    {job.title}
                                  </h4>
                                  {userRole === 'recruiter' && (
                                    <div className="text-gray-400 ml-2" title="Arraste para mover">
                                      ⋮⋮
                                    </div>
                                  )}
                                </div>
                                
                                {/* Card Details */}
                                <div className="space-y-2">
                                  {/* Candidatos */}
                                  <div className="flex items-center text-xs text-gray-600">
                                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                    </svg>
                                    <span className="font-medium">{job.applications_count || 0}</span>
                                    <span className="ml-1">candidatos</span>
                                  </div>
                                  
                                  {/* Modo de Trabalho */}
                                  <div className="flex items-center">
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                      </svg>
                                      {job.work_mode === 'presencial' ? 'Presencial' : 
                                       job.work_mode === 'remoto' ? 'Remoto' : 
                                       job.work_mode === 'hibrido' ? 'Híbrido' : 'N/A'}
                                    </span>
                                  </div>
                                  
                                  {/* Resultado da Contratação */}
                                  {job.contratacao_result && (
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                                        job.contratacao_result === 'positivo' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {job.contratacao_result === 'positivo' ? '✅ Positivo' : '❌ Negativo'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Card Footer */}
                              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="flex items-center text-xs text-gray-500">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    {job.updated_at ? new Date(job.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '-'}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCardClick(job, stageKey);
                                    }}
                                    className="text-blue-600 font-medium hover:underline text-xs"
                                  >
                                    Ver detalhes →
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {/* Empty State */}
                      {(!stages[stageKey] || stages[stageKey].length === 0) && !snapshot.isDraggingOver && (
                        <div className="text-center py-8 text-gray-400">
                          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-sm">Nenhuma vaga</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
      

      {/* Modal de Notas/Comentários */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {selectedJob?.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm rounded-full font-medium">
                      {stageLabels[selectedJob?.recruitment_stage]}
                    </span>
                    <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm rounded-full font-medium">
                      {selectedJob?.status === 'draft' ? '📝 Rascunho' : 
                       selectedJob?.status === 'published' ? '✅ Publicada' : 
                       selectedJob?.status === 'closed' ? '🔒 Fechada' : 
                       selectedJob?.status === 'paused' ? '⏸️ Pausada' : selectedJob?.status}
                    </span>
                    <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-sm rounded-full font-medium">
                      👥 {selectedJob?.applications_count || 0} candidatos
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowNotesModal(false);
                    setSelectedJob(null);
                    setNotes([]);
                    setNewNote('');
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Body - 2 Colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-h-[600px] overflow-y-auto">
              
              {/* COLUNA ESQUERDA - Detalhes da Vaga */}
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                    <span className="text-2xl mr-2">📋</span>
                    Informações da Vaga
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Descrição */}
                    {selectedJob?.description && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Descrição:</label>
                        <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">{selectedJob.description}</p>
                      </div>
                    )}
                    
                    {/* Tipo de Emprego */}
                    {selectedJob?.employment_type && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Tipo de Emprego:</label>
                        <p className="text-gray-700 text-sm mt-1">{selectedJob.employment_type}</p>
                      </div>
                    )}
                    
                    {/* Jornada */}
                    {selectedJob?.schedule && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Jornada:</label>
                        <p className="text-gray-700 text-sm mt-1">{selectedJob.schedule}</p>
                      </div>
                    )}
                    
                    {/* Localização */}
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Localização:</label>
                      <p className="text-gray-700 text-sm mt-1">
                        📍 {selectedJob?.location_city || 'N/A'}, {selectedJob?.location_state || 'N/A'} - {selectedJob?.location_country || 'Brasil'}
                      </p>
                      <p className="text-gray-700 text-sm">
                        {selectedJob?.work_mode === 'presencial' ? '🏢 Presencial' : 
                         selectedJob?.work_mode === 'remoto' ? '🏠 Remoto' : 
                         selectedJob?.work_mode === 'hibrido' ? '🔄 Híbrido' : ''}
                      </p>
                    </div>
                    
                    {/* Salário */}
                    {(selectedJob?.salary_min || selectedJob?.salary_max) && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Faixa Salarial:</label>
                        <p className="text-gray-700 text-sm mt-1">
                          💰 R$ {selectedJob.salary_min?.toLocaleString('pt-BR') || '0'} - R$ {selectedJob.salary_max?.toLocaleString('pt-BR') || '0'}
                        </p>
                      </div>
                    )}
                    
                    {/* Benefícios */}
                    {selectedJob?.benefits && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Benefícios:</label>
                        <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">{selectedJob.benefits}</p>
                      </div>
                    )}
                    
                    {/* Datas */}
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Criada em: {selectedJob?.created_at ? new Date(selectedJob.created_at).toLocaleString('pt-BR') : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Atualizada em: {selectedJob?.updated_at ? new Date(selectedJob.updated_at).toLocaleString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                

                {/* Candidatos */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                    <span className="text-2xl mr-2">👥</span>
                    Candidatos ({candidates.length})
                  </h4>
                  
                  {loadingCandidates ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600 text-xs">Carregando...</p>
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm">Nenhum candidato ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {candidates.slice(0, 10).map((candidate) => (
                        <div key={candidate.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{candidate.candidate_name || 'Nome não disponível'}</p>
                            <p className="text-xs text-gray-500">
                              Fase: {candidate.currentStage === 'submitted' ? 'Inscrito' :
                                     candidate.currentStage === 'screening' ? 'Triagem' :
                                     candidate.currentStage === 'recruiter_interview' ? 'Entrevista Recrutador' :
                                     candidate.currentStage === 'shortlisted' ? 'Pré-selecionado' :
                                     candidate.currentStage === 'client_interview' ? 'Entrevista Cliente' :
                                     candidate.currentStage === 'offer' ? 'Proposta' :
                                     candidate.currentStage === 'hired' ? 'Contratado' :
                                     candidate.currentStage === 'rejected' ? 'Rejeitado' : candidate.currentStage}
                            </p>
                          </div>
                          <button
                            onClick={() => navigate(`/applications/${candidate.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Ver →
                          </button>
                        </div>
                      ))}
                      {candidates.length > 10 && (
                        <p className="text-center text-xs text-gray-500 py-2">
                          +{candidates.length - 10} candidatos. <button onClick={() => navigate(`/jobs/${selectedJob?.id}/pipeline`)} className="text-blue-600 font-medium">Ver todos</button>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                    <span className="text-xl mr-2">⚡</span>
                    Ações Rápidas
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/jobs/${selectedJob?.id}/edit`)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar Vaga Completa
                    </button>
                    <button
                      onClick={() => navigate(`/jobs/${selectedJob?.id}/pipeline`)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Ver Pipeline de Candidatos
                    </button>
                    {userRole === 'recruiter' && selectedJob?.recruitment_stage !== 'contratacao' && (
                      <button
                        onClick={handleMoveToNextStage}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Mover para Próxima Fase
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* COLUNA DIREITA - Anotações */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                    <span className="text-2xl mr-2">📝</span>
                    Anotações do Processo
                  </h4>
                  
                  {/* Lista de Anotações */}
                  <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                    {loadingNotes ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600 text-sm">Carregando...</p>
                      </div>
                    ) : notes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-10 w-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium">Nenhuma anotação</p>
                        <p className="text-xs mt-1">Adicione abaixo</p>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">
                                {note.author?.full_name || 'Usuário'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(note.created_at).toLocaleString('pt-BR')}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Deletar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Nova Anotação */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nova Anotação
                    </label>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Ex: Candidato João aprovado na triagem, Cliente pediu 3 finalistas até sexta..."
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      ➕ Adicionar Anotação
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedJob(null);
                  setNotes([]);
                  setNewNote('');
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Contratação */}
      {showContratacaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <span className="text-3xl mr-3">🎯</span>
                  Resultado da Contratação
                </h3>
                <button
                  onClick={() => {
                    setShowContratacaoModal(false);
                    setSelectedJob(null);
                    setContratacaoNotes('');
                    setContratacaoResult('positivo');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Vaga:</p>
                <p className="font-bold text-gray-900 text-lg">{selectedJob?.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Qual foi o resultado? *
                </label>
                <div className="space-y-3">
                  <label 
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      contratacaoResult === 'positivo' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="result"
                      value="positivo"
                      checked={contratacaoResult === 'positivo'}
                      onChange={(e) => setContratacaoResult(e.target.value)}
                      className="w-5 h-5 text-green-600"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">✅</span>
                        <span className="font-bold text-green-700">Positivo</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Candidato foi contratado (vaga será fechada)</p>
                    </div>
                  </label>
                  
                  <label 
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      contratacaoResult === 'negativo' 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="result"
                      value="negativo"
                      checked={contratacaoResult === 'negativo'}
                      onChange={(e) => setContratacaoResult(e.target.value)}
                      className="w-5 h-5 text-red-600"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">❌</span>
                        <span className="font-bold text-red-700">Negativo</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Candidato recusou/não aprovado (vaga volta para Entrevistas)</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={contratacaoNotes}
                  onChange={(e) => setContratacaoNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Adicione observações sobre o resultado da contratação..."
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 rounded-b-xl flex space-x-3">
              <button
                onClick={() => {
                  setShowContratacaoModal(false);
                  setSelectedJob(null);
                  setContratacaoNotes('');
                  setContratacaoResult('positivo');
                }}
                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleContratacaoSubmit}
                className={`flex-1 px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                  contratacaoResult === 'positivo'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirmar Resultado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsKanbanPage;
