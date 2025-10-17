import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const JobEditPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    employment_type: 'CLT',
    schedule: '',
    benefits: '',
    location_city: '',
    location_state: '',
    work_mode: 'presencial',
    salary_min: '',
    salary_max: '',
    status: 'draft'
  });
  
  useEffect(() => {
    loadJobDetails();
    loadApplications();
  }, [jobId]);
  
  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/jobs/${jobId}`);
      setJob(res.data);
      
      // Preencher formulário
      setFormData({
        title: res.data.title || '',
        description: res.data.description || '',
        employment_type: res.data.employment_type || 'CLT',
        schedule: res.data.schedule || '',
        benefits: res.data.benefits || '',
        location_city: res.data.location_city || '',
        location_state: res.data.location_state || '',
        work_mode: res.data.work_mode || 'presencial',
        salary_min: res.data.salary_min || '',
        salary_max: res.data.salary_max || '',
        status: res.data.status || 'draft'
      });
    } catch (err) {
      console.error('Erro ao carregar vaga:', err);
      setError('Erro ao carregar detalhes da vaga');
    } finally {
      setLoading(false);
    }
  };
  
  const loadApplications = async () => {
    try {
      const res = await api.get(`/applications?job_id=${jobId}`);
      setApplications(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar candidaturas:', err);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      setSaving(true);
      
      await api.patch(`/jobs/${jobId}`, formData);
      
      setSuccess('Vaga atualizada com sucesso!');
      await loadJobDetails();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar vaga:', err);
      setError(err.response?.data?.detail || 'Erro ao atualizar vaga');
    } finally {
      setSaving(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const getStatusBadge = (status) => {
    const badges = {
      'draft': 'bg-gray-100 text-gray-800',
      'in_review': 'bg-yellow-100 text-yellow-800',
      'published': 'bg-green-100 text-green-800',
      'paused': 'bg-orange-100 text-orange-800',
      'closed': 'bg-red-100 text-red-800'
    };
    
    const labels = {
      'draft': 'Rascunho',
      'in_review': 'Em Revisão',
      'published': 'Publicada',
      'paused': 'Pausada',
      'closed': 'Fechada'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando vaga...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Voltar
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{job?.title}</h1>
                <p className="text-sm text-gray-500">Editar Vaga</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge(job?.status)}
              <button
                onClick={() => navigate(`/jobs/${jobId}/pipeline`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Ver Pipeline
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Edição */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Informações da Vaga</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Título *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Descrição */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Descrição *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Tipo de Contratação e Jornada */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Tipo de Contratação</label>
                    <select
                      name="employment_type"
                      value={formData.employment_type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CLT">CLT</option>
                      <option value="PJ">PJ</option>
                      <option value="Estágio">Estágio</option>
                      <option value="Temporário">Temporário</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Jornada</label>
                    <input
                      type="text"
                      name="schedule"
                      value={formData.schedule}
                      onChange={handleChange}
                      placeholder="Ex: Segunda a Sexta, 8h às 18h"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Localização */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-gray-700 font-medium mb-2">Cidade</label>
                    <input
                      type="text"
                      name="location_city"
                      value={formData.location_city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-gray-700 font-medium mb-2">Estado</label>
                    <input
                      type="text"
                      name="location_state"
                      value={formData.location_state}
                      onChange={handleChange}
                      placeholder="Ex: SP"
                      maxLength={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-gray-700 font-medium mb-2">Modelo</label>
                    <select
                      name="work_mode"
                      value={formData.work_mode}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="presencial">Presencial</option>
                      <option value="remoto">Remoto</option>
                      <option value="hibrido">Híbrido</option>
                    </select>
                  </div>
                </div>
                
                {/* Salário */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Salário Mínimo (R$)</label>
                    <input
                      type="number"
                      name="salary_min"
                      value={formData.salary_min}
                      onChange={handleChange}
                      min="0"
                      step="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Salário Máximo (R$)</label>
                    <input
                      type="number"
                      name="salary_max"
                      value={formData.salary_max}
                      onChange={handleChange}
                      min="0"
                      step="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Benefícios */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Benefícios</label>
                  <textarea
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Vale refeição, vale transporte, plano de saúde..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Status */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Status da Vaga</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="in_review">Em Revisão</option>
                    <option value="published">Publicada</option>
                    <option value="paused">Pausada</option>
                    <option value="closed">Fechada</option>
                  </select>
                </div>
                
                {/* Botões */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Sidebar - Estatísticas */}
          <div className="space-y-6">
            {/* Card de Estatísticas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Estatísticas</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total de Candidatos</span>
                  <span className="font-bold text-gray-900">{applications.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Criada em</span>
                  <span className="text-gray-900">
                    {job?.created_at ? new Date(job.created_at).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Última atualização</span>
                  <span className="text-gray-900">
                    {job?.updated_at ? new Date(job.updated_at).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Ações Rápidas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/jobs/${jobId}/pipeline`)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Ver Pipeline Kanban
                </button>
                
                <button
                  onClick={() => navigate(`/interviews-calendar`)}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  Ver Entrevistas
                </button>
                
                <button
                  onClick={() => alert('Funcionalidade de relatórios em desenvolvimento')}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 text-sm"
                >
                  Gerar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobEditPage;
