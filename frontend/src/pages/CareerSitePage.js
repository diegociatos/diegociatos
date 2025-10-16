import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

export default function CareerSitePage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/public');
      setJobs(response.data);
    } catch (error) {
      toast.error('Erro ao carregar vagas');
    } finally {
      setLoading(false);
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
      <header className="glass-card py-12 text-center">
        <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk', color: '#10b981' }}>
          Trabalhe Conosco
        </h1>
        <p className="text-xl text-gray-700">Encontre sua próxima oportunidade profissional</p>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Link to={`/carreiras/vaga/${job.id}`} key={job.id} data-testid={`career-job-${job.id}`}>
              <Card className="glass-card card-hover cursor-pointer h-full">
                <CardHeader>
                  <Briefcase className="w-8 h-8 text-green-600 mb-2" />
                  <CardTitle data-testid={`career-job-title-${job.id}`}>{job.title}</CardTitle>
                  <CardDescription>
                    {job.location_city && `${job.location_city}, ${job.location_state}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="outline">{job.work_mode}</Badge>
                    {job.salary_min && job.salary_max && (
                      <p className="text-sm font-medium text-green-600">
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
          <div className="text-center py-12" data-testid="no-public-jobs-message">
            <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma vaga disponível no momento</h3>
            <p className="text-gray-600">Volte em breve para ver novas oportunidades</p>
          </div>
        )}
      </div>
    </div>
  );
}
