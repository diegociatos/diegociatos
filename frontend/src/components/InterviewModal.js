import React, { useState } from 'react';
import api from '../services/api';

const InterviewModal = ({ applicationId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: 'recruiter',
    date: '',
    time: '',
    duration: 60,
    locationKind: 'video',
    address: '',
    meetUrl: '',
    phone: '',
    notes: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      setLoading(true);
      
      // Montar starts_at e ends_at
      const startsAt = new Date(`${formData.date}T${formData.time}:00`);
      const endsAt = new Date(startsAt.getTime() + formData.duration * 60000);
      
      // Montar location
      const location = {
        kind: formData.locationKind
      };
      
      if (formData.locationKind === 'onsite') {
        location.address = formData.address;
      } else if (formData.locationKind === 'video') {
        location.meetUrl = formData.meetUrl;
      } else if (formData.locationKind === 'phone') {
        location.phone = formData.phone;
      }
      
      await api.post(`/applications/${applicationId}/interviews`, {
        type: formData.type,
        starts_at_iso: startsAt.toISOString(),
        ends_at_iso: endsAt.toISOString(),
        timezone: 'America/Sao_Paulo',
        location,
        notes: formData.notes
      });
      
      onSuccess();
    } catch (err) {
      console.error('Erro ao agendar entrevista:', err);
      setError(err.response?.data?.detail || 'Erro ao agendar entrevista');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Agendar Entrevista</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Tipo *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="recruiter">RH</option>
              <option value="client">Cliente</option>
              <option value="technical">Técnica</option>
            </select>
          </div>
          
          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Data *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Horário *</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          {/* Duração */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Duração *</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1h 30min</option>
              <option value="120">2 horas</option>
            </select>
          </div>
          
          {/* Local */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Local *</label>
            <select
              value={formData.locationKind}
              onChange={(e) => setFormData({...formData, locationKind: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              <option value="video">Vídeo</option>
              <option value="onsite">Presencial</option>
              <option value="phone">Telefone</option>
            </select>
            
            {formData.locationKind === 'video' && (
              <input
                type="url"
                placeholder="URL da reunião (Google Meet, Zoom, etc)"
                value={formData.meetUrl}
                onChange={(e) => setFormData({...formData, meetUrl: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            )}
            
            {formData.locationKind === 'onsite' && (
              <input
                type="text"
                placeholder="Endereço"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            )}
            
            {formData.locationKind === 'phone' && (
              <input
                type="tel"
                placeholder="Telefone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            )}
          </div>
          
          {/* Notas */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Notas internas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="Observações sobre a entrevista..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Agendando...' : 'Agendar Entrevista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewModal;
