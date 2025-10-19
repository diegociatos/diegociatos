import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../ciatos-design-system.css';

const ClientDashboardPagePremium = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    total_jobs: 0,
    active_jobs: 0,
    total_applications: 0,
    in_process: 0
  });

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Buscar organização do cliente
      const rolesRes = await api.get('/users/me/roles');
      const clientRole = rolesRes.data.find(r => r.role === 'client');
      
      if (clientRole) {
        // Buscar vagas da organização
        const jobsRes = await api.get('/jobs/');
        const myJobs = jobsRes.data.filter(job => 
          job.organization_id === clientRole.organization_id || 
          job.tenant_id === clientRole.organization_id
        );
        
        setJobs(myJobs);
        
        // Calcular estatísticas
        const totalApplications = myJobs.reduce((sum, job) => 
          sum + (job.application_count || 0), 0
        );
        
        setStats({
          total_jobs: myJobs.length,
          active_jobs: myJobs.filter(j => j.status === 'published').length,
          total_applications: totalApplications,
          in_process: myJobs.filter(j => j.recruitment_stage && j.recruitment_stage !== 'cadastro').length
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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

  const menuItems = [
    { icon: 'home', label: 'Dashboard', path: '/cliente/dashboard', active: true },
    { icon: 'briefcase', label: 'Minhas Vagas', path: '/cliente/vagas' },
    { icon: 'plus-circle', label: 'Nova Vaga', path: '/jobs/new' },
    { icon: 'user-check', label: 'Candidatos Aprovados', path: '/cliente/shortlist' },
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="client-dashboard-layout">
      {/* Sidebar Premium */}
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
              <span className={`icon icon-${item.icon}`}></span>
              {sidebarOpen && <span className="sidebar-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.full_name?.charAt(0) || 'C'}
            </div>
            {sidebarOpen && (
              <div className="user-info">
                <p className="user-name">{user?.full_name || 'Cliente'}</p>
                <p className="user-role">Cliente</p>
              </div>
            )}
          </div>
          <button onClick={logout} className="btn-logout" title="Sair">
            <span className="icon icon-logout"></span>
          </button>
        </div>

        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className={`icon icon-${sidebarOpen ? 'chevron-left' : 'chevron-right'}`}></span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Bem-vindo, {user?.full_name || 'Cliente'}</h1>
            <p className="dashboard-subtitle">Gerencie suas vagas e acompanhe o processo de recrutamento</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => navigate('/jobs/new')}
          >
            <span className="icon icon-plus-circle"></span>
            Nova Vaga
          </button>
        </header>

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="kpi-card card animate-fade-in">
            <div className="kpi-icon-wrapper kpi-primary">
              <span className="icon icon-briefcase"></span>
            </div>
            <div className="kpi-content">
              <p className="kpi-label">Vagas Ativas</p>
              <h2 className="kpi-value">{stats.active_jobs}</h2>
              <p className="kpi-change">de {stats.total_jobs} total</p>
            </div>
          </div>

          <div className="kpi-card card animate-fade-in" style={{animationDelay: '0.1s'}}>
            <div className="kpi-icon-wrapper kpi-success">
              <span className="icon icon-users"></span>
            </div>
            <div className="kpi-content">
              <p className="kpi-label">Candidaturas</p>
              <h2 className="kpi-value">{stats.total_applications}</h2>
              <p className="kpi-change">Total recebidas</p>
            </div>
          </div>

          <div className="kpi-card card animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="kpi-icon-wrapper kpi-info">
              <span className="icon icon-trending-up"></span>
            </div>
            <div className="kpi-content">
              <p className="kpi-label">Em Processo</p>
              <h2 className="kpi-value">{stats.in_process}</h2>
              <p className="kpi-change">Vagas em andamento</p>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="jobs-section">
          <div className="section-header">
            <h2>Suas Vagas</h2>
            <button className="btn-text" onClick={() => navigate('/cliente/vagas')}>
              Ver todas
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="empty-state card">
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3>Nenhuma vaga cadastrada</h3>
              <p>Comece criando sua primeira vaga para iniciar o processo de recrutamento</p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/jobs/new')}
              >
                <span className="icon icon-plus-circle"></span>
                Criar Primeira Vaga
              </button>
            </div>
          ) : (
            <>
              {/* Action Cards - Ações Principais do Cliente */}
              <div className="client-action-cards">
                <div className="client-action-card card" onClick={() => navigate('/jobs/new')}>
                  <div className="action-card-icon action-icon-primary">
                    <span className="icon icon-plus-circle"></span>
                  </div>
                  <div className="action-card-text">
                    <h4>Cadastrar Nova Vaga</h4>
                    <p>Inicie um novo processo seletivo</p>
                  </div>
                </div>

                <div className="client-action-card card" onClick={() => navigate('/cliente/shortlist')}>
                  <div className="action-card-icon action-icon-success">
                    <span className="icon icon-user-check"></span>
                  </div>
                  <div className="action-card-text">
                    <h4>Candidatos Aprovados</h4>
                    <p>Veja os candidatos selecionados</p>
                  </div>
                </div>
              </div>

              {/* Jobs Grid */}
              <div className="jobs-grid">
                {jobs.map((job, index) => (
                  <div 
                    key={job.id} 
                    className="job-card card animate-fade-in"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className="job-card-header">
                      <h3 className="job-title">{job.title}</h3>
                      <span className={`stage-badge ${getStageColor(job.recruitment_stage)}`}>
                        {getStageLabel(job.recruitment_stage)}
                      </span>
                    </div>

                    <div className="job-card-details">
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
                    </div>

                    <div className="job-card-info">
                      <p className="info-text">
                        <span className="icon icon-info"></span>
                        Esta vaga está na fase de <strong>{getStageLabel(job.recruitment_stage)}</strong>. 
                        O recrutador está conduzindo o processo seletivo.
                      </p>
                    </div>

                    <div className="job-card-footer">
                      <div className="candidates-count">
                        <span className="icon icon-clock"></span>
                        <span>Em andamento</span>
                      </div>
                      <button 
                        className="btn-link"
                        onClick={() => navigate(`/jobs/${job.id}/edit`)}
                      >
                        Editar vaga
                        <span className="icon icon-arrow-right"></span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info Box */}
              <div className="info-box card">
                <div className="info-box-icon">
                  <span className="icon icon-info-circle"></span>
                </div>
                <div className="info-box-content">
                  <h4>Como funciona o processo</h4>
                  <ul>
                    <li>📝 Você cadastra a vaga e aguarda a análise do recrutador</li>
                    <li>🔍 O recrutador busca e seleciona os melhores candidatos</li>
                    <li>💬 Conduz entrevistas e avaliações</li>
                    <li>✅ Ao finalizar, você recebe os candidatos aprovados com análise completa</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <style jsx>{`
        .client-dashboard-layout {
          display: flex;
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

        /* Sidebar */
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
          padding: var(--space-md) 0;
        }

        .sidebar-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md) var(--space-lg);
          border: none;
          background: transparent;
          color: var(--ciatos-gray-dark);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .sidebar-item:hover {
          background: var(--ciatos-bg-secondary);
          color: var(--ciatos-primary);
        }

        .sidebar-item.active {
          background: linear-gradient(90deg, rgba(91, 14, 14, 0.1) 0%, transparent 100%);
          color: var(--ciatos-primary);
          border-left: 3px solid var(--ciatos-primary);
          font-weight: 600;
        }

        .sidebar-label {
          flex: 1;
        }

        .sidebar-footer {
          border-top: 1px solid var(--ciatos-gray-lighter);
          padding: var(--space-md);
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
        }

        .sidebar-toggle:hover {
          background: var(--ciatos-primary);
          color: white;
          border-color: var(--ciatos-primary);
        }

        /* Main Content */
        .dashboard-main {
          flex: 1;
          margin-left: 280px;
          padding: var(--space-xl);
          transition: margin-left var(--transition-base);
        }

        .dashboard-sidebar.closed + .dashboard-main {
          margin-left: 80px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-xl);
        }

        .dashboard-title {
          font-size: 2rem;
          margin-bottom: var(--space-xs);
        }

        .dashboard-subtitle {
          color: var(--ciatos-gray);
          font-size: 1rem;
        }

        /* KPIs */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .kpi-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-lg);
        }

        .kpi-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kpi-icon-wrapper .icon::before {
          font-size: 1.75rem;
        }

        .kpi-primary {
          background: linear-gradient(135deg, rgba(91, 14, 14, 0.1) 0%, rgba(91, 14, 14, 0.05) 100%);
          color: var(--ciatos-primary);
        }

        .kpi-success {
          background: linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(46, 125, 50, 0.05) 100%);
          color: var(--ciatos-success);
        }

        .kpi-info {
          background: linear-gradient(135deg, rgba(2, 136, 209, 0.1) 0%, rgba(2, 136, 209, 0.05) 100%);
          color: var(--ciatos-info);
        }

        .kpi-content {
          flex: 1;
        }

        .kpi-label {
          font-size: 0.875rem;
          color: var(--ciatos-gray);
          margin: 0 0 4px 0;
          font-weight: 500;
        }

        .kpi-value {
          font-family: var(--font-serif);
          font-size: 2rem;
          color: var(--ciatos-black);
          margin: 0;
          font-weight: 700;
        }

        .kpi-change {
          font-size: 0.75rem;
          color: var(--ciatos-gray);
          margin: 4px 0 0 0;
        }

        /* Jobs Section */
        .jobs-section {
          margin-top: var(--space-2xl);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .section-header h2 {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          color: var(--ciatos-black);
          margin: 0;
        }

        .btn-text {
          background: transparent;
          border: none;
          color: var(--ciatos-primary);
          font-weight: 600;
          cursor: pointer;
          transition: color var(--transition-fast);
          font-size: 0.875rem;
        }

        .btn-text:hover {
          color: var(--ciatos-primary-hover);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
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

        /* Jobs Grid */
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--space-lg);
          margin-top: var(--space-lg);
        }

        /* Client Action Cards */
        .client-action-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }

        .client-action-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-lg);
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .client-action-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .action-card-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-card-icon .icon::before {
          font-size: 1.75rem;
        }

        .action-icon-primary {
          background: linear-gradient(135deg, var(--ciatos-primary) 0%, var(--ciatos-primary-light) 100%);
          color: white;
        }

        .action-icon-success {
          background: linear-gradient(135deg, var(--ciatos-success) 0%, #43A047 100%);
          color: white;
        }

        .action-card-text h4 {
          font-family: var(--font-serif);
          font-size: 1.125rem;
          color: var(--ciatos-black);
          margin: 0 0 4px 0;
        }

        .action-card-text p {
          font-size: 0.875rem;
          color: var(--ciatos-gray);
          margin: 0;
        }

        .job-card {
          padding: var(--space-lg);
          transition: all var(--transition-base);
        }

        .job-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .job-card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .job-title {
          font-family: var(--font-serif);
          font-size: 1.125rem;
          color: var(--ciatos-black);
          margin: 0;
          flex: 1;
        }

        .stage-badge {
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

        .job-card-details {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
          margin-bottom: var(--space-md);
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

        .job-card-info {
          margin: var(--space-md) 0;
          padding: var(--space-sm);
          background: rgba(91, 14, 14, 0.05);
          border-radius: var(--radius-sm);
          border-left: 3px solid var(--ciatos-primary);
        }

        .info-text {
          display: flex;
          align-items: start;
          gap: var(--space-xs);
          font-size: 0.875rem;
          color: var(--ciatos-gray-dark);
          margin: 0;
          line-height: 1.6;
        }

        .info-text .icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .info-text strong {
          color: var(--ciatos-primary);
          font-weight: 600;
        }

        .job-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--space-md);
          border-top: 1px solid var(--ciatos-gray-lighter);
        }

        .candidates-count {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
          color: var(--ciatos-gray-dark);
          font-weight: 600;
        }

        .btn-link {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--ciatos-primary);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-link:hover {
          color: var(--ciatos-primary-hover);
        }

        .btn-link .icon {
          transition: transform var(--transition-fast);
        }

        .btn-link:hover .icon {
          transform: translateX(2px);
        }

        /* Info Box */
        .info-box {
          display: flex;
          gap: var(--space-md);
          padding: var(--space-xl);
          margin-top: var(--space-xl);
          background: linear-gradient(135deg, rgba(91, 14, 14, 0.03) 0%, rgba(91, 14, 14, 0.01) 100%);
          border-left: 4px solid var(--ciatos-primary);
        }

        .info-box-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--ciatos-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .info-box-icon .icon::before {
          font-size: 1.5rem;
        }

        .info-box-content {
          flex: 1;
        }

        .info-box-content h4 {
          font-family: var(--font-serif);
          font-size: 1.125rem;
          color: var(--ciatos-black);
          margin: 0 0 var(--space-sm) 0;
        }

        .info-box-content ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-box-content li {
          font-size: 0.875rem;
          color: var(--ciatos-gray-dark);
          padding: var(--space-xs) 0;
          line-height: 1.6;
        }

        /* Icons */
        .icon {
          width: 20px;
          height: 20px;
          display: inline-block;
        }

        .icon-home::before { content: '🏠'; }
        .icon-briefcase::before { content: '💼'; }
        .icon-plus-circle::before { content: '➕'; }
        .icon-users::before { content: '👥'; }
        .icon-user-check::before { content: '✅'; }
        .icon-logout::before { content: '🚪'; }
        .icon-chevron-left::before { content: '‹'; }
        .icon-chevron-right::before { content: '›'; }
        .icon-arrow-right::before { content: '→'; }
        .icon-map-pin::before { content: '📍'; }
        .icon-monitor::before { content: '💻'; }
        .icon-dollar::before { content: '💰'; }
        .icon-trending-up::before { content: '📈'; }

        /* Responsividade */
        @media (max-width: 1024px) {
          .dashboard-sidebar {
            transform: translateX(-100%);
          }

          .dashboard-sidebar.open {
            transform: translateX(0);
          }

          .dashboard-main {
            margin-left: 0;
          }

          .jobs-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .dashboard-header {
            flex-direction: column;
            gap: var(--space-md);
          }

          .kpi-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientDashboardPagePremium;
