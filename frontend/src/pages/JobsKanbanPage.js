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
  }, []);
  
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
      // Abrir página de edição da vaga
      navigate(`/jobs/${job.id}/edit`);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/recruiter')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Voltar
              </button>
              <h1 className="text-xl font-bold text-gray-800">Kanban de Vagas</h1>
            </div>
            <button
              onClick={loadKanban}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>
      </nav>
      
      {/* Kanban Board */}
      <div className="p-6 overflow-x-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 min-w-max">
            {Object.keys(stageLabels).map((stageKey) => (
              <div key={stageKey} className="flex-shrink-0 w-80">
                <div className={`rounded-lg border-2 ${stageColors[stageKey]} p-4 h-full`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">{stageLabels[stageKey]}</h3>
                    <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-700">
                      {stages[stageKey]?.length || 0}
                    </span>
                  </div>
                  
                  <Droppable droppableId={stageKey}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[200px] ${
                          snapshot.isDraggingOver ? 'bg-blue-100 rounded-lg' : ''
                        }`}
                      >
                        {stages[stageKey]?.map((job, index) => (
                          <Draggable key={job.id} draggableId={job.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => handleCardClick(job, stageKey)}
                                className={`bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow ${
                                  snapshot.isDragging ? 'rotate-3' : ''
                                }`}
                              >
                                <h4 className="font-semibold text-gray-800 mb-2">{job.title}</h4>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span>👥</span>
                                    <span>{job.applications_count || 0} candidatos</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span>📍</span>
                                    <span>{job.work_mode || 'N/A'}</span>
                                  </div>
                                  {job.contratacao_result && (
                                    <div className="mt-2">
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
      
      {/* Modal de Contratação */}
      {showContratacaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Resultado da Contratação
            </h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Vaga: <strong>{selectedJob?.title}</strong>
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Resultado *
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="result"
                    value="positivo"
                    checked={contratacaoResult === 'positivo'}
                    onChange={(e) => setContratacaoResult(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-green-700">✅ Positivo (Vaga será fechada)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="result"
                    value="negativo"
                    checked={contratacaoResult === 'negativo'}
                    onChange={(e) => setContratacaoResult(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-red-700">❌ Negativo (Vaga volta para Entrevistas)</span>
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Observações
              </label>
              <textarea
                value={contratacaoNotes}
                onChange={(e) => setContratacaoNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Adicione observações sobre o resultado..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowContratacaoModal(false);
                  setSelectedJob(null);
                  setContratacaoNotes('');
                  setContratacaoResult('positivo');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleContratacaoSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsKanbanPage;
