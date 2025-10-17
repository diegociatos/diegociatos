import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminUserManagementPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [setCustomPassword, setSetCustomPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'client',
    organization_id: '',
    password: ''
  });
  const [editData, setEditData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, orgsRes] = await Promise.all([
        api.get('/users/'),
        api.get('/organizations/')
      ]);
      setUsers(usersRes.data);
      setOrganizations(orgsRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');

    // Validar se organização foi selecionada
    if (!formData.organization_id) {
      setError('Por favor, selecione uma organização');
      return;
    }

    // Validar senha se o admin optou por definir
    if (setCustomPassword && formData.password.length < 1) {
      setError('Senha deve ter pelo menos 1 caractere');
      return;
    }

    try {
      // Preparar dados - só enviar senha se foi definida
      const payload = {
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role,
        organization_id: formData.organization_id
      };
      
      if (setCustomPassword && formData.password) {
        payload.password = formData.password;
      }
      
      const response = await api.post('/auth/admin/create-user', payload);
      const tempPass = response.data.temporary_password;
      
      // Fechar modal primeiro
      setShowCreateModal(false);
      
      // Resetar formulário
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        role: 'client',
        organization_id: '',
        password: ''
      });
      setSetCustomPassword(false);
      
      // Recarregar lista
      await loadData();
      
      // Mostrar senha após modal fechado
      setTimeout(() => {
        if (setCustomPassword) {
          alert(`Usuário criado com sucesso!\n\nSenha definida: ${tempPass}\n\n⚠️ IMPORTANTE: O usuário deverá trocar essa senha no primeiro login.`);
        } else {
          alert(`Usuário criado com sucesso!\n\nSenha temporária: ${tempPass}\n\n⚠️ IMPORTANTE: Anote essa senha, ela não será exibida novamente.`);
        }
      }, 100);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao criar usuário');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja desativar este usuário?')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      alert('Usuário desativado com sucesso');
      loadData();
    } catch (err) {
      alert('Erro ao desativar usuário');
    }
  };


  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditData({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || ''
    });
    setShowEditModal(true);
    setError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.patch(`/users/${selectedUser.id}`, editData);
      alert('Usuário atualizado com sucesso!');
      setShowEditModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao atualizar usuário');
    }
  };

  const handleOpenChangePassword = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowChangePasswordModal(true);
    setError('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validar senha
    if (newPassword.length < 1) {
      setError('Senha deve ter pelo menos 1 caractere');
      return;
    }

    try {
      const response = await api.put(`/users/${selectedUser.id}/reset-password`, {
        new_password: newPassword
      });
      const newPass = response.data.new_password;
      
      // Fechar modal primeiro
      setShowChangePasswordModal(false);
      setNewPassword('');
      
      // Recarregar lista
      await loadData();
      
      // Mostrar senha após modal fechado
      setTimeout(() => {
        alert(`Senha alterada com sucesso!\n\nNova senha: ${newPass}\n\n⚠️ IMPORTANTE: Anote essa senha e envie para o usuário.\nO usuário pode manter esta senha.`);
      }, 100);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao alterar senha');
    }
  };


  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
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
              <span className="ml-4 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-800"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Gerenciar Usuários</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Criar Usuário
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Papel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                // Função para formatar o papel/role
                const getRoleLabel = (roles) => {
                  if (!roles || roles.length === 0) return '-';
                  const roleMap = {
                    'admin': 'Administrador',
                    'recruiter': 'Analista/Recrutador',
                    'client': 'Cliente',
                    'candidate': 'Candidato'
                  };
                  return roles.map(r => roleMap[r.role] || r.role).join(', ');
                };

                return (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 font-medium">{getRoleLabel(user.roles)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                    {user.requires_password_change && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Trocar senha
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-colors"
                          title="Editar usuário"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleOpenChangePassword(user)}
                          className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition-colors"
                          title="Alterar senha"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Senha
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="inline-flex items-center justify-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-colors"
                        title="Desativar usuário"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Desativar
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Criar Novo Usuário</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Nome Completo *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Telefone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Papel *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="client">Cliente</option>
                  <option value="recruiter">Analista/Recrutador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Organização *</label>
                <select
                  name="organization_id"
                  value={formData.organization_id}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma organização</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.org_type === 'agency' ? 'Agência' : 'Cliente'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Opção de definir senha inicial */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="setCustomPassword"
                    checked={setCustomPassword}
                    onChange={(e) => setSetCustomPassword(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="setCustomPassword" className="ml-2 text-gray-700 font-medium">
                    Definir senha inicial
                  </label>
                </div>

                {setCustomPassword && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Senha Inicial * <span className="text-sm font-normal text-gray-500">(mínimo 1 caractere)</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={setCustomPassword}
                      minLength={1}
                      placeholder="Digite a senha inicial"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      O usuário poderá manter esta senha ou alterá-la no primeiro login.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  {setCustomPassword 
                    ? "O usuário receberá a senha definida e deverá alterá-la no primeiro acesso." 
                    : "Uma senha temporária será gerada automaticamente. O usuário deverá alterá-la no primeiro acesso."}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSetCustomPassword(false);
                    setFormData({
                      email: '',
                      full_name: '',
                      phone: '',
                      role: 'client',
                      organization_id: '',
                      password: ''
                    });
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Editar Usuário</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Nome Completo *</label>
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Telefone</label>
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  💡 Para alterar a senha deste usuário, use o botão "Alterar Senha" na lista.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Alterar Senha</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Usuário:</strong> {selectedUser?.full_name}
              </p>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Nova Senha * <span className="text-sm font-normal text-gray-500">(mínimo 1 caractere)</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={1}
                  placeholder="Digite a nova senha"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  O usuário poderá manter esta senha (não será obrigado a trocar no próximo login).
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-green-800">
                  ✓ A senha será alterada imediatamente e o usuário poderá utilizá-la para fazer login.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setNewPassword('');
                    setError('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
                >
                  Alterar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagementPage;
