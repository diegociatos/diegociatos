import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import NotificationBell from '../components/NotificationBell';

const RecruiterDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCandidates: 0,
    totalApplications: 0
  });
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas
      const jobsRes = await api.get('/jobs?page=1&page_size=1000');
      const candidatesRes = await api.get('/candidates?page=1&page_size=1000');
      const applicationsRes = await api.get('/applications?page=1&page_size=1000');
      
      setStats({
        totalJobs: jobsRes.data?.length || 0,
        totalCandidates: candidatesRes.data?.length || 0,
        totalApplications: applicationsRes.data?.length || 0
      });
      
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      localStorage.removeItem('token');
      navigate('/login');
    }
  };
  
  const cards = [
    {
      title: 'Vagas',
      description: 'Gerenciar vagas por fase',
      icon: '💼',
      count: stats.totalJobs,
      color: 'blue',
      onClick: () => navigate('/analista/vagas-kanban')
    },
    {
      title: 'Candidatos',
      description: 'Visualizar todos os candidatos',
      icon: '👥',
      count: stats.totalCandidates,
      color: 'green',
      onClick: () => navigate('/candidates')
    },
    {
      title: 'Candidaturas',
      description: 'Todas as candidaturas',
      icon: '📄',
      count: stats.totalApplications,
      color: 'purple',
      onClick: () => navigate('/applications')
    },
    {
      title: 'Relatórios',
      description: 'Análises e relatórios',
      icon: '📊',
      count: '-',
      color: 'orange',
      onClick: () => alert('Funcionalidade de relatórios em desenvolvimento')
    }
  ];
  
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      green: 'bg-green-50 border-green-200 hover:bg-green-100',
      purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    };
    return colors[color] || colors.blue;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">Ciatos Recrutamento</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Analista</span>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Painel do Analista</h2>
          <p className="mt-2 text-gray-600">Gerencie vagas, candidatos e processos de recrutamento</p>
        </div>
        
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <button
              key={index}
              onClick={card.onClick}
              className={`p-6 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${getColorClasses(card.color)}`}
            >
              <div className="text-5xl mb-4">{card.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{card.description}</p>
              <div className="text-3xl font-bold text-gray-800">{card.count}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboardPage;

