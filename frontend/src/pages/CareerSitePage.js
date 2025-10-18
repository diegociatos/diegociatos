import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, Clock, Building, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export default function CareerSitePage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/public');
      setJobs(response.data);
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      toast.error('Erro ao carregar vagas');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    if (!user) {
      toast.error('Você precisa fazer login para se candidatar');
      navigate('/login');
      return;
    }

    try {
      await api.post('/applications', { job_id: jobId });
      toast.success('Candidatura enviada com sucesso!');
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Você já se candidatou a esta vaga');
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Erro ao enviar candidatura');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando vagas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)' }}>
      {/* Header */}
      <header className="glass-card py-8 px-6">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk', color: '#10b981' }}>
                Trabalhe Conosco
              </h1>
              <p className="text-xl text-gray-700">Encontre sua próxima oportunidade profissional</p>
            </div>
            <div className="flex gap-4">
              {user ? (
                <Link to="/candidato/perfil">
                  <Button className="btn-primary" data-testid="my-profile-button">
                    Meu Perfil
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" data-testid="login-button">
                      Fazer Login
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button className="btn-primary" data-testid="signup-button">
                      Cadastrar-se
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vagas Abertas</p>
                  <p className="text-3xl font-bold text-green-600">{jobs.length}</p>
                </div>
                <Briefcase className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Empresas Contratando</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {new Set(jobs.map(j => j.organization_id)).size}
                  </p>
                </div>
                <Building className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Modalidades</p>
                  <p className="text-lg font-bold text-purple-600">
                    Remoto • Híbrido • Presencial
                  </p>
                </div>
                <MapPin className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vagas */}
        {jobs.length === 0 ? (
          <div className="text-center py-12" data-testid="no-public-jobs-message">
            <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma vaga disponível no momento</h3>
            <p className="text-gray-600">Volte em breve para ver novas oportunidades</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Card key={job.id} className="glass-card card-hover" data-testid={`career-job-${job.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Briefcase className="w-8 h-8 text-green-600" />
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {job.work_mode}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl" data-testid={`career-job-title-${job.id}`}>
                    {job.title}
                  </CardTitle>
                  {job.location_city && (
                    <CardDescription className="flex items-center gap-1 mt-2">
                      <MapPin className="w-4 h-4" />
                      {job.location_city}, {job.location_state}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Descrição */}
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {job.description}
                    </p>

                    {/* Tipo de Contratação */}
                    {job.employment_type && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{job.employment_type}</span>
                      </div>
                    )}

                    {/* Salário */}
                    {job.salary_min && job.salary_max && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          R$ {job.salary_min.toLocaleString('pt-BR')} - R$ {job.salary_max.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}

                    {/* Botão Ver Detalhes */}
                    <Button 
                      className="w-full btn-primary mt-4"
                      onClick={() => navigate(`/vagas/${job.id}`)}
                      data-testid={`view-details-button-${job.id}`}
                    >
                      Ver Detalhes
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
