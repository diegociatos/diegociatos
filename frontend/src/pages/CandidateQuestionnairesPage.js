import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CandidateQuestionnairesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [questionnaires, setQuestionnaires] = useState({
    disc: null,
    recognition: null,
    behavioral: null
  });
  const [responses, setResponses] = useState({
    disc: {},
    recognition: {},
    behavioral: {}
  });

  const steps = [
    { key: 'disc', title: 'Perfil DISC', icon: '📊', description: 'Avalie seu perfil comportamental profissional' },
    { key: 'recognition', title: 'Linguagens de Reconhecimento', icon: '💬', description: 'Descubra como você prefere ser reconhecido' },
    { key: 'behavioral', title: 'Perfil Comportamental', icon: '🎯', description: 'Avalie suas competências comportamentais' }
  ];

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    try {
      setLoading(true);
      
      // Tentar verificar se já completou (opcional - não bloqueia se falhar)
      try {
        const statusRes = await api.get('/questionnaires/candidate/assessments');
        if (statusRes.data.questionnaires_completed) {
          navigate('/carreiras');
          return;
        }
      } catch (err) {
        // Ignorar erro de autenticação - candidato pode não estar logado ainda
        console.log('Verificação de status ignorada:', err.response?.status);
      }
      
      // Carregar os 3 questionários (públicos - não precisam autenticação)
      const [disc, recognition, behavioral] = await Promise.all([
        api.get('/questionnaires/disc'),
        api.get('/questionnaires/recognition'),
        api.get('/questionnaires/behavioral')
      ]);

      setQuestionnaires({
        disc: disc.data,
        recognition: recognition.data,
        behavioral: behavioral.data
      });
    } catch (err) {
      console.error('Erro ao carregar questionários:', err);
      alert('Erro ao carregar questionários. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (stepKey, questionId, value, metadata = {}) => {
    setResponses(prev => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        [questionId]: { value, ...metadata }
      }
    }));
  };

  const isStepComplete = (stepKey) => {
    const questionnaire = questionnaires[stepKey];
    if (!questionnaire) return false;
    
    const questionsCount = questionnaire.questions?.length || 0;
    const responsesCount = Object.keys(responses[stepKey]).length;
    
    return responsesCount === questionsCount && questionsCount > 0;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!isStepComplete('disc') || !isStepComplete('recognition') || !isStepComplete('behavioral')) {
      alert('Por favor, responda todas as perguntas dos 3 questionários');
      return;
    }

    try {
      setSubmitting(true);

      // Formatar respostas para o backend
      const formatResponses = (stepKey) => {
        const questionnaire = questionnaires[stepKey];
        return questionnaire.questions.map(q => ({
          question_id: q.id,
          value: responses[stepKey][q.id]?.value || 0,
          ...(q.dimension && { dimension: q.dimension }),
          ...(q.language && { language: q.language }),
          ...(q.competence && { competence: q.competence })
        }));
      };

      const payload = {
        disc: formatResponses('disc'),
        recognition: formatResponses('recognition'),
        behavioral: formatResponses('behavioral')
      };

      await api.post('/questionnaires/candidate/submit-all', payload);

      alert('✅ Questionários enviados com sucesso! Seu perfil foi gerado.');
      navigate('/carreiras');
    } catch (err) {
      console.error('Erro ao enviar questionários:', err);
      alert(err.response?.data?.detail || 'Erro ao enviar questionários. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question, stepKey) => {
    const currentValue = responses[stepKey][question.id]?.value;

    return (
      <div key={question.id} className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <label className="block text-gray-800 font-medium mb-3">
          {question.text}
        </label>

        {question.question_type === 'scale' && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {question.options?.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleResponseChange(
                  stepKey,
                  question.id,
                  opt.value,
                  {
                    dimension: question.dimension,
                    language: question.language,
                    competence: question.competence
                  }
                )}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  currentValue === opt.value
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-blue-400 text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {!currentValue && (
          <p className="text-xs text-red-600 mt-2">* Campo obrigatório</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando questionários...</p>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const currentQuestionnaire = questionnaires[currentStepData.key];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Questionários de Perfil
          </h1>
          <p className="text-gray-600">
            Complete os questionários para acessar as vagas disponíveis
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 transition-all ${
                    index === currentStep
                      ? 'bg-blue-600 text-white scale-110'
                      : index < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index < currentStep ? '✓' : step.icon}
                </div>
                <p className={`text-xs sm:text-sm font-medium text-center ${
                  index === currentStep ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {step.title}
                </p>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block absolute h-0.5 w-full top-6 left-1/2 -z-10 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`} style={{ width: 'calc(100% - 3rem)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Questionnaire */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-2">
              {currentStepData.icon} {currentStepData.title}
            </h2>
            <p className="text-gray-600">{currentStepData.description}</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(Object.keys(responses[currentStepData.key]).length / (currentQuestionnaire?.questions?.length || 1)) * 100}%`
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">
                {Object.keys(responses[currentStepData.key]).length} / {currentQuestionnaire?.questions?.length || 0}
              </span>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {currentQuestionnaire?.questions?.map((question) =>
              renderQuestion(question, currentStepData.key)
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isStepComplete(currentStepData.key)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próximo →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !isStepComplete('behavioral')}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Enviando...' : '✓ Finalizar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateQuestionnairesPage;
