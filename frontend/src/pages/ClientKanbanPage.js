import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../ciatos-design-system.css';

const ClientKanbanPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const stages = [
    { id: 'cadastro', label: 'Cadastro', color: '#6B6B6B' },
    { id: 'triagem', label: 'Triagem', color: '#0288D1' },
    { id: 'entrevistas', label: 'Entrevistas', color: '#ED6C02' },
    { id: 'selecao', label: 'Seleção', color: '#5B0E0E' },
    { id: 'envio_cliente', label: 'Enviado ao Cliente', color: '#9C27B0' },
    { id: 'contratacao', label: 'Contratação', color: '#2E7D32' }
  ];

  useEffect(() => {
    fetchClientJobs();
  }, []);

  const fetchClientJobs = async () => {
    try {
      setLoading(true);
      
      // Buscar organização do cliente
      const rolesRes = await api.get('/users/me/roles');
      const clientRole = rolesRes.data.find(r => r.role === 'client');
      
      if (clientRole) {
        // Buscar APENAS vagas da organização do cliente
        const jobsRes = await api.get('/jobs/');
        const myJobs = jobsRes.data.filter(job => 
          job.organization_id === clientRole.organization_id || 
          job.tenant_id === clientRole.organization_id
        );
        
        setJobs(myJobs);
      }
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJobsByStage = (stageId) => {
    return jobs.filter(job => job.recruitment_stage === stageId);
  };

  const getWorkModeLabel = (mode) => {
    const labels = {
      'remote': 'Remoto',
      'onsite': 'Presencial',
      'hybrid': 'Híbrido'
    };
    return labels[mode] || mode;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>Carregando Kanban...</p>
      </div>
    );
  }

  return (
    <div className="client-kanban-page">
      {/* Header */}
      <header className="kanban-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => navigate('/cliente/dashboard')} className="back-button">
              <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="header-divider"></div>
            <div className="header-title-section">
              <h1>Acompanhamento de Vagas</h1>
              <p className="header-subtitle">Visualize o andamento do processo seletivo</p>
            </div>
          </div>
          <div className="info-badge">
            <span className="icon icon-info"></span>
            <span>Visualização apenas - Gerenciado pelo recrutador</span>
          </div>
        </div>
      </header>

      <div className="kanban-container">
        <div className="kanban-board">
          {stages.map((stage) => {
            const stageJobs = getJobsByStage(stage.id);
            return (
              <div key={stage.id} className="kanban-column">
                <div className="column-header" style={{borderTopColor: stage.color}}>
                  <h3 className="column-title">{stage.label}</h3>
                  <span className="column-count">{stageJobs.length}</span>
                </div>
                
                <div className="column-content">
                  {stageJobs.length === 0 ? (
                    <div className="empty-column">
                      <p>Nenhuma vaga nesta fase</p>
                    </div>
                  ) : (
                    stageJobs.map((job, index) => (
                      <div 
                        key={job.id} 
                        className="job-card animate-fade-in"
                        style={{animationDelay: `${index * 0.05}s`}}
                      >
                        <h4 className="card-title">{job.title}</h4>
                        
                        <div className="card-details">
                          <div className="detail-item">
                            <span className="icon icon-map-pin"></span>
                            <span className="detail-text">{job.location || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="icon icon-monitor"></span>
                            <span className="detail-text">{getWorkModeLabel(job.work_mode)}</span>
                          </div>
                        </div>

                        <div className="card-info">
                          <span className="icon icon-clock"></span>
                          <span className="info-text">Em processo seletivo</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Footer */}
      <div className="kanban-info">
        <div className="info-content">
          <div className="info-icon-wrapper">
            <span className="icon icon-info-circle"></span>
          </div>
          <div>
            <h4>Sobre este Kanban</h4>
            <p>Este painel mostra apenas o andamento das suas vagas. O recrutador é responsável por movimentar as vagas entre as fases conforme o processo seletivo avança. Você será notificado quando candidatos forem aprovados e enviados para sua análise.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .client-kanban-page {
          min-height: 100vh;
          background: var(--ciatos-bg-secondary);
          padding-bottom: var(--space-2xl);
        }

        /* Loading Screen */
        .loading-screen {
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

        /* Header */
        .kanban-header {
          background: white;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          max-width: 100%;
          padding: var(--space-lg) var(--space-xl);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-md);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .back-button {
          background: var(--ciatos-bg-secondary);
          border: none;
          padding: 0.625rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .back-button:hover {
          background: var(--ciatos-bg-tertiary);
          transform: translateX(-2px);
        }

        .back-icon {
          width: 20px;
          height: 20px;
          color: var(--ciatos-graphite);
        }

        .header-divider {
          width: 1px;
          height: 32px;
          background: var(--ciatos-gray-lighter);
        }

        .header-title-section h1 {
          font-family: var(--font-serif);
          font-size: 1.75rem;
          color: var(--ciatos-black);
          margin: 0;
          font-weight: 600;
        }

        .header-subtitle {
          font-size: 0.875rem;
          color: var(--ciatos-gray);
          margin: 0;
        }

        .info-badge {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: var(--space-sm) var(--space-md);
          background: rgba(91, 14, 14, 0.1);
          border: 1px solid rgba(91, 14, 14, 0.2);
          border-radius: var(--radius-md);
          color: var(--ciatos-primary);
          font-size: 0.875rem;
          font-weight: 600;
        }

        /* Kanban Board */
        .kanban-container {
          padding: var(--space-xl);
          overflow-x: auto;
        }

        .kanban-board {
          display: flex;
          gap: var(--space-md);
          min-width: max-content;
          padding-bottom: var(--space-md);
        }

        .kanban-column {
          flex: 0 0 320px;
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 250px);
        }

        .column-header {
          padding: var(--space-md) var(--space-lg);
          border-top: 4px solid;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--ciatos-bg-secondary);
        }

        .column-title {
          font-family: var(--font-serif);
          font-size: 1rem;
          font-weight: 600;
          color: var(--ciatos-black);
          margin: 0;
        }

        .column-count {
          background: var(--ciatos-primary);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .column-content {
          flex: 1;
          padding: var(--space-md);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .empty-column {
          text-align: center;
          padding: var(--space-xl) var(--space-md);
          color: var(--ciatos-gray);
          font-size: 0.875rem;
        }

        .job-card {
          background: var(--ciatos-bg-primary);
          border: 1px solid var(--ciatos-gray-lighter);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          transition: all var(--transition-fast);
        }

        .job-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .card-title {
          font-family: var(--font-serif);
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--ciatos-black);
          margin: 0 0 var(--space-sm) 0;
          line-height: 1.4;
        }

        .card-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: var(--space-sm);
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .detail-text {
          font-size: 0.8125rem;
          color: var(--ciatos-gray-dark);
        }

        .card-info {
          display: flex;
          align-items: center;
          gap: 6px;
          padding-top: var(--space-sm);
          border-top: 1px solid var(--ciatos-gray-lighter);
        }

        .info-text {
          font-size: 0.75rem;
          color: var(--ciatos-gray);
          font-style: italic;
        }

        /* Kanban Info Footer */
        .kanban-info {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--space-xl);
        }

        .info-content {
          display: flex;
          gap: var(--space-md);
          background: white;
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          border-left: 4px solid var(--ciatos-primary);
        }

        .info-icon-wrapper {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--ciatos-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .info-icon-wrapper .icon::before {
          font-size: 1.5rem;
        }

        .info-content h4 {
          font-family: var(--font-serif);
          font-size: 1.125rem;
          color: var(--ciatos-black);
          margin: 0 0 var(--space-xs) 0;
        }

        .info-content p {
          font-size: 0.875rem;
          color: var(--ciatos-gray-dark);
          line-height: 1.6;
          margin: 0;
        }

        /* Icons */
        .icon {
          width: 16px;
          height: 16px;
          display: inline-block;
          flex-shrink: 0;
        }

        .icon-info::before { content: 'ℹ️'; }
        .icon-info-circle::before { content: 'ℹ️'; font-size: 1.5rem; }
        .icon-map-pin::before { content: '📍'; }
        .icon-monitor::before { content: '💻'; }
        .icon-clock::before { content: '⏱️'; }

        /* Responsive */
        @media (max-width: 1024px) {
          .kanban-board {
            flex-direction: column;
            min-width: auto;
          }

          .kanban-column {
            flex: 1 1 auto;
            max-height: none;
          }

          .column-content {
            max-height: 400px;
          }
        }

        @media (max-width: 640px) {
          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .info-badge {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientKanbanPage;
