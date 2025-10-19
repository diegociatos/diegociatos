import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../ciatos-design-system.css';

const ClientJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getStageLabel = (stage) => {
    const labels = {
      'cadastro': 'Cadastro',
      'triagem': 'Triagem',
      'entrevistas': 'Entrevistas',
      'selecao': 'Seleção',
      'envio_cliente': 'Enviado ao Cliente',
      'contratacao': 'Contratação'
    };
    return labels[stage] || 'Cadastro';
  };

  const getStageColor = (stage) => {
    const colors = {
      'cadastro': 'stage-new',
      'triagem': 'stage-review',
      'entrevistas': 'stage-interview',
      'selecao': 'stage-selection',
      'envio_cliente': 'stage-sent',
      'contratacao': 'stage-hired'
    };
    return colors[stage] || 'stage-new';
  };

  const getWorkModeLabel = (mode) => {
    const labels = {
      'remote': 'Remoto',
      'onsite': 'Presencial',
      'hybrid': 'Híbrido'
    };
    return labels[mode] || mode;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'draft': 'Rascunho',
      'published': 'Publicada',
      'paused': 'Pausada',
      'closed': 'Fechada'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>Carregando suas vagas...</p>
      </div>
    );
  }

  return (
    <div className="client-jobs-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-left">
            <button onClick={() => navigate('/cliente/dashboard')} className="back-button">
              <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="header-divider"></div>
            <div className="header-title-section">
              <h1>Minhas Vagas</h1>
              <p className="header-subtitle">Gerencie e acompanhe suas vagas cadastradas</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/jobs/new')}
            >
              <span className="icon icon-plus"></span>
              Nova Vaga
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/cliente/vagas-kanban')}
            >
              <span className="icon icon-kanban"></span>
              Ver Kanban
            </button>
          </div>
        </div>
      </header>

      <div className="page-content">
        {jobs.length === 0 ? (
          <div className="empty-state card-elevated">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3>Nenhuma vaga cadastrada</h3>
            <p>Você ainda não possui vagas cadastradas no sistema</p>
            <button 
              className="btn-primary"
              onClick={() => navigate('/jobs/new')}
            >
              <span className="icon icon-plus"></span>
              Criar Primeira Vaga
            </button>
          </div>
        ) : (
          <div className="jobs-list">
            {jobs.map((job, index) => (
              <div 
                key={job.id} 
                className="job-item card animate-fade-in"
                style={{animationDelay: `${index * 0.05}s`}}
              >
                <div className="job-main">
                  <div className="job-header">
                    <h3 className="job-title">{job.title}</h3>
                    <div className="job-badges">
                      <span className={`stage-badge ${getStageColor(job.recruitment_stage)}`}>
                        {getStageLabel(job.recruitment_stage)}
                      </span>
                      <span className={`status-badge status-${job.status}`}>
                        {getStatusLabel(job.status)}
                      </span>
                    </div>
                  </div>

                  {job.description && (
                    <p className="job-description">{job.description}</p>
                  )}

                  <div className="job-details">
                    <div className="detail-item">
                      <span className="icon icon-map-pin"></span>
                      <span>{job.location || 'Não especificado'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="icon icon-monitor"></span>
                      <span>{getWorkModeLabel(job.work_mode)}</span>
                    </div>
                    {job.salary_range && (
                      <div className="detail-item">
                        <span className="icon icon-dollar"></span>
                        <span>{job.salary_range}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="icon icon-calendar"></span>
                      <span>Criada em {new Date(job.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="job-actions">
                    <button 
                      className="btn-secondary btn-sm"
                      onClick={() => navigate(`/jobs/${job.id}/edit`)}
                    >
                      <span className="icon icon-edit"></span>
                      Editar
                    </button>
                    <button 
                      className="btn-text"
                      onClick={() => navigate('/cliente/vagas-kanban')}
                    >
                      Ver no Kanban
                      <span className="icon icon-arrow-right"></span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .client-jobs-page {
          min-height: 100vh;
          background: var(--ciatos-bg-secondary);
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
        .page-header {
          background: white;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--space-lg) var(--space-xl);
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .header-actions {
          display: flex;
          gap: var(--space-sm);
        }

        /* Page Content */
        .page-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--space-xl);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
          background: white;
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          color: var(--ciatos-gray-light);
          margin: 0 auto var(--space-md);
        }

        .empty-state h3 {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: var(--ciatos-graphite);
          margin: 0 0 var(--space-xs) 0;
        }

        .empty-state p {
          color: var(--ciatos-gray);
          margin: 0 0 var(--space-lg) 0;
        }

        /* Jobs List */
        .jobs-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .job-item {
          padding: var(--space-lg);
          background: white;
        }

        .job-main {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: var(--space-md);
        }

        .job-title {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: var(--ciatos-black);
          margin: 0;
          flex: 1;
        }

        .job-badges {
          display: flex;
          gap: var(--space-xs);
          flex-wrap: wrap;
        }

        .stage-badge, .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .stage-new {
          background: rgba(160, 160, 160, 0.15);
          color: var(--ciatos-gray-dark);
        }

        .stage-review {
          background: rgba(2, 136, 209, 0.15);
          color: var(--ciatos-info);
        }

        .stage-interview {
          background: rgba(237, 108, 2, 0.15);
          color: var(--ciatos-warning);
        }

        .stage-selection {
          background: rgba(91, 14, 14, 0.15);
          color: var(--ciatos-primary);
        }

        .stage-sent {
          background: rgba(156, 39, 176, 0.15);
          color: #9C27B0;
        }

        .stage-hired {
          background: rgba(46, 125, 50, 0.15);
          color: var(--ciatos-success);
        }

        .status-badge {
          border: 1px solid;
        }

        .status-draft {
          background: rgba(160, 160, 160, 0.1);
          color: var(--ciatos-gray-dark);
          border-color: var(--ciatos-gray-lighter);
        }

        .status-published {
          background: rgba(46, 125, 50, 0.1);
          color: var(--ciatos-success);
          border-color: var(--ciatos-success);
        }

        .status-paused {
          background: rgba(237, 108, 2, 0.1);
          color: var(--ciatos-warning);
          border-color: var(--ciatos-warning);
        }

        .status-closed {
          background: rgba(211, 47, 47, 0.1);
          color: var(--ciatos-error);
          border-color: var(--ciatos-error);
        }

        .job-description {
          font-size: 0.875rem;
          color: var(--ciatos-gray-dark);
          line-height: 1.6;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .job-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-sm);
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 0.875rem;
          color: var(--ciatos-gray-dark);
        }

        .detail-item .icon {
          color: var(--ciatos-gray);
        }

        .job-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--space-md);
          border-top: 1px solid var(--ciatos-gray-lighter);
        }

        /* Icons */
        .icon {
          width: 20px;
          height: 20px;
          display: inline-block;
        }

        .icon-plus::before { content: '➕'; }
        .icon-kanban::before { content: '📋'; }
        .icon-map-pin::before { content: '📍'; }
        .icon-monitor::before { content: '💻'; }
        .icon-dollar::before { content: '💰'; }
        .icon-calendar::before { content: '📅'; }
        .icon-edit::before { content: '✏️'; }
        .icon-arrow-right::before { content: '→'; }

        /* Responsive */
        @media (max-width: 1024px) {
          .header-content {
            flex-direction: column;
            gap: var(--space-md);
          }

          .header-left {
            width: 100%;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }
        }

        @media (max-width: 640px) {
          .job-badges {
            flex-direction: column;
            align-items: start;
          }

          .job-details {
            grid-template-columns: 1fr;
          }

          .job-actions {
            flex-direction: column;
            gap: var(--space-sm);
            align-items: stretch;
          }

          .btn-text {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientJobsPage;
