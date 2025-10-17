import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Mail, Phone, MapPin, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';

export default function JobCandidatesPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobDetails();
    fetchApplications();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      setJob(response.data);
    } catch (error) {
      console.error('Erro ao carregar vaga:', error);
      toast.error('Erro ao carregar detalhes da vaga');
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get(`/applications/?job_id=${jobId}`);
      // Cliente vê apenas candidatos aprovados pelo analista
      const approvedCandidates = response.data.filter(app => app.approved_by_analyst === true);
      setApplications(approvedCandidates);
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
      toast.error('Erro ao carregar candidatos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'applied': 'bg-blue-100 text-blue-800',
      'screening': 'bg-yellow-100 text-yellow-800',
      'interview': 'bg-purple-100 text-purple-800',
      'offer': 'bg-green-100 text-green-800',
      'hired': 'bg-green-200 text-green-900',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'applied': 'Candidato',
      'screening': 'Triagem',
      'interview': 'Entrevista',
      'offer': 'Proposta',
      'hired': 'Contratado',
      'rejected': 'Recusado'
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
            <Button 
              variant="ghost" 
              onClick={() => navigate('/cliente/dashboard')}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Candidatos da Vaga</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Job Info Card */}
        {job && (
          <Card className="bg-white shadow-sm mb-8">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-gray-800 mb-2">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {job.description}
                  </CardDescription>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{job.location_city}, {job.location_state}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{applications.length} candidatos</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Candidates Section */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Candidatos Inscritos ({applications.length})
          </h3>
        </div>

        {applications.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Nenhum candidato ainda
                </h3>
                <p className="text-gray-500">
                  Aguarde candidatos se inscreverem nesta vaga.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {applications.map((application) => (
              <Card 
                key={application.id}
                className="bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-semibold text-gray-800">
                          {application.candidate_name || 'Nome não disponível'}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{application.candidate_email || 'Email não disponível'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{application.candidate_phone || 'Telefone não disponível'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Inscrito em: {new Date(application.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Score: {application.score || 'N/A'}</span>
                        </div>
                      </div>

                      {application.cover_letter && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-700">
                            <strong>Carta de apresentação:</strong> {application.cover_letter}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => toast.success('Candidato aprovado!')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => toast.error('Candidato recusado')}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Recusar
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => toast.info('Visualizar perfil completo')}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Perfil
                        </Button>
                      </div>
                    </div>
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
