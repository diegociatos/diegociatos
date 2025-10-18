import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CandidatesPage = () => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-800">🔍 Busca Avançada de Candidatos</h1>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</span>
            </button>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Painel de Filtros */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Filtros de Busca</h2>
            
            {/* Busca por Texto / IA */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  Busca por Texto ou IA
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-blue-600">
                    ✨ Usar busca por IA (semântica)
                  </span>
                </label>
              </div>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={useAI ? 
                  "Ex: desenvolvedor python com 5 anos de experiência em São Paulo" : 
                  "Buscar por nome, email, formação, resumo profissional..."
                }
              />
              {useAI && (
                <p className="mt-2 text-xs text-gray-500">
                  💡 A IA irá buscar e ranquear candidatos por relevância semântica, não apenas palavras-chave exatas.
                </p>
              )}
            </div>
            
            {/* Localização */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">📍 Localização</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Estado</label>
                  <input
                    type="text"
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SP"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={filters.neighborhood}
                    onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Vila Mariana"
                  />
                </div>
              </div>
            </div>
            
            {/* Formação */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🎓 Formação</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nível de Escolaridade</label>
                  <select
                    value={filters.education_level}
                    onChange={(e) => setFilters({ ...filters, education_level: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {educationLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Área de Formação</label>
                  <input
                    type="text"
                    value={filters.education_area}
                    onChange={(e) => setFilters({ ...filters, education_area: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Engenharia, Administração, TI"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Instituição</label>
                  <input
                    type="text"
                    value={filters.education_institution}
                    onChange={(e) => setFilters({ ...filters, education_institution: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da universidade/escola"
                  />
                </div>
              </div>
            </div>
            
            {/* Faixa Etária */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">📅 Faixa Etária</h3>
              <select
                value={filters.age_range}
                onChange={(e) => setFilters({ ...filters, age_range: e.target.value })}
                className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as idades</option>
                {ageRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Botões */}
            <div className="flex space-x-3">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-gray-400"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Buscando...
                  </span>
                ) : (
                  '🔍 Buscar Candidatos'
                )}
              </button>
              <button
                onClick={handleClearFilters}
                className="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold transition-colors"
              >
                🗑️ Limpar Filtros
              </button>
            </div>
          </div>
        )}
        
        {/* Resultados */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Resultados da Busca
              {candidates.length > 0 && (
                <span className="ml-2 text-blue-600">({candidates.length} candidatos)</span>
              )}
            </h3>
          </div>
          
          {candidates.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-medium">Nenhum candidato encontrado</p>
              <p className="text-sm mt-2">Use os filtros acima para buscar candidatos</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {candidate.user?.full_name || 'Nome não disponível'}
                        </h4>
                        {candidate.ai_relevance_score && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                            ✨ Relevância IA: {candidate.ai_relevance_score}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                        {/* Email */}
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <span>{candidate.user?.email || 'N/A'}</span>
                        </div>
                        
                        {/* Idade */}
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span>{calculateAge(candidate.birthdate)} anos</span>
                        </div>
                        
                        {/* Localização */}
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
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
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
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
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                          {candidate.professional_summary}
                        </p>
                      )}
                      
                      {/* Skills */}
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {candidate.skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill.id}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                            >
                              {skill.name}
                            </span>
                          ))}
                          {candidate.skills.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{candidate.skills.length - 5} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => navigate(`/candidates/${candidate.id}`)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
                    >
                      Ver Perfil →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidatesPage;
