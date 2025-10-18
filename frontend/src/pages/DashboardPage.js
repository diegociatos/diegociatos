import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Users, FileText, BarChart3, LogOut, UserCog } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user, logout, getUserRole, userRoles } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRecruiter, setIsRecruiter] = useState(false);

  useEffect(() => {
    // Verificar role quando userRoles mudar
    if (userRoles && userRoles.length > 0) {
      const role = getUserRole();
      setIsAdmin(role === 'admin');
      setIsRecruiter(role === 'recruiter');
    }
  }, [userRoles, getUserRole]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  // Cards para Admin
  const adminCards = [
    { title: 'Vagas', description: 'Gerenciar vagas e publicações', icon: Briefcase, link: '/jobs', color: '#10b981', testId: 'card-jobs' },
    { title: 'Candidatos', description: 'Buscar e gerenciar candidatos', icon: Users, link: '/candidates', color: '#3b82f6', testId: 'card-candidates' },
    { title: 'Candidaturas', description: 'Pipeline e avaliações', icon: FileText, link: '/applications', color: '#8b5cf6', testId: 'card-applications' },
    { title: 'Relatórios', description: 'Análises e métricas', icon: BarChart3, link: '/reports', color: '#f59e0b', testId: 'card-reports' },
    { title: 'Organizações', description: 'Cadastrar empresas clientes', icon: UserCog, link: '/admin/organizacoes', color: '#06b6d4', testId: 'card-organizations' },
    { title: 'Gerenciar Usuários', description: 'Criar e gerenciar usuários', icon: UserCog, link: '/admin/usuarios', color: '#ec4899', testId: 'card-users' }
  ];

  // Cards APENAS para Analista/Recruiter
  const recruiterCards = [
    { title: 'Vagas', description: 'Gerenciar vagas por fase', icon: Briefcase, link: '/analista/vagas-kanban', color: '#10b981', testId: 'card-jobs' },
    { title: 'Candidatos', description: 'Visualizar todos os candidatos', icon: Users, link: '/candidates', color: '#3b82f6', testId: 'card-candidates' }
  ];

  // Escolher cards baseado no role
  const cards = isRecruiter ? recruiterCards : adminCards;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f5 100%)' }}>
      <nav className="glass-card border-b py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#10b981' }} data-testid="dashboard-title">
          Ciatos Recrutamento
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-right" data-testid="user-info">
            <p className="font-medium">{user?.full_name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          {user?.picture && (
            <img src={user.picture} alt="Avatar" className="w-10 h-10 rounded-full" />
          )}
          <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Bem-vindo de volta!</h2>
          <p className="text-gray-600">Gerencie suas vagas, candidatos e processos seletivos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link to={card.link} key={card.link} data-testid={card.testId}>
                <Card className="glass-card card-hover cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${card.color}20` }}>
                      <Icon className="w-6 h-6" style={{ color: card.color }} />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Atalhos e Informações apenas para Admin */}
        {isAdmin && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Atalhos Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/jobs/new">
                  <Button variant="outline" className="w-full justify-start" data-testid="quick-new-job">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Criar Nova Vaga
                  </Button>
                </Link>
                <Link to="/candidates/search">
                  <Button variant="outline" className="w-full justify-start" data-testid="quick-search-candidates">
                    <Users className="w-4 h-4 mr-2" />
                    Buscar Candidatos
                  </Button>
                </Link>
                <Link to="/admin/organizacoes">
                  <Button variant="outline" className="w-full justify-start" data-testid="quick-manage-orgs">
                    <UserCog className="w-4 h-4 mr-2" />
                    Gerenciar Organizações
                  </Button>
                </Link>
                <Link to="/admin/usuarios">
                  <Button variant="outline" className="w-full justify-start" data-testid="quick-manage-users">
                    <UserCog className="w-4 h-4 mr-2" />
                    Gerenciar Usuários
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Perfil:</strong> {getUserRole() || 'Carregando...'}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>É Admin?</strong> {isAdmin ? 'Sim' : 'Não'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Total de Cards:</strong> {cards.length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
