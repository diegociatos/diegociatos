import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Briefcase } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/applications');
      setApplications(response.data);
    } catch (error) {
      toast.error('Erro ao carregar candidaturas');
    } finally {
      setLoading(false);
    }
  };

  const getStageLabel = (stage) => {
    const labels = {
      submitted: 'Submetida',
      screening: 'Triagem',
      recruiter_interview: 'Entrevista Recrutador',
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
          <p className="mt-4 text-gray-600">Carregando candidaturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f5 100%)' }}>
      <nav className="glass-card border-b py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#10b981' }}>
          Candidaturas
        </h1>
        <Link to="/dashboard">
          <Button variant="outline" data-testid="back-to-dashboard">Voltar</Button>
        </Link>
      </nav>

      <div className="container mx-auto p-6">
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="glass-card card-hover" data-testid={`application-card-${app.id}`}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Briefcase className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold" data-testid={`app-job-title-${app.id}`}>
                        {app.job?.title}
                      </h3>
                    </div>
                    <p className="text-gray-600" data-testid={`app-candidate-name-${app.id}`}>
                      Candidato: {app.candidate?.full_name}
                    </p>
                    {app.candidate?.location_city && (
                      <p className="text-sm text-gray-500">
                        {app.candidate.location_city}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className={`stage-${app.current_stage}`} data-testid={`app-stage-${app.id}`}>
                      {getStageLabel(app.current_stage)}
                    </Badge>
                    {app.stage_score && (
                      <p className="mt-2 text-sm font-medium text-green-600" data-testid={`app-score-${app.id}`}>
                        Score: {app.stage_score.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {applications.length === 0 && (
          <div className="text-center py-12" data-testid="no-applications-message">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma candidatura encontrada</h3>
            <p className="text-gray-600">As candidaturas aparecerão aqui quando houver aplicações</p>
          </div>
        )}
      </div>
    </div>
  );
}
