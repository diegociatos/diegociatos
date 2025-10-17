import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import api from '../services/api';
import InterviewModal from '../components/InterviewModal';

const JobPipelinePage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pipeline, setPipeline] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [filters, setFilters] = useState({ search: '', city: '', minScore: '', hasMustHave: false });
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  useEffect(() => {
    loadPipeline();
  }, [jobId]);
  
  const loadPipeline = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Construir query params com filtros
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.minScore) params.append('min_score', filters.minScore);
      if (filters.hasMustHave) params.append('has_must_have', 'true');
      
      const res = await api.get(`/applications/${jobId}/pipeline?${params.toString()}`);
      setPipeline(res.data);
    } catch (err) {
      console.error('Erro ao carregar pipeline:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar pipeline');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveCard(pipeline.cards.find(c => c.applicationId === active.id));
  };
  
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveCard(null);
      return;
    }
    
    const applicationId = active.id;
    const toStage = over.id;
    
    // Encontrar card
    const card = pipeline.cards.find(c => c.applicationId === applicationId);
    if (!card || card.currentStage === toStage) {
      setActiveCard(null);
      return;
    }
    
    // Optimistic UI - mover card imediatamente
    const oldStage = card.currentStage;
    const updatedCards = pipeline.cards.map(c =>
      c.applicationId === applicationId ? { ...c, currentStage: toStage } : c
    );
    
    // Atualizar contadores
    const updatedColumns = pipeline.columns.map(col => {
      if (col.key === oldStage) return { ...col, count: col.count - 1 };
      if (col.key === toStage) return { ...col, count: col.count + 1 };
      return col;
    });
    
    setPipeline({
      ...pipeline,
      cards: updatedCards,
      columns: updatedColumns
    });
    
    try {
      // Chamar API
      let note = null;
      if (toStage === 'rejected') {
        note = prompt('Por favor, informe o motivo da reprovação:');
        if (!note) {
          // Rollback se cancelar
          loadPipeline();
          setActiveCard(null);
          return;
        }
      }
      
      await api.post(`/applications/${applicationId}/move`, {
        to_stage: toStage,
        note
      });
      
      // Recarregar para garantir sincronização
      await loadPipeline();
      
    } catch (err) {
      console.error('Erro ao mover card:', err);
      alert(err.response?.data?.detail || 'Erro ao mover candidato');
      // Rollback
      await loadPipeline();
    } finally {
      setActiveCard(null);
    }
  };
  
  const KanbanCard = ({ card }) => (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow cursor-move">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{card.candidateName}</h4>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          card.scoreTotal >= 80 ? 'bg-green-100 text-green-800' :
          card.scoreTotal >= 60 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {card.scoreTotal}
        </span>
      </div>
      
      {card.candidateCity && (
        <p className="text-sm text-gray-500 mb-2">📍 {card.candidateCity}</p>
      )}
      
      <div className="flex flex-wrap gap-1 mt-2">
        {card.badges.mustHaveOk && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
            ✓ Must-have
          </span>
        )}
        {card.badges.availability && (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
            {card.badges.availability}
          </span>
        )}
        {card.badges.cultureMatch && (
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
            Cultura: {card.badges.cultureMatch}
          </span>
        )}
      </div>
      
      <div className="mt-3 flex gap-2 text-xs">
        <button
          onClick={(e) => {
            e.stopPropagation();
            alert('Ver perfil - Fase 3');
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          Ver perfil
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/applications/${card.applicationId}/history`);
          }}
          className="text-gray-600 hover:text-gray-800"
        >
          Histórico
        </button>
      </div>
    </div>
  );
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando pipeline...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Voltar
          </button>
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
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Voltar
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{pipeline?.job?.title}</h1>
                <p className="text-sm text-gray-500">{pipeline?.job?.clientName}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Filtros */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-full mx-auto flex gap-3 items-center">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Cidade..."
            value={filters.city}
            onChange={(e) => setFilters({...filters, city: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Score mínimo..."
            value={filters.minScore}
            onChange={(e) => setFilters({...filters, minScore: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={filters.hasMustHave}
              onChange={(e) => setFilters({...filters, hasMustHave: e.target.checked})}
              className="rounded border-gray-300"
            />
            <span>Apenas must-have</span>
          </label>
          <button
            onClick={loadPipeline}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
      
      {/* Kanban Board */}
      <div className="p-4 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max">
            {pipeline?.columns?.map((column) => {
              const columnCards = pipeline.cards.filter(c => c.currentStage === column.key);
              
              return (
                <div key={column.key} className="bg-gray-100 rounded-lg p-3 w-80 flex-shrink-0">
                  {/* Column Header */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-gray-800">{column.label}</h3>
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                        {column.count}
                      </span>
                    </div>
                  </div>
                  
                  {/* Droppable Area */}
                  <SortableContext
                    id={column.key}
                    items={columnCards.map(c => c.applicationId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div
                      id={column.key}
                      className="space-y-3 min-h-[200px]"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                    >
                      {columnCards.map((card) => (
                        <div
                          key={card.applicationId}
                          id={card.applicationId}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('applicationId', card.applicationId);
                          }}
                        >
                          <KanbanCard card={card} />
                        </div>
                      ))}
                      
                      {columnCards.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-8">
                          Nenhum candidato
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
          
          <DragOverlay>
            {activeCard ? <KanbanCard card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default JobPipelinePage;
