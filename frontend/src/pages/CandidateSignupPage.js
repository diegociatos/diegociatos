import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CandidateSignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/candidate/signup', {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone
      });

      const { access_token, user } = response.data;
      login(access_token, user);
      navigate('/candidato/questionarios');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 my-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Cadastro de Candidato</h1>
          <p className="text-gray-600 mt-2">Crie sua conta e candidate-se a vagas</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Telefone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 99999-9999"
            />
          </div>

          {/* Endereço Completo */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Endereço</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-gray-700 font-medium mb-2">CEP</label>
                <input
                  type="text"
                  name="address_zip_code"
                  value={formData.address_zip_code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="00000-000"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-gray-700 font-medium mb-2">Rua/Avenida</label>
                <input
                  type="text"
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome da rua"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Número</label>
                <input
                  type="text"
                  name="address_number"
                  value={formData.address_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Complemento</label>
                <input
                  type="text"
                  name="address_complement"
                  value={formData.address_complement}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apto, bloco, etc"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-gray-700 font-medium mb-2">Bairro</label>
                <input
                  type="text"
                  name="location_neighborhood"
                  value={formData.location_neighborhood}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do bairro"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Cidade</label>
                <input
                  type="text"
                  name="location_city"
                  value={formData.location_city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Estado</label>
                <select
                  name="location_state"
                  value={formData.location_state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
            </div>
          </div>

          {/* Upload de Currículo */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Currículo</h3>
            <label className="block text-gray-700 font-medium mb-2">
              Envie seu currículo (PDF, DOC ou DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files[0])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {resumeFile && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {resumeFile.name} selecionado
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Senha *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Confirmar Senha *
            </label>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite a senha novamente"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CandidateSignupPage;
