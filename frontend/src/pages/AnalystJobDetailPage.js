import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Mail, Phone, MapPin, Calendar, FileText, CheckCircle, XCircle, Eye, Star, Edit, Send } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';

export default function AnalystJobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisNotes, setAnalysisNotes] = useState('');

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
      setApplications(response.data);
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
      toast.error('Erro ao carregar candidatos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await api.patch(`/applications/${applicationId}`, { status: newStatus });
      toast.success('Status atualizado com sucesso!');
      fetchApplications();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleAddAnalysis = (application) => {
    setSelectedApplication(application);
    setAnalysisNotes(application.analyst_notes || '');
    setShowAnalysisModal(true);
  };

  const saveAnalysis = async () => {
    try {
      await api.patch(`/applications/${selectedApplication.id}`, {
        analyst_notes: analysisNotes,
        status: 'screening'
      });
      toast.success('Análise salva com sucesso!');
      setShowAnalysisModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
      toast.error('Erro ao salvar análise');
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
      'applied': 'Novo Candidato',
      'screening': 'Em Triagem',
      'interview': 'Entrevista',
      'offer': 'Proposta Enviada',
      'hired': 'Contratado',
      'rejected': 'Recusado'
    };
    return texts[status] || status;
  };

  const approveForClient = async (applicationId) => {
    try {
      await api.patch(`/applications/${applicationId}`, {
        status: 'interview',
        approved_by_analyst: true
      });
      toast.success('Candidato aprovado! Cliente poderá visualizar.');
      fetchApplications();
    } catch (error) {
      console.error('Erro ao aprovar candidato:', error);
      toast.error('Erro ao aprovar candidato');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/jobs')}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Vagas
            </Button>
            <h1 className="text-xl font-bold text-gray-800">Gestão de Candidatos - Analista</h1>
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
                  <CardDescription className="text-gray-600 mb-4">
                    {job.description}
                  </CardDescription>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{job.location_city}, {job.location_state}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{applications.length} candidatos</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                      <span>Status: {job.status}</span>
                    </div>
                  </div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Vaga
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-600 mb-1">Novos</p>
              <p className="text-3xl font-bold text-blue-700">
                {applications.filter(a => a.status === 'applied').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-600 mb-1">Em Triagem</p>
              <p className="text-3xl font-bold text-yellow-700">
                {applications.filter(a => a.status === 'screening').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <p className="text-sm text-purple-600 mb-1">Entrevista</p>
              <p className="text-3xl font-bold text-purple-700">
                {applications.filter(a => a.status === 'interview').length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <p className="text-sm text-green-600 mb-1">Aprovados</p>
              <p className="text-3xl font-bold text-green-700">
                {applications.filter(a => a.approved_by_analyst).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Candidates Section */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Candidatos ({applications.length})
          </h3>
        </div>

        {applications.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Nenhum candidato inscrito ainda
                </h3>
                <p className="text-gray-500">
                  Os candidatos que se inscreverem aparecerão aqui para você analisar.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {applications.map((application) => (
              <Card 
                key={application.id}
                className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4"
                style={{
                  borderLeftColor: application.approved_by_analyst ? '#10b981' : '#6b7280'
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xl font-semibold text-gray-800">
                          {application.candidate_name || 'Nome não disponível'}
                          {application.approved_by_analyst && (
                            <span className="ml-3 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                              ✓ Aprovado para Cliente
                            </span>
                          )}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                          <span>{new Date(application.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      {application.analyst_notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-800">
                            <strong>Sua Análise:</strong> {application.analyst_notes}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleAddAnalysis(application)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {application.analyst_notes ? 'Editar Análise' : 'Adicionar Análise'}
                        </Button>
                        
                        {!application.approved_by_analyst && (
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => approveForClient(application.id)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Aprovar para Cliente
                          </Button>
                        )}

                        <select
                          value={application.status}
                          onChange={(e) => handleStatusChange(application.id, e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="applied">Novo</option>
                          <option value="screening">Triagem</option>
                          <option value="interview">Entrevista</option>
                          <option value="offer">Proposta</option>
                          <option value="hired">Contratado</option>
                          <option value="rejected">Recusado</option>
                        </select>

                        <Button 
                          variant="outline"
                          onClick={() => toast.info('Ver perfil completo')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Perfil Completo
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

      {/* Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Análise do Candidato: {selectedApplication?.candidate_name}
            </h3>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Suas Observações e Análise:
              </label>
              <textarea
                value={analysisNotes}
                onChange={(e) => setAnalysisNotes(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Candidato possui boa experiência em... Formação adequada... Recomendo entrevista..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                💡 <strong>Dica:</strong> Esta análise será visível para o cliente junto com o perfil do candidato.
                Seja objetivo e destaque os pontos principais.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowAnalysisModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={saveAnalysis}
              >
                Salvar Análise
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
