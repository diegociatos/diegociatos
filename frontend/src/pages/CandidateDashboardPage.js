import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, FileText, Briefcase, Upload, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

export default function CandidateDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, appsRes] = await Promise.all([
        api.get('/candidates/profile').catch(() => null),
        api.get('/applications/my').catch(() => ({ data: [] }))
      ]);
      
      if (profileRes) {
        setProfile(profileRes.data);
        checkProfileCompleteness(profileRes.data);
      }
      
      setApplications(appsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const checkProfileCompleteness = (profile) => {
    const hasBasicInfo = profile.location_city && profile.availability;
    setProfileComplete(hasBasicInfo);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  const getStageLabel = (stage) => {
    const labels = {
      submitted: 'Submetida',
      screening: 'Em Análise',
      recruiter_interview: 'Entrevista RH',
      shortlisted: 'Pré-Selecionado',
      client_interview: 'Entrevista Cliente',
      offer: 'Proposta Enviada',
      hired: 'Contratado!',
      rejected: 'Não Selecionado'
    };
    return labels[stage] || stage;
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)' }}>
      <nav className="glass-card border-b py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#10b981' }} data-testid="candidate-dashboard-title">
          Meu Painel
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-right" data-testid="user-info">
            <p className="font-medium">{user?.full_name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Olá, {user?.full_name}!
          </h2>
          <p className="text-gray-700">Complete seu perfil e candidate-se às vagas disponíveis</p>
        </div>

        {/* Alerta de Perfil Incompleto */}
        {!profileComplete && (
          <Card className="glass-card mb-6 border-yellow-500 bg-yellow-50" data-testid="profile-incomplete-alert">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Complete seu Perfil</h3>
                  <p className="text-gray-700 mb-4">
                    Para se candidatar às vagas, você precisa completar seu perfil com suas informações profissionais e responder aos questionários.
                  </p>
                  <Link to="/candidato/perfil">
                    <Button className="btn-primary" data-testid="complete-profile-button">
                      Completar Perfil Agora
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Minhas Candidaturas</p>
                  <p className="text-3xl font-bold text-green-600">{applications.length}</p>
                </div>
                <Briefcase className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Processo</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {applications.filter(a => a.status === 'active').length}
                  </p>
                </div>
                <FileText className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Perfil</p>
                  <p className="text-lg font-bold text-purple-600">
                    {profileComplete ? 'Completo' : 'Incompleto'}
                  </p>
                </div>
                {profileComplete ? (
                  <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
                ) : (
                  <User className="w-12 h-12 text-purple-600 opacity-20" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link to="/candidato/perfil">
            <Card className="glass-card card-hover cursor-pointer" data-testid="edit-profile-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Meu Perfil</CardTitle>
                <CardDescription>
                  Complete suas informações, experiências e responda aos questionários
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/carreiras">
            <Card className="glass-card card-hover cursor-pointer" data-testid="browse-jobs-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Vagas Disponíveis</CardTitle>
                <CardDescription>
                  Navegue pelas vagas abertas e candidate-se
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Minhas Candidaturas */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Minhas Candidaturas</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8" data-testid="no-applications">
                <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Você ainda não se candidatou a nenhuma vaga</p>
                <Link to="/carreiras">
                  <Button className="btn-primary">Ver Vagas Disponíveis</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow"
                    data-testid={`my-application-${app.id}`}
                  >
                    <div>
                      <h4 className="font-semibold" data-testid={`app-job-title-${app.id}`}>
                        {app.job?.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Candidatura enviada em {new Date(app.applied_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge className={`stage-${app.current_stage}`} data-testid={`app-status-${app.id}`}>
                      {getStageLabel(app.current_stage)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
