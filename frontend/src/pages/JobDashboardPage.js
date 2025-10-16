import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function JobDashboardPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      const [jobRes, appsRes, statsRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/applications?job_id=${jobId}`),
        api.get(`/reports/pipeline/${jobId}`)
      ]);

      setJob(jobRes.data);
      setApplications(appsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados da vaga');
    } finally {
      setLoading(false);
    }
  };

  const getStageLabel = (stage) => {
    const labels = {
      submitted: 'Submetida',
      screening: 'Triagem',
      recruiter_interview: 'Entrevista RH',
      shortlisted: 'Shortlist',
      client_interview: 'Entrevista Cliente',
      offer: 'Proposta',
      hired: 'Contratado'
    };
    return labels[stage] || stage;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Vaga não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f5 100%)' }}>
      <nav className="glass-card border-b py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#10b981' }}>
          Acompanhamento da Vaga
        </h1>
        <Link to="/jobs">
          <Button variant="outline" data-testid="back-button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </nav>

      <div className="container mx-auto p-6">
        {/* Informações da Vaga */}
        <Card className="glass-card mb-6" data-testid="job-info-card">
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="job-title">{job.title}</CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <Badge className={`stage-${job.status}`} data-testid="job-status">
                {job.status === 'draft' && 'Rascunho'}
                {job.status === 'in_review' && 'Em Revisão'}
                {job.status === 'published' && 'Publicada'}
                {job.status === 'paused' && 'Pausada'}
                {job.status === 'closed' && 'Fechada'}
              </Badge>
              <span className="text-sm text-gray-600">
                {job.location_city && `${job.location_city}, ${job.location_state}`}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card" data-testid="total-applications-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Candidaturas</p>
                  <p className="text-3xl font-bold text-green-600" data-testid="total-count">
                    {stats.total_applications || 0}
                  </p>
                </div>
                <Users className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Triagem</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.stages?.screening || 0}
                  </p>
                </div>
                <Clock className="w-12 h-12 text-yellow-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shortlist</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.stages?.shortlisted || 0}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Contratados</p>
                  <p className="text-3xl font-bold text-green-700">
                    {stats.stages?.hired || 0}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-700 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Visual */}
        <Card className="glass-card mb-6">
          <CardHeader>
            <CardTitle>Pipeline de Candidatos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(stats.stages || {}).map(([stage, count]) => (
                <div key={stage} className="text-center p-4 bg-white rounded-lg border" data-testid={`stage-${stage}`}>
                  <p className="text-sm text-gray-600 mb-2">{getStageLabel(stage)}</p>
                  <p className="text-2xl font-bold text-green-600">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Candidatos */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Candidatos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.length === 0 ? (
                <p className="text-center text-gray-500 py-8" data-testid="no-applications">
                  Nenhuma candidatura recebida ainda
                </p>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                    data-testid={`application-${app.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold" data-testid={`candidate-name-${app.id}`}>
                          {app.candidate?.full_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {app.candidate?.location_city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {app.stage_score && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Score</p>
                          <p className="text-lg font-bold text-green-600" data-testid={`score-${app.id}`}>
                            {app.stage_score.toFixed(1)}
                          </p>
                        </div>
                      )}
                      <Badge className={`stage-${app.current_stage}`} data-testid={`stage-badge-${app.id}`}>
                        {getStageLabel(app.current_stage)}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
