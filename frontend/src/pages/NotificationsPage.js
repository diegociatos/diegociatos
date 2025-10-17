import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });
  
  useEffect(() => {
    loadNotifications();
  }, [filter, pagination.page]);
  
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        page_size: 20
      });
      
      if (filter === 'unread') {
        params.append('is_read', 'false');
      }
      
      const res = await api.get(`/notifications?${params.toString()}`);
      setNotifications(res.data.notifications || []);
      setPagination({
        page: res.data.page,
        total_pages: res.data.total_pages
      });
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.post('/notifications/mark-read', {
        ids: [notificationId]
      });
      await loadNotifications();
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      await loadNotifications();
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  };
  
  const groupByDate = (notifications) => {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    notifications.forEach(notif => {
      const date = new Date(notif.created_at);
      const dateStr = date.toDateString();
      
      let label;
      if (dateStr === today) {
        label = 'Hoje';
      } else if (dateStr === yesterday) {
        label = 'Ontem';
      } else {
        label = date.toLocaleDateString('pt-BR');
      }
      
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(notif);
    });
    
    return groups;
  };
  
  const groupedNotifications = groupByDate(notifications);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Voltar
              </button>
              <h1 className="text-xl font-bold text-gray-800">Notificações</h1>
            </div>
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Marcar todas como lidas
            </button>
          </div>
        </div>
      </nav>
      
      {/* Filtros */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setFilter('all');
                setPagination({ ...pagination, page: 1 });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => {
                setFilter('unread');
                setPagination({ ...pagination, page: 1 });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'unread'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Não lidas
            </button>
          </div>
        </div>
      </div>
      
      {/* Lista de Notificações */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando notificações...</p>
          </div>
        ) : Object.keys(groupedNotifications).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-2 text-gray-500">
              {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([date, notifs]) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">{date}</h2>
                <div className="bg-white rounded-lg shadow divide-y">
                  {notifs.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notif.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {!notif.is_read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                            )}
                            <h3 className={`text-sm ${!notif.is_read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                              {notif.title}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.body}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-xs text-gray-400">
                              {new Date(notif.created_at).toLocaleString('pt-BR')}
                            </p>
                            {notif.link && (
                              <button
                                onClick={() => navigate(notif.link)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Ver detalhes →
                              </button>
                            )}
                          </div>
                        </div>
                        {!notif.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                          >
                            Marcar como lida
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Paginação */}
        {pagination.total_pages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-white border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2 bg-white border rounded-lg text-sm">
              Página {pagination.page} de {pagination.total_pages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.total_pages}
              className="px-4 py-2 bg-white border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
