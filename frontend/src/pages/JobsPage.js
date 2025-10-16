import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, MapPin } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs');
      setJobs(response.data);
    } catch (error) {
      toast.error('Erro ao carregar vagas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-200 text-gray-700',
      in_review: 'bg-yellow-200 text-yellow-800',
      published: 'bg-green-200 text-green-800',
      paused: 'bg-orange-200 text-orange-800',
      closed: 'bg-red-200 text-red-800'
    };
    return colors[status] || 'bg-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Rascunho',
      in_review: 'Em Revisão',
      published: 'Publicada',
      paused: 'Pausada',
      closed: 'Fechada'
    };
    return labels[status] || status;
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f5 100%)' }}>
      <nav className="glass-card border-b py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#10b981' }}>
          Vagas
        </h1>
        <div className="flex gap-2">
          <Link to="/dashboard">
            <Button variant="outline" data-testid="back-to-dashboard">Voltar</Button>
          </Link>
          <Link to="/jobs/new">
            <Button className="btn-primary" data-testid="create-job-button">
              <Plus className="w-4 h-4 mr-2" />
              Nova Vaga
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Link to={`/jobs/${job.id}/dashboard`} key={job.id} data-testid={`job-card-${job.id}`}>
              <Card className="glass-card card-hover cursor-pointer h-full">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Briefcase className="w-6 h-6 text-green-600" />
                    <Badge className={getStatusColor(job.status)} data-testid={`job-status-${job.id}`}>
                      {getStatusLabel(job.status)}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg" data-testid={`job-title-${job.id}`}>{job.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    {job.location_city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location_city}, {job.location_state}</span>
                      </div>
                    )}
                    {job.work_mode && (
                      <Badge variant="outline">{job.work_mode}</Badge>
                    )}
                    {job.salary_min && job.salary_max && (
                      <p className="font-medium text-green-600">
                        R$ {job.salary_min.toLocaleString()} - R$ {job.salary_max.toLocaleString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-12" data-testid="no-jobs-message">
            <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma vaga cadastrada</h3>
            <p className="text-gray-600 mb-4">Comece criando sua primeira vaga</p>
            <Link to="/jobs/new">
              <Button className="btn-primary">Criar Vaga</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
