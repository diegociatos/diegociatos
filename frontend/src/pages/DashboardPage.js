import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import '../ciatos-design-system.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, getUserRole } = useAuth();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    activeCandidates: 0,
    pendingInterviews: 0,
    hiredThisMonth: 0,
    totalUsers: 0,
    totalOrganizations: 0
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas
      const [jobsRes, candidatesRes] = await Promise.all([
        api.get('/jobs'),
        api.get('/candidates')
      ]);

      const jobs = jobsRes.data || [];
      const candidates = candidatesRes.data || [];

      setStats({
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'published').length,
        totalCandidates: candidates.length,
        activeCandidates: candidates.filter(c => c.visibility === 'pool').length,
        pendingInterviews: 0, // TODO: Integrar com entrevistas
        hiredThisMonth: 0 // TODO: Integrar com contratações
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { icon: 'home', label: 'Dashboard', path: '/recruiter', active: true },
    { icon: 'briefcase', label: 'Vagas', path: '/analista/vagas-kanban' },
    { icon: 'users', label: 'Candidatos', path: '/candidates' },
    { icon: 'calendar', label: 'Entrevistas', path: '/interviews' },
    { icon: 'bar-chart', label: 'Relatórios', path: '/reports' },
    { icon: 'settings', label: 'Configurações', path: '/settings' },
  ];

  return (
    <div className="dashboard-layout">
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
            <h1 className="dashboard-title">Dashboard de Recrutamento</h1>
            <p className="dashboard-subtitle">Visão geral das suas atividades e métricas</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              <span className="icon icon-download"></span>
              Exportar Relatório
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="kpi-card card animate-fade-in">
            <div className="kpi-icon-wrapper kpi-primary">
              <span className="icon icon-briefcase"></span>
            </div>
            <div className="kpi-content">
              <p className="kpi-label">Vagas Ativas</p>
              <h2 className="kpi-value">{stats.activeJobs}</h2>
              <p className="kpi-change positive">+{stats.totalJobs - stats.activeJobs} em análise</p>
            </div>
          </div>

          <div className="kpi-card card animate-fade-in" style={{animationDelay: '0.1s'}}>
            <div className="kpi-icon-wrapper kpi-success">
              <span className="icon icon-users"></span>
            </div>
            <div className="kpi-content">
              <p className="kpi-label">Candidatos Ativos</p>
              <h2 className="kpi-value">{stats.activeCandidates}</h2>
              <p className="kpi-change">{stats.totalCandidates} total no banco</p>
            </div>
          </div>

          <div className="kpi-card card animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="kpi-icon-wrapper kpi-warning">
              <span className="icon icon-calendar"></span>
            </div>
            <div className="kpi-content">
              <p className="kpi-label">Entrevistas Pendentes</p>
              <h2 className="kpi-value">{stats.pendingInterviews}</h2>
              <p className="kpi-change">Esta semana</p>
            </div>
          </div>

          <div className="kpi-card card animate-fade-in" style={{animationDelay: '0.3s'}}>
            <div className="kpi-icon-wrapper kpi-info">
              <span className="icon icon-check-circle"></span>
            </div>
            <div className="kpi-content">
              <p className="kpi-label">Contratações</p>
              <h2 className="kpi-value">{stats.hiredThisMonth}</h2>
              <p className="kpi-change">Este mês</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="action-cards-grid">
          <div className="action-card card-elevated" onClick={() => navigate('/analista/vagas-kanban')}>
            <div className="action-card-icon">
              <span className="icon icon-kanban"></span>
            </div>
            <div className="action-card-content">
              <h3>Kanban de Vagas</h3>
              <p>Gerencie o pipeline de recrutamento com visão completa do funil</p>
            </div>
            <div className="action-card-arrow">
              <span className="icon icon-arrow-right"></span>
            </div>
          </div>

          <div className="action-card card-elevated" onClick={() => navigate('/candidates')}>
            <div className="action-card-icon">
              <span className="icon icon-user-search"></span>
            </div>
            <div className="action-card-content">
              <h3>Buscar Candidatos</h3>
              <p>Pesquise e analise perfis de candidatos disponíveis</p>
            </div>
            <div className="action-card-arrow">
              <span className="icon icon-arrow-right"></span>
            </div>
          </div>

          <div className="action-card card-elevated" onClick={() => navigate('/jobs/create')}>
            <div className="action-card-icon">
              <span className="icon icon-plus-circle"></span>
            </div>
            <div className="action-card-content">
              <h3>Nova Vaga</h3>
              <p>Cadastre uma nova posição e inicie o processo seletivo</p>
            </div>
            <div className="action-card-arrow">
              <span className="icon icon-arrow-right"></span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-section">
          <div className="section-header">
            <h2>Atividades Recentes</h2>
            <button className="btn-text">Ver todas</button>
          </div>
          <div className="activity-list card">
            <div className="activity-item">
              <div className="activity-icon activity-new">
                <span className="icon icon-user-plus"></span>
              </div>
              <div className="activity-content">
                <p className="activity-text">Novo candidato se inscreveu para <strong>Analista Fiscal</strong></p>
                <p className="activity-time">Há 2 horas</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon activity-update">
                <span className="icon icon-edit"></span>
              </div>
              <div className="activity-content">
                <p className="activity-text">Vaga <strong>Contador</strong> foi atualizada</p>
                <p className="activity-time">Há 5 horas</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon activity-success">
                <span className="icon icon-check"></span>
              </div>
              <div className="activity-content">
                <p className="activity-text">Candidato aprovado para fase de <strong>Entrevista</strong></p>
                <p className="activity-time">Ontem</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .dashboard-layout {
          display: flex;
          min-height: 100vh;
          background: var(--ciatos-bg-secondary);
        }

        /* ===== SIDEBAR ===== */
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

        /* ===== MAIN CONTENT ===== */
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

        .header-actions {
          display: flex;
          gap: var(--space-sm);
        }

        /* ===== KPIs ===== */
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
          font-size: 1.5rem;
        }

        .kpi-primary {
          background: linear-gradient(135deg, rgba(91, 14, 14, 0.1) 0%, rgba(122, 19, 19, 0.15) 100%);
          color: var(--ciatos-primary);
        }

        .kpi-success {
          background: rgba(46, 125, 50, 0.1);
          color: var(--ciatos-success);
        }

        .kpi-warning {
          background: rgba(237, 108, 2, 0.1);
          color: var(--ciatos-warning);
        }

        .kpi-info {
          background: rgba(2, 136, 209, 0.1);
          color: var(--ciatos-info);
        }

        .kpi-content {
          flex: 1;
        }

        .kpi-label {
          font-size: 0.875rem;
          color: var(--ciatos-gray);
          margin-bottom: var(--space-xs);
        }

        .kpi-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--ciatos-black);
          margin-bottom: var(--space-xs);
        }

        .kpi-change {
          font-size: 0.75rem;
          color: var(--ciatos-gray);
        }

        .kpi-change.positive {
          color: var(--ciatos-success);
        }

        /* ===== ACTION CARDS ===== */
        .action-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-lg);
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .action-card-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--ciatos-primary) 0%, var(--ciatos-primary-light) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .action-card-content {
          flex: 1;
        }

        .action-card-content h3 {
          font-size: 1.125rem;
          margin-bottom: var(--space-xs);
          color: var(--ciatos-black);
        }

        .action-card-content p {
          font-size: 0.875rem;
          color: var(--ciatos-gray);
          margin: 0;
        }

        .action-card-arrow {
          color: var(--ciatos-primary);
          font-size: 1.25rem;
        }

        /* ===== RECENT ACTIVITY ===== */
        .recent-section {
          margin-bottom: var(--space-xl);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        }

        .section-header h2 {
          font-size: 1.5rem;
        }

        .btn-text {
          background: transparent;
          border: none;
          color: var(--ciatos-primary);
          font-weight: 600;
          cursor: pointer;
          transition: color var(--transition-fast);
        }

        .btn-text:hover {
          color: var(--ciatos-primary-hover);
        }

        .activity-list {
          padding: var(--space-lg);
        }

        .activity-item {
          display: flex;
          gap: var(--space-md);
          padding: var(--space-md);
          border-bottom: 1px solid var(--ciatos-gray-lighter);
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-new {
          background: rgba(2, 136, 209, 0.1);
          color: var(--ciatos-info);
        }

        .activity-update {
          background: rgba(237, 108, 2, 0.1);
          color: var(--ciatos-warning);
        }

        .activity-success {
          background: rgba(46, 125, 50, 0.1);
          color: var(--ciatos-success);
        }

        .activity-content {
          flex: 1;
        }

        .activity-text {
          font-size: 0.875rem;
          color: var(--ciatos-graphite);
          margin-bottom: var(--space-xs);
        }

        .activity-text strong {
          font-weight: 600;
          color: var(--ciatos-black);
        }

        .activity-time {
          font-size: 0.75rem;
          color: var(--ciatos-gray);
          margin: 0;
        }

        /* ===== ÍCONES SIMPLES ===== */
        .icon {
          width: 20px;
          height: 20px;
          display: inline-block;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }

        .icon-home::before { content: '🏠'; }
        .icon-briefcase::before { content: '💼'; }
        .icon-users::before { content: '👥'; }
        .icon-calendar::before { content: '📅'; }
        .icon-bar-chart::before { content: '📊'; }
        .icon-settings::before { content: '⚙️'; }
        .icon-logout::before { content: '🚪'; }
        .icon-download::before { content: '⬇️'; }
        .icon-check-circle::before { content: '✅'; }
        .icon-kanban::before { content: '📋'; }
        .icon-user-search::before { content: '🔍'; }
        .icon-plus-circle::before { content: '➕'; }
        .icon-arrow-right::before { content: '→'; }
        .icon-user-plus::before { content: '👤+'; }
        .icon-edit::before { content: '✏️'; }
        .icon-check::before { content: '✓'; }
        .icon-chevron-left::before { content: '‹'; }
        .icon-chevron-right::before { content: '›'; }

        /* ===== RESPONSIVIDADE ===== */
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

          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .action-cards-grid {
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
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
