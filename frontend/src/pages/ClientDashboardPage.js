import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, MapPin, Clock, Plus, LogOut, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';

export default function ClientDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_jobs: 0,
    total_candidates: 0
  });

  useEffect(() => {
    fetchClientJobs();
  }, []);

  const fetchClientJobs = async () => {
    try {
      // Buscar organização do cliente
      const rolesRes = await api.get('/users/me/roles');
      const clientRole = rolesRes.data.find(r => r.role === 'client');
      
      if (clientRole) {
        // Buscar vagas da organização
        const jobsRes = await api.get('/jobs/');
        const myJobs = jobsRes.data.filter(job => 
          job.organization_id === clientRole.organization_id
        );
        
        setJobs(myJobs);
        
        // Calcular estatísticas
        const totalCandidates = myJobs.reduce((sum, job) => 
          sum + (job.application_count || 0), 0
        );
        
        setStats({
          total_jobs: myJobs.length,
          total_candidates: totalCandidates
        });
      }
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      toast.error('Erro ao carregar vagas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'open': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'closed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'draft': 'Rascunho',
      'open': 'Aberta',
      'in_progress': 'Em Andamento',
      'closed': 'Fechada'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">Painel do Cliente</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-gray-800">{user?.full_name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Olá, {user?.full_name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">Gerencie suas vagas e acompanhe os candidatos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Vagas</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total_jobs}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Candidatos</p>
                  <p className="text-3xl font-bold text-green-600">{stats.total_candidates}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/jobs/new')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100 mb-1">Nova Vaga</p>
                  <p className="text-2xl font-bold">Criar Agora</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Section */}
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">Suas Vagas em Aberto</h3>
          <Button onClick={() => navigate('/jobs/new')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Vaga
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="py-12">
              <div className="text-center">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Nenhuma vaga cadastrada
                </h3>
                <p className="text-gray-500 mb-6">
                  Comece criando sua primeira vaga e encontre os melhores talentos!
                </p>
                <Button onClick={() => navigate('/jobs/new')} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Vaga
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Card 
                key={job.id}
                className="bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
                onClick={() => navigate(`/job/${job.id}/candidates`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                      {getStatusText(job.status)}
                    </span>
                    <div className="flex items-center text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      <span className="text-sm font-semibold">{job.application_count || 0}</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2 text-gray-800 hover:text-blue-600">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-gray-600">
                    {job.description || 'Sem descrição'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{job.location_city || 'Não especificado'}, {job.location_state || ''}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{job.work_mode || 'Não especificado'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
                      <span>
                        {job.salary_min && job.salary_max 
                          ? `R$ ${job.salary_min} - R$ ${job.salary_max}`
                          : 'Salário a combinar'}
                      </span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/job/${job.id}/candidates`);
                    }}
                  >
                    Ver Candidatos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
