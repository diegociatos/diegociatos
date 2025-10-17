import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ApplicationHistoryPage = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(null);
  
  useEffect(() => {
    loadHistory();
  }, [applicationId]);
  
  const loadHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/applications/${applicationId}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };
  
  const stageLabels = {
    submitted: 'Coleta de Dados',
    screening: 'Triagem',
    recruiter_interview: 'Entrevista RH',
    shortlisted: 'Selecionados',
    client_interview: 'Entrevista com Cliente',
    offer: 'Oferta',
    hired: 'Contratado',
    rejected: 'Reprovado',
    withdrawn: 'Desistência'
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando histórico...</p>
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
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Voltar
              </button>
              <h1 className="text-xl font-bold text-gray-800">Histórico de Mudanças</h1>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {history && history.history && history.history.length > 0 ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Timeline do Processo Seletivo</h2>
            </div>
            
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {history.history.map((entry, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== history.history.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900">
                                {entry.from ? (
                                  <>
                                    De <span className="font-semibold">{stageLabels[entry.from] || entry.from}</span> para{' '}
                                    <span className="font-semibold">{stageLabels[entry.to] || entry.to}</span>
                                  </>
                                ) : (
                                  <>
                                    Movido para <span className="font-semibold">{stageLabels[entry.to] || entry.to}</span>
                                  </>
                                )}
                              </p>
                              <p className="mt-0.5 text-sm text-gray-500">
                                Por: {entry.changedByName || 'Usuário'}
                              </p>
                              {entry.note && (
                                <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  💬 {entry.note}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time>{new Date(entry.changedAt).toLocaleDateString('pt-BR')}</time>
                              <br />
                              <time className="text-xs">{new Date(entry.changedAt).toLocaleTimeString('pt-BR')}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-gray-500">Nenhum histórico disponível</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationHistoryPage;
