import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const NotificationPreferencesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({});
  const [message, setMessage] = useState('');
  
  const eventTypes = [
    { key: 'job_created', label: 'Vaga criada' },
    { key: 'job_published', label: 'Vaga publicada' },
    { key: 'new_application', label: 'Nova candidatura' },
    { key: 'stage_changed', label: 'Mudança de estágio' },
    { key: 'interview_scheduled', label: 'Entrevista agendada' },
    { key: 'interview_rescheduled', label: 'Entrevista reagendada' },
    { key: 'interview_canceled', label: 'Entrevista cancelada' },
    { key: 'client_feedback', label: 'Feedback do cliente' },
    { key: 'offer_made', label: 'Oferta realizada' },
    { key: 'hired', label: 'Contratação' },
    { key: 'sla_warning', label: 'Aviso de SLA' },
    { key: 'daily_digest', label: 'Resumo diário' }
  ];
  
  useEffect(() => {
    loadPreferences();
  }, []);
  
  const loadPreferences = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/preferences');
      setPreferences(res.data.preferences || {});
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggle = (eventType, channel) => {
    setPreferences({
      ...preferences,
      [eventType]: {
        ...preferences[eventType],
        [channel]: !preferences[eventType]?.[channel]
      }
    });
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      await api.put('/notifications/preferences', {
        updates: preferences
      });
      
      setMessage('Preferências salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar preferências:', err);
      setMessage('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando preferências...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
                ← Voltar
              </button>
              <h1 className="text-xl font-bold text-gray-800">Preferências de Notificação</h1>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.includes('sucesso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Configure suas notificações</h2>
            <p className="text-sm text-gray-600 mt-1">
              Escolha como deseja receber notificações para cada tipo de evento.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo de Evento
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    In-app
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    E-mail
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eventTypes.map((event) => (
                  <tr key={event.key}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {event.label}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={preferences[event.key]?.system || false}
                        onChange={() => handleToggle(event.key, 'system')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={preferences[event.key]?.email || false}
                        onChange={() => handleToggle(event.key, 'email')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                💡 Você pode revogar comunicações a qualquer momento. Para assuntos contratuais essenciais, 
                algumas comunicações podem permanecer ativas (LGPD).
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : 'Salvar Preferências'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesPage;
