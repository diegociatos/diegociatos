import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Briefcase, FileText, Award, LogOut } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export default function CandidateProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [profile, setProfile] = useState({
    birthdate: '',
    location_city: '',
    location_state: '',
    location_neighborhood: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_zip_code: '',
    salary_expectation: '',
    availability: '',
    resume_filename: '',
    resume_uploaded_at: ''
  });
  const [experience, setExperience] = useState({
    company: '',
    title: '',
    start_date: '',
    end_date: '',
    is_current: false,
    responsibilities: ''
  });
  const [education, setEducation] = useState({
    institution: '',
    degree: '',
    field: '',
    start_year: '',
    end_year: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/candidates/profile');
      setProfile(response.data);
    } catch (error) {
      console.log('Perfil ainda não criado');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/candidates/profile', profile);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };


  const handleAddressUpdate = async () => {
    setLoading(true);
    try {
      await api.put('/candidates/profile/address', {
        address_street: profile.address_street,
        address_number: profile.address_number,
        address_complement: profile.address_complement,
        address_zip_code: profile.address_zip_code,
        location_neighborhood: profile.location_neighborhood,
        location_city: profile.location_city,
        location_state: profile.location_state
      });
      toast.success('Endereço atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar endereço');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', resumeFile);
      
      await api.post('/candidates/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Currículo enviado com sucesso!');
      setResumeFile(null);
      loadProfile(); // Recarregar para mostrar novo currículo
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao enviar currículo');
    } finally {
      setLoading(false);
    }
  };


  const handleExperienceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/candidates/profile/experiences', experience);
      toast.success('Experiência adicionada!');
      setExperience({
        company: '',
        title: '',
        start_date: '',
        end_date: '',
        is_current: false,
        responsibilities: ''
      });
    } catch (error) {
      toast.error('Erro ao adicionar experiência');
    } finally {
      setLoading(false);
    }
  };

  const handleEducationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/candidates/profile/educations', education);
      toast.success('Formação adicionada!');
      setEducation({
        institution: '',
        degree: '',
        field: '',
        start_year: '',
        end_year: ''
      });
    } catch (error) {
      toast.error('Erro ao adicionar formação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f5 100%)' }}>
      <nav className="glass-card border-b py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#10b981' }}>
          Meu Perfil
        </h1>
        <div className="flex items-center gap-4">
          <Link to="/carreiras">
            <Button variant="outline">Ver Vagas</Button>
          </Link>
          <Link to="/candidato/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
          <Button variant="outline" onClick={() => { logout(); navigate('/login'); }} data-testid="logout-button">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-5xl">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="experience" data-testid="tab-experience">
              <Briefcase className="w-4 h-4 mr-2" />
              Experiência
            </TabsTrigger>
            <TabsTrigger value="education" data-testid="tab-education">
              <Award className="w-4 h-4 mr-2" />
              Formação
            </TabsTrigger>
            <TabsTrigger value="questionnaires" data-testid="tab-questionnaires">
              <FileText className="w-4 h-4 mr-2" />
              Questionários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Data de Nascimento</Label>
                      <Input
                        type="date"
                        data-testid="birthdate-input"
                        value={profile.birthdate}
                        onChange={(e) => setProfile({ ...profile, birthdate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Disponibilidade</Label>
                      <Input
                        data-testid="availability-input"
                        placeholder="Ex: Imediato, 30 dias"
                        value={profile.availability}
                        onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Cidade</Label>
                      <Input
                        data-testid="city-input"
                        placeholder="Ex: São Paulo"
                        value={profile.location_city}
                        onChange={(e) => setProfile({ ...profile, location_city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <Input
                        data-testid="state-input"
                        placeholder="Ex: SP"
                        value={profile.location_state}
                        onChange={(e) => setProfile({ ...profile, location_state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Expectativa Salarial (R$)</Label>
                    <Input
                      type="number"
                      data-testid="salary-input"
                      placeholder="Ex: 5000"
                      value={profile.salary_expectation}
                      onChange={(e) => setProfile({ ...profile, salary_expectation: e.target.value })}
                    />
                  </div>

                  {/* Endereço Completo */}
                  <div className="border-t pt-4 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Endereço Completo</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>CEP</Label>
                        <Input
                          placeholder="00000-000"
                          value={profile.address_zip_code}
                          onChange={(e) => setProfile({ ...profile, address_zip_code: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Bairro</Label>
                        <Input
                          placeholder="Nome do bairro"
                          value={profile.location_neighborhood}
                          onChange={(e) => setProfile({ ...profile, location_neighborhood: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label>Rua/Avenida</Label>
                      <Input
                        placeholder="Nome da rua"
                        value={profile.address_street}
                        onChange={(e) => setProfile({ ...profile, address_street: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Número</Label>
                        <Input
                          placeholder="123"
                          value={profile.address_number}
                          onChange={(e) => setProfile({ ...profile, address_number: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Complemento</Label>
                        <Input
                          placeholder="Apto, bloco, etc"
                          value={profile.address_complement}
                          onChange={(e) => setProfile({ ...profile, address_complement: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button 
                      type="button" 
                      onClick={handleAddressUpdate} 
                      variant="outline"
                      disabled={loading}
                    >
                      Atualizar Endereço
                    </Button>
                  </div>

                  {/* Upload de Currículo */}
                  <div className="border-t pt-4 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Currículo</h3>
                    
                    {profile.resume_filename && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          ✓ Currículo atual: <strong>{profile.resume_filename}</strong>
                        </p>
                        {profile.resume_uploaded_at && (
                          <p className="text-xs text-green-600 mt-1">
                            Enviado em: {new Date(profile.resume_uploaded_at).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label>Enviar novo currículo (PDF, DOC ou DOCX)</Label>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setResumeFile(e.target.files[0])}
                      />
                      {resumeFile && (
                        <p className="text-sm text-blue-600">
                          ✓ {resumeFile.name} selecionado ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                      <Button 
                        type="button" 
                        onClick={handleResumeUpload}
                        variant="outline"
                        disabled={!resumeFile || loading}
                      >
                        {loading ? 'Enviando...' : 'Enviar Currículo'}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="btn-primary" data-testid="save-profile-button" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Perfil'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Adicionar Experiência Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleExperienceSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Empresa *</Label>
                      <Input
                        data-testid="company-input"
                        placeholder="Nome da empresa"
                        value={experience.company}
                        onChange={(e) => setExperience({ ...experience, company: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Cargo *</Label>
                      <Input
                        data-testid="title-input"
                        placeholder="Seu cargo"
                        value={experience.title}
                        onChange={(e) => setExperience({ ...experience, title: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Data de Início *</Label>
                      <Input
                        type="date"
                        data-testid="start-date-input"
                        value={experience.start_date}
                        onChange={(e) => setExperience({ ...experience, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Data de Término</Label>
                      <Input
                        type="date"
                        data-testid="end-date-input"
                        value={experience.end_date}
                        onChange={(e) => setExperience({ ...experience, end_date: e.target.value })}
                        disabled={experience.is_current}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_current"
                      data-testid="current-job-checkbox"
                      checked={experience.is_current}
                      onChange={(e) => setExperience({ ...experience, is_current: e.target.checked })}
                    />
                    <Label htmlFor="is_current" className="cursor-pointer">Trabalho aqui atualmente</Label>
                  </div>

                  <div>
                    <Label>Responsabilidades</Label>
                    <Textarea
                      data-testid="responsibilities-input"
                      placeholder="Descreva suas principais atividades e conquistas..."
                      value={experience.responsibilities}
                      onChange={(e) => setExperience({ ...experience, responsibilities: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="btn-primary" data-testid="add-experience-button" disabled={loading}>
                    {loading ? 'Adicionando...' : 'Adicionar Experiência'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Adicionar Formação Acadêmica</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEducationSubmit} className="space-y-4">
                  <div>
                    <Label>Instituição *</Label>
                    <Input
                      data-testid="institution-input"
                      placeholder="Nome da instituição"
                      value={education.institution}
                      onChange={(e) => setEducation({ ...education, institution: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Grau *</Label>
                      <Input
                        data-testid="degree-input"
                        placeholder="Ex: Bacharelado, Mestrado"
                        value={education.degree}
                        onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Área *</Label>
                      <Input
                        data-testid="field-input"
                        placeholder="Ex: Ciência da Computação"
                        value={education.field}
                        onChange={(e) => setEducation({ ...education, field: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Ano de Início *</Label>
                      <Input
                        type="number"
                        data-testid="start-year-input"
                        placeholder="Ex: 2018"
                        value={education.start_year}
                        onChange={(e) => setEducation({ ...education, start_year: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Ano de Conclusão</Label>
                      <Input
                        type="number"
                        data-testid="end-year-input"
                        placeholder="Ex: 2022"
                        value={education.end_year}
                        onChange={(e) => setEducation({ ...education, end_year: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="btn-primary" data-testid="add-education-button" disabled={loading}>
                    {loading ? 'Adicionando...' : 'Adicionar Formação'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questionnaires">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Questionários de Avaliação</CardTitle>
                <p className="text-sm text-gray-600">
                  Complete os questionários para melhorar seu perfil e aumentar suas chances
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Perfil DISC</h3>
                    <p className="text-sm text-gray-600 mb-4">Avalie seu perfil comportamental profissional</p>
                    <Button 
                      variant="outline" 
                      data-testid="disc-questionnaire-button"
                      onClick={() => navigate('/candidato/questionarios')}
                    >
                      Responder Questionário DISC
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Linguagens de Reconhecimento</h3>
                    <p className="text-sm text-gray-600 mb-4">Descubra como você prefere ser reconhecido</p>
                    <Button 
                      variant="outline" 
                      data-testid="recognition-questionnaire-button"
                      onClick={() => navigate('/candidato/questionarios')}
                    >
                      Responder Questionário
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Perfil Comportamental</h3>
                    <p className="text-sm text-gray-600 mb-4">Avalie suas competências comportamentais</p>
                    <Button 
                      variant="outline" 
                      data-testid="behavioral-questionnaire-button"
                      onClick={() => navigate('/candidato/questionarios')}
                    >
                      Responder Questionário
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate('/carreiras')} data-testid="back-to-careers-button">
            Voltar para Vagas
          </Button>
        </div>
      </div>
    </div>
  );
}
