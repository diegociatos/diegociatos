import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const InterviewsCalendarPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('tenant-techcorp-001');
  const [filter, setFilter] = useState({ status: '', type: '' });
  
  useEffect(() => {
    loadInterviews();
  }, [selectedTenant, filter]);
  
  const loadInterviews = async () => {
    try {
      setLoading(true);
      
      // Buscar próximos 30 dias
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const params = new URLSearchParams({
        tenant_id: selectedTenant,
        range_start_iso: now.toISOString(),
        range_end_iso: endDate.toISOString(),
        page: 1,
        page_size: 100
      });
      
      if (filter.status) params.append('status', filter.status);
      if (filter.type) params.append('interview_type', filter.type);
      
      const res = await api.get(`/applications/interviews?${params.toString()}`);
      setInterviews(res.data.interviews || []);
    } catch (err) {
      console.error('Erro ao carregar entrevistas:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const getTypeLabel = (type) => {
    const labels = { recruiter: 'RH', client: 'Cliente', technical: 'Técnica' };
    return labels[type] || type;
  };
  
  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      done: 'bg-green-100 text-green-800',
      no_show: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      scheduled: 'Agendada',
      done: 'Realizada',
      no_show: 'Faltou',
      canceled: 'Cancelada'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando entrevistas...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
                ← Voltar
              </button>
              <h1 className="text-xl font-bold text-gray-800">Calendário de Entrevistas</h1>
            </div>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tenant-techcorp-001">TechCorp</option>
              <option value="tenant-alpha-002">AlphaFoods</option>
            </select>
          </div>
        </div>
      </nav>
      
      {/* Filtros */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex gap-3">
          <select
            value={filter.status}
            onChange={(e) => setFilter({...filter, status: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="scheduled">Agendada</option>
            <option value="done">Realizada</option>
            <option value="no_show">Faltou</option>
            <option value="canceled">Cancelada</option>
          </select>
          
          <select
            value={filter.type}
            onChange={(e) => setFilter({...filter, type: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os tipos</option>
            <option value="recruiter">RH</option>
            <option value="client">Cliente</option>
            <option value="technical">Técnica</option>
          </select>
        </div>
      </div>
      
      {/* Lista de entrevistas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {interviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-gray-500">Nenhuma entrevista agendada</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interviews.map((interview) => {
                  const startsAt = new Date(interview.starts_at);
                  
                  return (
                    <tr key={interview.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {startsAt.toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{getTypeLabel(interview.interview_type)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {interview.location.kind === 'video' && '🎥 Vídeo'}
                          {interview.location.kind === 'onsite' && '📍 Presencial'}
                          {interview.location.kind === 'phone' && '📞 Telefone'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(interview.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => navigate(`/applications/${interview.application_id}`)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Ver candidatura
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewsCalendarPage;
