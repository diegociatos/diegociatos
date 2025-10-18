import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      
      // Buscar detalhes da vaga
      const jobRes = await api.get(`/jobs/${jobId}`);
      setJob(jobRes.data);

      // Buscar organização
      if (jobRes.data.organization_id) {
        try {
          const orgRes = await api.get(`/organizations/${jobRes.data.organization_id}`);
          setOrganization(orgRes.data);
        } catch (err) {
          console.log('Organização não encontrada');
        }
      }

      // Verificar se já se candidatou
      if (user) {
        try {
          const appsRes = await api.get('/applications/my');
          const alreadyApplied = appsRes.data.some(app => app.job_id === jobId);
          setHasApplied(alreadyApplied);
        } catch (err) {
          console.log('Erro ao verificar candidaturas');
        }
      }
    } catch (err) {
      console.error('Erro ao carregar vaga:', err);
      alert('Erro ao carregar detalhes da vaga');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      alert('Você precisa estar logado para se candidatar');
      navigate('/login');
      return;
    }

    if (hasApplied) {
      alert('Você já se candidatou a esta vaga!');
      return;
    }

    if (!confirm('Deseja se candidatar a esta vaga?')) {
      return;
    }

    try {
      setApplying(true);
      await api.post('/applications', {
        job_id: jobId
      });
      alert('Candidatura enviada com sucesso!');
      setHasApplied(true);
    } catch (err) {
      console.error('Erro ao se candidatar:', err);
      alert(err.response?.data?.detail || 'Erro ao enviar candidatura');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes da vaga...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Vaga não encontrada</h2>
          <button
            onClick={() => navigate('/carreiras')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para vagas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{job.title}</h1>
              {organization && (
                <p className="text-lg text-blue-600 font-semibold">
                  {organization.name}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/carreiras')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Voltar
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            {job.location_city && (
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                📍 {job.location_city}, {job.location_state}
              </span>
            )}
            {job.work_mode && (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                💼 {job.work_mode === 'remote' ? 'Remoto' : job.work_mode === 'hybrid' ? 'Híbrido' : 'Presencial'}
              </span>
            )}
            {job.employment_type && (
              <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                📄 {job.employment_type}
              </span>
            )}
            {job.salary_range_min && job.salary_range_max && (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                💰 R$ {job.salary_range_min} - R$ {job.salary_range_max}
              </span>
            )}
          </div>
        </div>

        {/* Descrição */}
        {job.description && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Descrição da Vaga</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </div>
          </div>
        )}

        {/* Requisitos */}
        {job.requirements && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Requisitos</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.requirements}
            </div>
          </div>
        )}

        {/* Benefícios */}
        {job.benefits && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Benefícios</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.benefits}
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Informações Adicionais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {job.experience_level && (
              <div>
                <p className="text-sm text-gray-600">Nível de Experiência</p>
                <p className="font-semibold text-gray-800">{job.experience_level}</p>
              </div>
            )}
            {job.education_level && (
              <div>
                <p className="text-sm text-gray-600">Escolaridade</p>
                <p className="font-semibold text-gray-800">{job.education_level}</p>
              </div>
            )}
            {job.vacancies && (
              <div>
                <p className="text-sm text-gray-600">Número de Vagas</p>
                <p className="font-semibold text-gray-800">{job.vacancies}</p>
              </div>
            )}
            {organization && (
              <div>
                <p className="text-sm text-gray-600">Empresa Contratante</p>
                <p className="font-semibold text-gray-800">{organization.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Botão de Candidatura */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {hasApplied ? (
            <div className="text-center">
              <div className="inline-block px-6 py-3 bg-green-100 text-green-800 rounded-lg font-semibold mb-4">
                ✓ Você já se candidatou a esta vaga
              </div>
              <p className="text-gray-600">Acompanhe o status da sua candidatura no seu perfil</p>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={handleApply}
                disabled={applying}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
              >
                {applying ? 'Enviando...' : '✓ Candidatar-se a esta vaga'}
              </button>
              <p className="text-sm text-gray-600 mt-4">
                Ao se candidatar, suas informações de perfil serão enviadas para o recrutador
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;
