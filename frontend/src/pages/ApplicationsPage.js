import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, Filter, ChevronRight, User, MapPin, Calendar, Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterJob, setFilterJob] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, jobsRes] = await Promise.all([
        api.get('/applications'),
        api.get('/jobs')
      ]);
      setApplications(appsRes.data);
      setJobs(jobsRes.data);
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
      recruiter_interview: 'Entrevista RH',
      shortlisted: 'Shortlist',
      client_interview: 'Entrevista Cliente',
      offer: 'Proposta',
      hired: 'Contratado',
      rejected: 'Rejeitada',
      withdrawn: 'Desistiu'
    };
    return labels[stage] || stage;
  };

  const getNextStage = (currentStage) => {
    const flow = {
      submitted: 'screening',
      screening: 'recruiter_interview',
      recruiter_interview: 'shortlisted',
      shortlisted: 'client_interview',
      client_interview: 'offer',
      offer: 'hired'
    };
    return flow[currentStage];
  };

  const handleAdvanceStage = async () => {
    if (!selectedApp) return;
    
    try {
      const nextStage = getNextStage(selectedApp.current_stage);
      if (!nextStage) {
        toast.error('Candidato já está no estágio final');
        return;
      }

      await api.post(`/applications/${selectedApp.id}/advance`, {
        to_stage: nextStage,
        note: actionNote
      });

      toast.success('Candidato avançado com sucesso!');
      setShowAdvanceDialog(false);
      setActionNote('');
      setSelectedApp(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao avançar candidato');
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    
    try {
      await api.post(`/applications/${selectedApp.id}/reject`, null, {
        params: { note: actionNote }
      });

      toast.success('Candidato rejeitado');
      setShowRejectDialog(false);
      setActionNote('');
      setSelectedApp(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao rejeitar candidato');
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filterJob !== 'all' && app.job_id !== filterJob) return false;
    if (filterStage !== 'all' && app.current_stage !== filterStage) return false;
    return true;
  });

  // Agrupar por estágio
  const groupedByStage = filteredApplications.reduce((acc, app) => {
    if (!acc[app.current_stage]) {
      acc[app.current_stage] = [];
    }
    acc[app.current_stage].push(app);
    return acc;
  }, {});

  const stages = ['submitted', 'screening', 'recruiter_interview', 'shortlisted', 'client_interview', 'offer', 'hired'];

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
          Pipeline de Candidaturas
        </h1>
        <Link to="/dashboard">
          <Button variant="outline" data-testid="back-to-dashboard">Voltar</Button>
        </Link>
      </nav>

      <div className="container mx-auto p-6">
        {/* Filtros */}
        <Card className="glass-card mb-6" data-testid="filters-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Vaga</label>
                <Select value={filterJob} onValueChange={setFilterJob}>
                  <SelectTrigger data-testid="job-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Vagas</SelectItem>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Estágio</label>
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger data-testid="stage-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Estágios</SelectItem>
                    {stages.map(stage => (
                      <SelectItem key={stage} value={stage}>{getStageLabel(stage)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-green-600">{filteredApplications.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Em Triagem</p>
              <p className="text-3xl font-bold text-yellow-600">
                {filteredApplications.filter(a => a.current_stage === 'screening').length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Shortlist</p>
              <p className="text-3xl font-bold text-purple-600">
                {filteredApplications.filter(a => a.current_stage === 'shortlisted').length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Contratados</p>
              <p className="text-3xl font-bold text-green-700">
                {filteredApplications.filter(a => a.current_stage === 'hired').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Kanban */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12" data-testid="no-applications-message">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma candidatura encontrada</h3>
            <p className="text-gray-600">As candidaturas aparecerão aqui quando houver aplicações</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {stages.map(stage => (
                <div key={stage} className="w-80 flex-shrink-0" data-testid={`stage-column-${stage}`}>
                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{getStageLabel(stage)}</span>
                        <Badge variant="outline">{(groupedByStage[stage] || []).length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {(groupedByStage[stage] || []).map(app => (
                          <Card key={app.id} className="bg-white border hover:shadow-md transition-shadow" data-testid={`app-card-${app.id}`}>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-semibold text-sm" data-testid={`app-candidate-${app.id}`}>
                                    {app.candidate?.full_name || 'Candidato Anônimo'}
                                  </h4>
                                  {app.stage_score && (
                                    <Badge className="bg-green-100 text-green-700" data-testid={`app-score-${app.id}`}>
                                      <Star className="w-3 h-3 mr-1" />
                                      {app.stage_score.toFixed(0)}
                                    </Badge>
                                  )}
                                </div>

                                <div className="text-xs text-gray-600 space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" />
                                    <span>{app.job?.title}</span>
                                  </div>
                                  {app.candidate?.location_city && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{app.candidate.location_city}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Dialog open={showAdvanceDialog && selectedApp?.id === app.id} onOpenChange={(open) => {
                                    setShowAdvanceDialog(open);
                                    if (!open) setSelectedApp(null);
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        className="flex-1 text-xs"
                                        onClick={() => setSelectedApp(app)}
                                        data-testid={`advance-btn-${app.id}`}
                                        disabled={app.current_stage === 'hired'}
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Avançar
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Avançar Candidato</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <p className="text-sm">
                                          Avançar <strong>{selectedApp?.candidate?.full_name}</strong> para{' '}
                                          <strong>{getStageLabel(getNextStage(selectedApp?.current_stage))}</strong>?
                                        </p>
                                        <Textarea
                                          placeholder="Adicione uma nota (opcional)"
                                          value={actionNote}
                                          onChange={(e) => setActionNote(e.target.value)}
                                          data-testid="advance-note-input"
                                        />
                                      </div>
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>
                                          Cancelar
                                        </Button>
                                        <Button onClick={handleAdvanceStage} data-testid="confirm-advance-btn">
                                          Confirmar
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

                                  <Dialog open={showRejectDialog && selectedApp?.id === app.id} onOpenChange={(open) => {
                                    setShowRejectDialog(open);
                                    if (!open) setSelectedApp(null);
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="flex-1 text-xs"
                                        onClick={() => setSelectedApp(app)}
                                        data-testid={`reject-btn-${app.id}`}
                                      >
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Rejeitar
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Rejeitar Candidato</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <p className="text-sm">
                                          Tem certeza que deseja rejeitar <strong>{selectedApp?.candidate?.full_name}</strong>?
                                        </p>
                                        <Textarea
                                          placeholder="Motivo da rejeição (opcional)"
                                          value={actionNote}
                                          onChange={(e) => setActionNote(e.target.value)}
                                          data-testid="reject-note-input"
                                        />
                                      </div>
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                                          Cancelar
                                        </Button>
                                        <Button variant="destructive" onClick={handleReject} data-testid="confirm-reject-btn">
                                          Rejeitar
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
