import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../ciatos-design-system.css';

const JobsKanbanPagePremium = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStageToMove, setSelectedStageToMove] = useState('');
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const stageConfig = {
    cadastro: {
      label: 'Cadastro da Vaga',
      icon: '📋',
      color: '#5B0E0E',
      bgLight: 'rgba(91, 14, 14, 0.05)'
    },
    triagem: {
      label: 'Triagem de Currículos',
      icon: '🔍',
      color: '#7A1313',
      bgLight: 'rgba(122, 19, 19, 0.05)'
    },
    entrevistas: {
      label: 'Entrevistas',
      icon: '💬',
      color: '#ED6C02',
      bgLight: 'rgba(237, 108, 2, 0.05)'
    },
    selecao: {
      label: 'Seleção',
      icon: '⭐',
      color: '#0288D1',
      bgLight: 'rgba(2, 136, 209, 0.05)'
    },
    envio_cliente: {
      label: 'Envio ao Cliente',
      icon: '📤',
      color: '#9C27B0',
      bgLight: 'rgba(156, 39, 176, 0.05)'
    },
    contratacao: {
      label: 'Contratação',
      icon: '✅',
      color: '#2E7D32',
      bgLight: 'rgba(46, 125, 50, 0.05)'
    }
  };

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', path: '/recruiter' },
    { icon: '💼', label: 'Vagas', path: '/analista/vagas-kanban', active: true },
    { icon: '👥', label: 'Candidatos', path: '/candidates' },
    { icon: '📅', label: 'Entrevistas', path: '/interviews' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
  ];

  useEffect(() => {
    loadKanban();
  }, []);

  const loadKanban = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs-kanban');
      setStages(res.data || {});
    } catch (error) {
      console.error('Erro ao carregar kanban:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    try {
      await api.patch(`/jobs-kanban/${draggableId}/stage`, {
        to_stage: destination.droppableId
      });
      loadKanban();
    } catch (error) {
      console.error('Erro ao mover vaga:', error);
      alert('Erro ao mover vaga');
    }
  };

  const handleJobClick = async (job) => {
    setSelectedJob(job);
    setShowDetailsModal(true);
    
    // Carregar notas e candidatos
    try {
      const [notesRes, candidatesRes] = await Promise.all([
        api.get(`/jobs-kanban/${job.id}/notes`),
        api.get(`/jobs/${job.id}/candidates`)
      ]);
      
      setNotes(notesRes.data || []);
      setCandidates(candidatesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await api.post(`/jobs-kanban/${selectedJob.id}/notes`, {
        content: newNote
      });
      
      const res = await api.get(`/jobs-kanban/${selectedJob.id}/notes`);
      setNotes(res.data || []);
      setNewNote('');
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      alert('Erro ao adicionar nota');
    }
  };

  const handleMoveToStage = async () => {
    if (!selectedStageToMove) return;

    try {
      await api.patch(`/jobs-kanban/${selectedJob.id}/stage`, {
        to_stage: selectedStageToMove
      });
      
      setShowDetailsModal(false);
      setSelectedJob(null);
      setSelectedStageToMove('');
      loadKanban();
      alert('Vaga movida com sucesso!');
    } catch (error) {
      console.error('Erro ao mover vaga:', error);
      alert('Erro ao mover vaga');
    }
  };

  if (loading) {
    return (
      <div className="kanban-loading">
        <div className="spinner-large"></div>
        <p>Carregando Kanban...</p>
      </div>
    );
  }

  return (
    <div className="kanban-layout">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <img 
            src="https://customer-assets.emergentagent.com/job_ats-workflow/artifacts/izsbq46f_Logo%20Grupo%20Ciatos.png" 
            alt="Ciatos" 
            className="sidebar-logo"
          />
          {sidebarOpen && <span className="sidebar-brand">Ciatos</span>}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`sidebar-item ${item.active ? 'active' : ''}`}
            >
              <span className="item-icon">{item.icon}</span>
              {sidebarOpen && <span className="sidebar-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            {sidebarOpen && (
              <div className="user-info">
                <p className="user-name">{user?.full_name || 'Analista'}</p>
                <p className="user-role">Recrutador</p>
              </div>
            )}
          </div>
          <button onClick={logout} className="btn-logout" title="Sair">
            🚪
          </button>
        </div>

        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>
      </aside>

      {/* Main Kanban Area */}
      <main className="kanban-main">
        {/* Header */}
        <header className="kanban-header">
          <div>
            <h1 className="kanban-title">Kanban de Vagas</h1>
            <p className="kanban-subtitle">Gerencie o pipeline de recrutamento por fase</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => navigate('/jobs/create')}>
              <span>➕</span>
              Nova Vaga
            </button>
            <button className="btn-secondary" onClick={loadKanban}>
              <span>🔄</span>
              Atualizar
            </button>
          </div>
        </header>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {Object.keys(stageConfig).map((stageKey) => {
              const config = stageConfig[stageKey];
              const jobs = stages[stageKey] || [];

              return (
                <div key={stageKey} className="kanban-column">
                  {/* Column Header */}
                  <div 
                    className="column-header"
                    style={{ borderTopColor: config.color }}
                  >
                    <div className="column-title-row">
                      <span className="column-icon">{config.icon}</span>
                      <h3 className="column-title">{config.label}</h3>
                    </div>
                    <span className="column-count">{jobs.length}</span>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={stageKey}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                        style={{ backgroundColor: config.bgLight }}
                      >
                        {jobs.map((job, index) => (
                          <Draggable
                            key={job.id}
                            draggableId={job.id}
                            index={index}
                            isDragDisabled={Boolean(user?.role === 'client')}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`job-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                onClick={() => handleJobClick(job)}
                              >
                                <div className="job-card-header">
                                  <h4 className="job-title">{job.title}</h4>
                                  <span className="job-badge" style={{ backgroundColor: config.bgLight, color: config.color }}>
                                    {config.icon}
                                  </span>
                                </div>
                                
                                {job.organization_name && (
                                  <p className="job-company">🏢 {job.organization_name}</p>
                                )}
                                
                                <div className="job-meta">
                                  {job.location_city && (
                                    <span className="job-tag">📍 {job.location_city}</span>
                                  )}
                                  {job.work_mode && (
                                    <span className="job-tag">
                                      {job.work_mode === 'remote' ? '🏠 Remoto' : job.work_mode === 'hybrid' ? '🔄 Híbrido' : '🏢 Presencial'}
                                    </span>
                                  )}
                                </div>

                                <div className="job-footer">
                                  <span className="job-date">
                                    ⏱️ {new Date(job.created_at).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {jobs.length === 0 && (
                          <div className="column-empty">
                            <p>Nenhuma vaga nesta fase</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </main>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedJob.title}</h2>
                <p className="modal-subtitle">Detalhes e Gerenciamento da Vaga</p>
              </div>
              <button 
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Info Geral */}
              <div className="detail-section">
                <h3 className="section-title">Informações Gerais</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Status Atual</span>
                    <span className="info-value">{stageConfig[selectedJob.recruitment_stage]?.label}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Empresa</span>
                    <span className="info-value">{selectedJob.organization_name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Localização</span>
                    <span className="info-value">{selectedJob.location_city || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Modalidade</span>
                    <span className="info-value">
                      {selectedJob.work_mode === 'remote' ? 'Remoto' : selectedJob.work_mode === 'hybrid' ? 'Híbrido' : 'Presencial'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Candidatos */}
              <div className="detail-section">
                <h3 className="section-title">Candidatos ({candidates.length})</h3>
                {candidates.length > 0 ? (
                  <div className="candidates-list">
                    {candidates.map((cand, idx) => (
                      <div key={idx} className="candidate-item">
                        <div className="candidate-avatar">
                          {cand.candidate_name?.charAt(0) || '?'}
                        </div>
                        <div className="candidate-info">
                          <p className="candidate-name">{cand.candidate_name || 'Nome não disponível'}</p>
                          <p className="candidate-status">
                            Status: {cand.current_stage || 'Em análise'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">Nenhum candidato ainda</p>
                )}
              </div>

              {/* Notas */}
              <div className="detail-section">
                <h3 className="section-title">Notas e Comentários</h3>
                <div className="notes-input-group">
                  <textarea
                    className="input-field"
                    placeholder="Adicione uma nota sobre esta vaga..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <button className="btn-primary" onClick={handleAddNote}>
                    Adicionar Nota
                  </button>
                </div>
                
                {notes.length > 0 && (
                  <div className="notes-list">
                    {notes.map((note, idx) => (
                      <div key={idx} className="note-item">
                        <p className="note-content">{note.content}</p>
                        <p className="note-meta">
                          Por {note.created_by_name} • {new Date(note.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mover Vaga */}
              <div className="detail-section">
                <h3 className="section-title">Mover para Outra Fase</h3>
                <div className="move-stage-group">
                  <select
                    className="input-field"
                    value={selectedStageToMove}
                    onChange={(e) => setSelectedStageToMove(e.target.value)}
                  >
                    <option value="">Selecione uma fase...</option>
                    {Object.keys(stageConfig).map((key) => (
                      <option 
                        key={key} 
                        value={key}
                        disabled={key === selectedJob.recruitment_stage}
                      >
                        {stageConfig[key].icon} {stageConfig[key].label}
                        {key === selectedJob.recruitment_stage ? ' (Atual)' : ''}
                      </option>
                    ))}
                  </select>
                  <button 
                    className="btn-primary"
                    onClick={handleMoveToStage}
                    disabled={!selectedStageToMove}
                  >
                    Mover Vaga
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => navigate(`/jobs/${selectedJob.id}/edit`)}
                >
                  ✏️ Editar Vaga
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => navigate(`/jobs/${selectedJob.id}/pipeline`)}
                >
                  📊 Ver Pipeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Layout Geral */
        .kanban-layout {
          display: flex;
          min-height: 100vh;
          background: var(--ciatos-bg-secondary);
        }

        /* Sidebar (reutilizado do Dashboard) */
        .dashboard-sidebar {
          width: 280px;
          background: var(--ciatos-bg-primary);
          border-right: 1px solid var(--ciatos-gray-lighter);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          transition: width var(--transition-base);
          z-index: 100;
        }

        .dashboard-sidebar.closed {
          width: 80px;
        }

        .sidebar-header {
          padding: var(--space-lg);
          border-bottom: 1px solid var(--ciatos-gray-lighter);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .sidebar-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .sidebar-brand {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--ciatos-primary);
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          background: transparent;
          border: none;
          color: var(--ciatos-gray);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sidebar-item:hover {
          background: var(--ciatos-bg-tertiary);
          color: var(--ciatos-graphite);
        }

        .sidebar-item.active {
          background: linear-gradient(135deg, var(--ciatos-primary) 0%, var(--ciatos-primary-light) 100%);
          color: white;
          box-shadow: var(--shadow-md);
        }

        .item-icon {
          font-size: 1.25rem;
        }

        .sidebar-label {
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar-footer {
          padding: var(--space-md);
          border-top: 1px solid var(--ciatos-gray-lighter);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .sidebar-user {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--ciatos-primary) 0%, var(--ciatos-primary-light) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.125rem;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--ciatos-graphite);
          margin: 0;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--ciatos-gray);
          margin: 0;
        }

        .btn-logout {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: transparent;
          border: none;
          color: var(--ciatos-gray);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          font-size: 1.25rem;
        }

        .btn-logout:hover {
          background: var(--ciatos-bg-tertiary);
          color: var(--ciatos-error);
        }

        .sidebar-toggle {
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--ciatos-bg-primary);
          border: 1px solid var(--ciatos-gray-lighter);
          color: var(--ciatos-gray);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          font-size: 1rem;
        }

        .sidebar-toggle:hover {
          background: var(--ciatos-primary);
          color: white;
          border-color: var(--ciatos-primary);
        }

        /* Main Kanban */
        .kanban-main {
          flex: 1;
          margin-left: 280px;
          transition: margin-left var(--transition-base);
          display: flex;
          flex-direction: column;
          height: 100vh;
        }

        .dashboard-sidebar.closed + .kanban-main {
          margin-left: 80px;
        }

        .kanban-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg) var(--space-xl);
          background: var(--ciatos-bg-primary);
          border-bottom: 1px solid var(--ciatos-gray-lighter);
        }

        .kanban-title {
          font-size: 1.75rem;
          margin-bottom: 0.25rem;
        }

        .kanban-subtitle {
          color: var(--ciatos-gray);
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          gap: var(--space-sm);
        }

        /* Kanban Board */
        .kanban-board {
          flex: 1;
          display: flex;
          gap: var(--space-md);
          padding: var(--space-lg);
          overflow-x: auto;
        }

        .kanban-column {
          flex: 0 0 320px;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 140px);
        }

        .column-header {
          background: var(--ciatos-bg-primary);
          padding: var(--space-md);
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          border-top: 4px solid;
          box-shadow: var(--shadow-sm);
        }

        .column-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          margin-bottom: var(--space-xs);
        }

        .column-icon {
          font-size: 1.25rem;
        }

        .column-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--ciatos-black);
          margin: 0;
        }

        .column-count {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background: var(--ciatos-gray-lighter);
          color: var(--ciatos-gray);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .column-content {
          flex: 1;
          padding: var(--space-sm);
          background: white;
          border-radius: 0 0 var(--radius-md) var(--radius-md);
          overflow-y: auto;
          min-height: 200px;
          box-shadow: var(--shadow-sm);
        }

        .column-content.dragging-over {
          background: var(--ciatos-bg-tertiary);
        }

        .column-empty {
          text-align: center;
          padding: var(--space-lg);
          color: var(--ciatos-gray-light);
          font-size: 0.875rem;
        }

        /* Job Cards */
        .job-card {
          background: white;
          border: 1px solid var(--ciatos-gray-lighter);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          margin-bottom: var(--space-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .job-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .job-card.dragging {
          opacity: 0.5;
          box-shadow: var(--shadow-lg);
        }

        .job-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-sm);
        }

        .job-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--ciatos-black);
          margin: 0;
          flex: 1;
        }

        .job-badge {
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
        }

        .job-company {
          font-size: 0.875rem;
          color: var(--ciatos-gray);
          margin-bottom: var(--space-xs);
        }

        .job-meta {
          display: flex;
          gap: var(--space-xs);
          flex-wrap: wrap;
          margin-bottom: var(--space-sm);
        }

        .job-tag {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: var(--ciatos-bg-tertiary);
          border-radius: var(--radius-sm);
          color: var(--ciatos-gray);
        }

        .job-footer {
          padding-top: var(--space-sm);
          border-top: 1px solid var(--ciatos-gray-lighter);
        }

        .job-date {
          font-size: 0.75rem;
          color: var(--ciatos-gray-light);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--space-lg);
        }

        .modal-content {
          background: white;
          border-radius: var(--radius-lg);
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-xl);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: var(--space-xl);
          border-bottom: 1px solid var(--ciatos-gray-lighter);
        }

        .modal-title {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .modal-subtitle {
          font-size: 0.875rem;
          color: var(--ciatos-gray);
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: none;
          color: var(--ciatos-gray);
          cursor: pointer;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .modal-close:hover {
          background: var(--ciatos-bg-tertiary);
          color: var(--ciatos-error);
        }

        .modal-body {
          padding: var(--space-xl);
        }

        .detail-section {
          margin-bottom: var(--space-xl);
        }

        .section-title {
          font-size: 1.125rem;
          margin-bottom: var(--space-md);
          color: var(--ciatos-primary);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-md);
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.75rem;
          color: var(--ciatos-gray);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .info-value {
          font-size: 1rem;
          color: var(--ciatos-graphite);
          font-weight: 500;
        }

        .candidates-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .candidate-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm);
          background: var(--ciatos-bg-secondary);
          border-radius: var(--radius-md);
        }

        .candidate-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--ciatos-primary) 0%, var(--ciatos-primary-light) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .candidate-info {
          flex: 1;
        }

        .candidate-name {
          font-weight: 600;
          color: var(--ciatos-graphite);
          margin: 0 0 0.25rem 0;
        }

        .candidate-status {
          font-size: 0.75rem;
          color: var(--ciatos-gray);
          margin: 0;
        }

        .notes-input-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .notes-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .note-item {
          padding: var(--space-sm) var(--space-md);
          background: var(--ciatos-bg-secondary);
          border-radius: var(--radius-md);
          border-left: 3px solid var(--ciatos-primary);
        }

        .note-content {
          font-size: 0.875rem;
          color: var(--ciatos-graphite);
          margin-bottom: 0.5rem;
        }

        .note-meta {
          font-size: 0.75rem;
          color: var(--ciatos-gray);
          margin: 0;
        }

        .move-stage-group {
          display: flex;
          gap: var(--space-sm);
        }

        .modal-actions {
          display: flex;
          gap: var(--space-sm);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--ciatos-gray-lighter);
        }

        /* Loading */
        .kanban-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--ciatos-bg-secondary);
        }

        .spinner-large {
          width: 48px;
          height: 48px;
          border: 4px solid var(--ciatos-gray-lighter);
          border-top-color: var(--ciatos-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: var(--space-md);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsividade */
        @media (max-width: 1024px) {
          .dashboard-sidebar {
            transform: translateX(-100%);
          }

          .dashboard-sidebar.open {
            transform: translateX(0);
          }

          .kanban-main {
            margin-left: 0;
          }

          .kanban-board {
            flex-direction: column;
          }

          .kanban-column {
            flex: 1 1 auto;
            max-height: none;
          }
        }
      `}</style>
    </div>
  );
};

export default JobsKanbanPagePremium;
