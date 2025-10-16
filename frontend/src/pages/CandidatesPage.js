import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, Briefcase, Award, Search, Filter } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterSkill, setFilterSkill] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await api.get('/candidates/search');
      setCandidates(response.data);
    } catch (error) {
      toast.error('Erro ao carregar candidatos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCity) params.append('city', filterCity);
      if (filterSkill) params.append('skill', filterSkill);
      
      const response = await api.get(`/candidates/search?${params.toString()}`);
      setCandidates(response.data);
    } catch (error) {
      toast.error('Erro ao buscar candidatos');
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (!searchTerm) return true;
    return candidate.location_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           candidate.location_state?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando candidatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0f5 100%)' }}>
      <nav className="glass-card border-b py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk', color: '#10b981' }}>
          Base de Candidatos
        </h1>
        <Link to="/dashboard">
          <Button variant="outline" data-testid="back-to-dashboard">Voltar</Button>
        </Link>
      </nav>

      <div className="container mx-auto p-6">
        {/* Filtros e Busca */}
        <Card className="glass-card mb-6" data-testid="search-filters-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Buscar Candidatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder="Buscar por cidade..."
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  data-testid="city-filter-input"
                />
              </div>
              <div>
                <Input
                  placeholder="Buscar por habilidade..."
                  value={filterSkill}
                  onChange={(e) => setFilterSkill(e.target.value)}
                  data-testid="skill-filter-input"
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button 
                  onClick={handleSearch} 
                  className="btn-primary flex-1"
                  data-testid="search-button"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterCity('');
                    setFilterSkill('');
                    fetchCandidates();
                  }}
                  data-testid="clear-filters-button"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Candidatos</p>
                  <p className="text-3xl font-bold text-green-600" data-testid="total-candidates">
                    {filteredCandidates.length}
                  </p>
                </div>
                <User className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pool Público</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {filteredCandidates.filter(c => c.visibility === 'pool').length}
                  </p>
                </div>
                <Award className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Privados</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {filteredCandidates.filter(c => c.visibility === 'private').length}
                  </p>
                </div>
                <Briefcase className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Candidatos */}
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12" data-testid="no-candidates-message">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum candidato encontrado</h3>
            <p className="text-gray-600">Ajuste os filtros ou aguarde novos cadastros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="glass-card card-hover" data-testid={`candidate-card-${candidate.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg" data-testid={`candidate-name-${candidate.id}`}>
                          Candidato #{candidate.id.substring(0, 8)}
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className={candidate.visibility === 'pool' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}
                          data-testid={`candidate-visibility-${candidate.id}`}
                        >
                          {candidate.visibility === 'pool' ? 'Pool Público' : 'Privado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {candidate.location_city && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{candidate.location_city}, {candidate.location_state}</span>
                      </div>
                    )}
                    
                    {candidate.salary_expectation && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          R$ {candidate.salary_expectation.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}

                    {candidate.availability && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Disponibilidade:</span> {candidate.availability}
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid={`view-candidate-${candidate.id}`}
                      >
                        Ver Perfil Completo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
