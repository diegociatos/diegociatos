import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../ciatos-design-system.css';

const CandidatesPagePremium = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [useAI, setUseAI] = useState(false);
  
  // Opções de filtros
  const [educationLevels, setEducationLevels] = useState([]);
  const [ageRanges, setAgeRanges] = useState([]);
  
  // Filtros
  const [filters, setFilters] = useState({
    query: '',
    city: '',
    state: '',
    neighborhood: '',
    education_level: '',
    education_area: '',
    education_institution: '',
    age_range: '',
    ai_query: ''
  });
  
  useEffect(() => {
    loadEducationOptions();
  }, []);
  
  const loadEducationOptions = async () => {
    try {
      const res = await api.get('/candidates/education-options');
      setEducationLevels(res.data.education_levels);
      setAgeRanges(res.data.age_ranges);
    } catch (err) {
      console.error('Erro ao carregar opções:', err);
    }
  };
  
  const handleSearch = async () => {
    try {
      setLoading(true);
      
      const searchData = {
        ...filters,
        use_ai: useAI,
        ai_query: useAI ? filters.query : null
      };
      
      // Remover campos vazios
      Object.keys(searchData).forEach(key => {
        if (searchData[key] === '' || searchData[key] === null) {
          delete searchData[key];
        }
      });
      
      const res = await api.post('/candidates/advanced-search', searchData);
      setCandidates(res.data.candidates || []);
      
      if (res.data.used_ai) {
        alert(`✨ Busca por IA ativada! ${res.data.total} candidatos encontrados e ordenados por relevância.`);
      }
    } catch (err) {
      console.error('Erro na busca:', err);
      alert('Erro ao buscar candidatos');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearFilters = () => {
    setFilters({
      query: '',
      city: '',
      state: '',
      neighborhood: '',
      education_level: '',
      education_area: '',
      education_institution: '',
      age_range: '',
      ai_query: ''
    });
    setCandidates([]);
    setUseAI(false);
  };
  
  const calculateAge = (birthdate) => {
    if (!birthdate) return 'N/A';
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };
  
  const getEducationLevelLabel = (level) => {
    const labels = {
      'ensino_medio': 'Ensino Médio',
      'graduacao': 'Graduação',
      'pos_graduacao': 'Pós-graduação',
      'mestrado': 'Mestrado',
      'doutorado': 'Doutorado'
    };
    return labels[level] || level;
  };

  return (
    <div className="candidates-premium-page">
      {/* Header Premium */}
      <header className="premium-header">
        <div className="header-content">
          <div className="header-left">
            <button
              onClick={() => navigate(-1)}
              className="back-button"
            >
              <svg className="back-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="header-divider"></div>
            <div className="header-title-section">
              <h1>Busca de Candidatos</h1>
              <p className="header-subtitle">Sistema avançado de busca e análise</p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="toggle-filters-btn"
          >
            <svg className="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>{showFilters ? 'Ocultar' : 'Exibir'} Filtros</span>
          </button>
        </div>
      </header>
      
      <div className="main-content">
        {/* Painel de Filtros Premium */}
        {showFilters && (
          <div className="filters-panel card-elevated animate-fade-in">
            <div className="filters-header">
              <h2>Filtros de Busca</h2>
              <p className="text-muted">Refine sua busca com critérios avançados</p>
            </div>
            
            {/* Busca por Texto / IA */}
            <div className="filter-section">
              <div className="filter-section-header">
                <label className="section-label">Busca Inteligente</label>
                <label className="ai-toggle">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="toggle-checkbox"
                  />
                  <span className="toggle-label">
                    <svg className="ai-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                    Busca por IA
                  </span>
                </label>
              </div>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                className="input-field"
                placeholder={useAI ? 
                  "Ex: desenvolvedor python com 5 anos de experiência em São Paulo" : 
                  "Buscar por nome, email, formação, resumo profissional..."
                }
              />
              {useAI && (
                <div className="ai-info">
                  <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <span>A IA analisará semanticamente os perfis e ranqueará por relevância</span>
                </div>
              )}
            </div>
            
            {/* Localização */}
            <div className="filter-section">
              <label className="section-label">
                <svg className="section-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Localização
              </label>
              <div className="filter-grid">
                <div className="input-group">
                  <label className="input-label">Cidade</label>
                  <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    className="input-field"
                    placeholder="São Paulo"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Estado</label>
                  <input
                    type="text"
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    className="input-field"
                    placeholder="SP"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Bairro</label>
                  <input
                    type="text"
                    value={filters.neighborhood}
                    onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })}
                    className="input-field"
                    placeholder="Vila Mariana"
                  />
                </div>
              </div>
            </div>
            
            {/* Formação */}
            <div className="filter-section">
              <label className="section-label">
                <svg className="section-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                </svg>
                Formação Acadêmica
              </label>
              <div className="filter-grid">
                <div className="input-group">
                  <label className="input-label">Nível de Escolaridade</label>
                  <select
                    value={filters.education_level}
                    onChange={(e) => setFilters({ ...filters, education_level: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Todos os níveis</option>
                    {educationLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Área de Formação</label>
                  <input
                    type="text"
                    value={filters.education_area}
                    onChange={(e) => setFilters({ ...filters, education_area: e.target.value })}
                    className="input-field"
                    placeholder="Engenharia, Administração, TI"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Instituição</label>
                  <input
                    type="text"
                    value={filters.education_institution}
                    onChange={(e) => setFilters({ ...filters, education_institution: e.target.value })}
                    className="input-field"
                    placeholder="Nome da universidade"
                  />
                </div>
              </div>
            </div>
            
            {/* Faixa Etária */}
            <div className="filter-section">
              <label className="section-label">
                <svg className="section-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                Faixa Etária
              </label>
              <select
                value={filters.age_range}
                onChange={(e) => setFilters({ ...filters, age_range: e.target.value })}
                className="input-field"
                style={{maxWidth: '400px'}}
              >
                <option value="">Todas as idades</option>
                {ageRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Botões de Ação */}
            <div className="filter-actions">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="btn-primary"
                style={{flex: 1}}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Buscando...
                  </>
                ) : (
                  <>
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Buscar Candidatos
                  </>
                )}
              </button>
              <button
                onClick={handleClearFilters}
                className="btn-secondary"
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpar
              </button>
            </div>
          </div>
        )}
        
        {/* Resultados Premium */}
        <div className="results-panel card-elevated">
          <div className="results-header">
            <div>
              <h3>Resultados da Busca</h3>
              {candidates.length > 0 && (
                <p className="results-count">{candidates.length} candidato{candidates.length !== 1 ? 's' : ''} encontrado{candidates.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          
          {candidates.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h4>Nenhum candidato encontrado</h4>
              <p>Utilize os filtros acima para buscar candidatos no sistema</p>
            </div>
          ) : (
            <div className="candidates-list">
              {candidates.map((candidate, index) => (
                <div 
                  key={candidate.id} 
                  className="candidate-card card animate-fade-in"
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <div className="candidate-main">
                    <div className="candidate-info">
                      <div className="candidate-header">
                        <h4 className="candidate-name">
                          {candidate.user?.full_name || 'Nome não disponível'}
                        </h4>
                        {candidate.ai_relevance_score && (
                          <span className="ai-badge">
                            <svg className="badge-icon" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                            </svg>
                            Relevância IA: {candidate.ai_relevance_score}
                          </span>
                        )}
                      </div>
                      
                      <div className="candidate-details">
                        {/* Email */}
                        <div className="detail-item">
                          <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <span>{candidate.user?.email || 'N/A'}</span>
                        </div>
                        
                        {/* Idade */}
                        <div className="detail-item">
                          <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span>{calculateAge(candidate.birthdate)} anos</span>
                        </div>
                        
                        {/* Localização */}
                        <div className="detail-item">
                          <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span>
                            {candidate.location_city || 'N/A'}
                            {candidate.location_state && `, ${candidate.location_state}`}
                            {candidate.location_neighborhood && ` - ${candidate.location_neighborhood}`}
                          </span>
                        </div>
                        
                        {/* Formação */}
                        {candidate.education_level && (
                          <div className="detail-item">
                            <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                            <span>
                              {getEducationLevelLabel(candidate.education_level)}
                              {candidate.education_area && ` - ${candidate.education_area}`}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Resumo Profissional */}
                      {candidate.professional_summary && (
                        <p className="candidate-summary">
                          {candidate.professional_summary}
                        </p>
                      )}
                      
                      {/* Skills */}
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="skills-container">
                          {candidate.skills.slice(0, 5).map((skill) => (
                            <span key={skill.id} className="skill-tag">
                              {skill.name}
                            </span>
                          ))}
                          {candidate.skills.length > 5 && (
                            <span className="skill-tag more">
                              +{candidate.skills.length - 5} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => navigate(`/candidates/${candidate.id}`)}
                      className="view-profile-btn btn-primary btn-sm"
                    >
                      Ver Perfil
                      <svg className="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .candidates-premium-page {
          min-height: 100vh;
          background: var(--ciatos-bg-secondary);
          font-family: var(--font-sans);
        }

        /* Header Premium */
        .premium-header {
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

        .toggle-filters-btn {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          background: linear-gradient(135deg, var(--ciatos-primary) 0%, var(--ciatos-primary-light) 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-base);
          box-shadow: var(--shadow-sm);
        }

        .toggle-filters-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .filter-icon {
          width: 18px;
          height: 18px;
        }

        /* Main Content */
        .main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--space-xl);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        /* Filters Panel */
        .filters-panel {
          background: white;
          padding: var(--space-xl);
        }

        .filters-header {
          margin-bottom: var(--space-xl);
        }

        .filters-header h2 {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          color: var(--ciatos-black);
          margin: 0 0 var(--space-xs) 0;
        }

        .filter-section {
          margin-bottom: var(--space-xl);
        }

        .filter-section:last-of-type {
          margin-bottom: 0;
        }

        .filter-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-weight: 600;
          color: var(--ciatos-graphite);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .section-icon {
          width: 20px;
          height: 20px;
          color: var(--ciatos-primary);
        }

        .ai-toggle {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          cursor: pointer;
        }

        .toggle-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--ciatos-primary);
        }

        .ai-icon {
          width: 16px;
          height: 16px;
        }

        .ai-info {
          display: flex;
          align-items: start;
          gap: var(--space-xs);
          margin-top: var(--space-sm);
          padding: var(--space-sm);
          background: rgba(91, 14, 14, 0.05);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          color: var(--ciatos-gray-dark);
        }

        .info-icon {
          width: 16px;
          height: 16px;
          color: var(--ciatos-primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-md);
        }

        .filter-actions {
          display: flex;
          gap: var(--space-md);
          margin-top: var(--space-xl);
          padding-top: var(--space-xl);
          border-top: 1px solid var(--ciatos-gray-lighter);
        }

        .btn-icon {
          width: 18px;
          height: 18px;
          margin-right: 6px;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: var(--space-xs);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Results Panel */
        .results-panel {
          background: white;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg) var(--space-xl);
          border-bottom: 1px solid var(--ciatos-gray-lighter);
        }

        .results-header h3 {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: var(--ciatos-black);
          margin: 0;
        }

        .results-count {
          font-size: 0.875rem;
          color: var(--ciatos-primary);
          font-weight: 600;
          margin: 0;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--space-2xl) var(--space-xl);
        }

        .empty-icon {
          width: 64px;
          height: 64px;
          color: var(--ciatos-gray-light);
          margin: 0 auto var(--space-md);
        }

        .empty-state h4 {
          font-family: var(--font-serif);
          font-size: 1.25rem;
          color: var(--ciatos-graphite);
          margin: 0 0 var(--space-xs) 0;
        }

        .empty-state p {
          color: var(--ciatos-gray);
          margin: 0;
        }

        /* Candidates List */
        .candidates-list {
          display: flex;
          flex-direction: column;
        }

        .candidate-card {
          padding: var(--space-lg);
          border-bottom: 1px solid var(--ciatos-gray-lighter);
          transition: all var(--transition-base);
        }

        .candidate-card:last-child {
          border-bottom: none;
        }

        .candidate-card:hover {
          background: var(--ciatos-bg-secondary);
          transform: translateX(4px);
        }

        .candidate-main {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: var(--space-lg);
        }

        .candidate-info {
          flex: 1;
        }

        .candidate-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-sm);
        }

        .candidate-name {
          font-family: var(--font-serif);
          font-size: 1.125rem;
          color: var(--ciatos-black);
          margin: 0;
          font-weight: 600;
        }

        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          background: linear-gradient(135deg, rgba(91, 14, 14, 0.1) 0%, rgba(91, 14, 14, 0.05) 100%);
          color: var(--ciatos-primary);
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 12px;
          border: 1px solid rgba(91, 14, 14, 0.2);
        }

        .badge-icon {
          width: 14px;
          height: 14px;
        }

        .candidate-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: 0.875rem;
          color: var(--ciatos-gray-dark);
        }

        .detail-icon {
          width: 16px;
          height: 16px;
          color: var(--ciatos-gray);
          flex-shrink: 0;
        }

        .candidate-summary {
          font-size: 0.875rem;
          color: var(--ciatos-gray-dark);
          line-height: 1.6;
          margin: var(--space-md) 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
          margin-top: var(--space-md);
        }

        .skill-tag {
          padding: 4px 12px;
          background: rgba(91, 14, 14, 0.08);
          color: var(--ciatos-primary);
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 12px;
          border: 1px solid rgba(91, 14, 14, 0.15);
        }

        .skill-tag.more {
          background: var(--ciatos-bg-tertiary);
          color: var(--ciatos-gray);
          border-color: var(--ciatos-gray-lighter);
        }

        .view-profile-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .btn-arrow {
          width: 16px;
          height: 16px;
          transition: transform var(--transition-fast);
        }

        .view-profile-btn:hover .btn-arrow {
          transform: translateX(2px);
        }

        /* Responsividade */
        @media (max-width: 1024px) {
          .header-content {
            padding: var(--space-md) var(--space-lg);
          }

          .main-content {
            padding: var(--space-lg);
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .filter-actions {
            flex-direction: column;
          }

          .candidate-main {
            flex-direction: column;
          }

          .view-profile-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 640px) {
          .header-title-section h1 {
            font-size: 1.25rem;
          }

          .header-subtitle {
            display: none;
          }

          .toggle-filters-btn span {
            display: none;
          }

          .filters-panel,
          .results-panel {
            padding: var(--space-md);
          }

          .candidate-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CandidatesPagePremium;
