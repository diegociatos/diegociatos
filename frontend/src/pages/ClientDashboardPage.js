import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Users, FileText, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';

export default function ClientDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_jobs: 0,
    active_jobs: 0,
    total_applications: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const rolesRes = await api.get('/users/me/roles');
      const myOrg = rolesRes.data.find(r => r.role === 'client')?.organization_id;
      
      if (myOrg) {
        const response = await api.get(`/reports/organization/${myOrg}/overview`);
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logout realizado com sucesso');
    navigate('/login');
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f5 100%)' }}>
      <nav className="glass-card border-b py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#10b981' }} data-testid="client-dashboard-title">
          Painel do Cliente
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
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Bem-vindo, {user?.full_name}!</h2>
          <p className="text-gray-600">Gerencie suas vagas e acompanhe o processo seletivo</p>
        </div>

        {/* Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Vagas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.total_jobs}</p>
                </div>
                <Briefcase className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vagas Ativas</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.active_jobs}</p>
                </div>
                <Briefcase className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Candidatos</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.total_applications}</p>
                </div>
                <Users className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/jobs/new">
            <Card className="glass-card card-hover cursor-pointer" data-testid="create-job-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Cadastrar Nova Vaga</CardTitle>
                <CardDescription>
                  Crie uma nova vaga e aguarde a revisão do analista de RH
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/cliente/vagas">
            <Card className="glass-card card-hover cursor-pointer" data-testid="my-jobs-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Minhas Vagas</CardTitle>
                <CardDescription>
                  Acompanhe o andamento das suas vagas e candidatos
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/cliente/shortlist">
            <Card className="glass-card card-hover cursor-pointer" data-testid="shortlist-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Candidatos Selecionados</CardTitle>
                <CardDescription>
                  Veja os candidatos pré-selecionados pelo analista de RH
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/cliente/entrevistas">
            <Card className="glass-card card-hover cursor-pointer" data-testid="interviews-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Entrevistas Agendadas</CardTitle>
                <CardDescription>
                  Gerencie suas entrevistas com candidatos
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
