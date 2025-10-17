import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export default function CreateJobPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    employment_type: '',
    schedule: '',
    benefits: '',
    location_city: '',
    location_state: '',
    work_mode: 'presencial',
    salary_min: '',
    salary_max: '',
    organization_id: ''
  });

  useEffect(() => {
    fetchUserOrganization();
  }, []);

  const fetchUserOrganization = async () => {
    try {
      // Buscar os roles do usuário atual para descobrir sua organização
      const rolesResponse = await api.get('/users/me/roles');
      const roles = rolesResponse.data;
      
      if (roles && roles.length > 0) {
        const userOrgId = roles[0].organization_id;
        
        // Buscar detalhes da organização
        const orgResponse = await api.get(`/organizations/${userOrgId}`);
        setOrganizations([orgResponse.data]);
        setFormData(prev => ({ ...prev, organization_id: userOrgId }));
        
        console.log('Organização do usuário:', orgResponse.data);
      }
    } catch (error) {
      console.error('Erro ao carregar organização do usuário:', error);
      // Fallback: carregar todas as organizações
      try {
        const response = await api.get('/organizations/');
        setOrganizations(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, organization_id: response.data[0].id }));
        }
      } catch (err) {
        console.error('Erro ao carregar organizações:', err);
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null
      };

      await api.post(`/jobs/?organization_id=${formData.organization_id}`, payload);
      
      // Mostrar mensagem de sucesso
      toast.success('Vaga cadastrada com sucesso! Aguarde revisão do analista.');
      
      // Aguardar um pouco antes de navegar para evitar erro de React
      setTimeout(() => {
        navigate('/jobs');
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao cadastrar vaga:', error);
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar vaga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f5 100%)' }}>
      <nav className="glass-card border-b py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#10b981' }}>
          Nova Vaga
        </h1>
        <Button variant="outline" onClick={() => navigate('/jobs')} data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="glass-card" data-testid="create-job-form">
          <CardHeader>
            <CardTitle>Cadastro de Vaga</CardTitle>
            <p className="text-sm text-gray-600">Preencha os detalhes da vaga. O analista de RH irá revisar antes de publicar.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organização */}
              {organizations.length > 1 && (
                <div>
                  <Label>Organização *</Label>
                  <Select value={formData.organization_id} onValueChange={(val) => handleChange('organization_id', val)}>
                    <SelectTrigger data-testid="org-select">
                      <SelectValue placeholder="Selecione a organização" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Título */}
              <div>
                <Label htmlFor="title">Título da Vaga *</Label>
                <Input
                  id="title"
                  data-testid="job-title-input"
                  placeholder="Ex: Desenvolvedor React Júnior"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="description">Descrição Completa *</Label>
                <Textarea
                  id="description"
                  data-testid="job-description-input"
                  placeholder="Descreva as responsabilidades, requisitos e o perfil ideal do candidato..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Contratação */}
                <div>
                  <Label htmlFor="employment_type">Tipo de Contratação</Label>
                  <Input
                    id="employment_type"
                    data-testid="employment-type-input"
                    placeholder="Ex: CLT, PJ, Estágio"
                    value={formData.employment_type}
                    onChange={(e) => handleChange('employment_type', e.target.value)}
                  />
                </div>

                {/* Horário */}
                <div>
                  <Label htmlFor="schedule">Horário de Trabalho</Label>
                  <Input
                    id="schedule"
                    data-testid="schedule-input"
                    placeholder="Ex: 08h às 18h"
                    value={formData.schedule}
                    onChange={(e) => handleChange('schedule', e.target.value)}
                  />
                </div>
              </div>

              {/* Benefícios */}
              <div>
                <Label htmlFor="benefits">Benefícios</Label>
                <Textarea
                  id="benefits"
                  data-testid="benefits-input"
                  placeholder="Ex: Vale refeição, vale transporte, plano de saúde..."
                  value={formData.benefits}
                  onChange={(e) => handleChange('benefits', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cidade */}
                <div>
                  <Label htmlFor="location_city">Cidade</Label>
                  <Input
                    id="location_city"
                    data-testid="city-input"
                    placeholder="Ex: São Paulo"
                    value={formData.location_city}
                    onChange={(e) => handleChange('location_city', e.target.value)}
                  />
                </div>

                {/* Estado */}
                <div>
                  <Label htmlFor="location_state">Estado</Label>
                  <Input
                    id="location_state"
                    data-testid="state-input"
                    placeholder="Ex: SP"
                    value={formData.location_state}
                    onChange={(e) => handleChange('location_state', e.target.value)}
                  />
                </div>

                {/* Modalidade */}
                <div>
                  <Label>Modalidade *</Label>
                  <Select value={formData.work_mode} onValueChange={(val) => handleChange('work_mode', val)}>
                    <SelectTrigger data-testid="work-mode-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                      <SelectItem value="remoto">Remoto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Salário Mínimo */}
                <div>
                  <Label htmlFor="salary_min">Faixa Salarial - Mínimo</Label>
                  <Input
                    id="salary_min"
                    data-testid="salary-min-input"
                    type="number"
                    placeholder="Ex: 3000"
                    value={formData.salary_min}
                    onChange={(e) => handleChange('salary_min', e.target.value)}
                  />
                </div>

                {/* Salário Máximo */}
                <div>
                  <Label htmlFor="salary_max">Faixa Salarial - Máximo</Label>
                  <Input
                    id="salary_max"
                    data-testid="salary-max-input"
                    type="number"
                    placeholder="Ex: 5000"
                    value={formData.salary_max}
                    onChange={(e) => handleChange('salary_max', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="btn-primary flex-1"
                  data-testid="submit-job-button"
                  disabled={loading}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar Vaga'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/jobs')}
                  data-testid="cancel-button"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
