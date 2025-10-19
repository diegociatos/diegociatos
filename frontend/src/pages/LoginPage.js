import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import '../ciatos-design-system.css';

const AUTH_REDIRECT_URL = `${window.location.origin}/dashboard`;
const GOOGLE_AUTH_URL = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(AUTH_REDIRECT_URL)}`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, getUserRole, userRoles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRoles.length > 0) {
      redirectBasedOnRole();
    }
  }, [user, userRoles]);

  const redirectBasedOnRole = () => {
    const role = getUserRole();
    console.log('Redirecionando para role:', role);
    
    switch(role) {
      case 'candidate':
        navigate('/candidato/perfil');
        break;
      case 'client':
        navigate('/cliente/dashboard');
        break;
      case 'recruiter':
        navigate('/dashboard');
        break;
      case 'admin':
        navigate('/dashboard');
        break;
      default:
        console.log('Role não identificado:', role);
        navigate('/dashboard');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await login(email, password);
      
      // Verificar se precisa trocar senha
      if (response.user && response.user.requires_password_change) {
        toast.info('Você precisa alterar sua senha no primeiro acesso');
        navigate('/change-password');
        return;
      }
      
      toast.success('Login realizado com sucesso!');
      redirectBasedOnRole();
    } catch (error) {
      toast.error('Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Autenticando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* Lado Esquerdo - Branding */}
      <div className="login-branding">
        <div className="branding-content">
          <img 
            src="https://customer-assets.emergentagent.com/job_ats-workflow/artifacts/izsbq46f_Logo%20Grupo%20Ciatos.png" 
            alt="Grupo Ciatos" 
            className="ciatos-logo-lg animate-fade-in"
          />
          <h1 className="branding-title animate-fade-in" style={{animationDelay: '0.2s'}}>
            Ciatos Recrutamento
          </h1>
          <p className="branding-subtitle animate-fade-in" style={{animationDelay: '0.3s'}}>
            Plataforma de Recrutamento e Seleção do Grupo Ciatos Reestruturações Empresariais
          </p>
          <div className="branding-features animate-fade-in" style={{animationDelay: '0.4s'}}>
            <div className="feature-item">
              <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Gestão Completa de Vagas</span>
            </div>
            <div className="feature-item">
              <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Análise de Candidatos</span>
            </div>
            <div className="feature-item">
              <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Relatórios e Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="login-form-side">
        <div className="login-card card-elevated animate-slide-in" data-testid="login-card">
          <div className="login-header">
            <h2>Bem-vindo de volta</h2>
            <p className="text-muted">Entre com suas credenciais para acessar a plataforma</p>
          </div>

          <form onSubmit={handleLogin} className="login-form" data-testid="login-form">
            <div className="input-group">
              <label className="input-label" htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                data-testid="login-email-input"
                type="email"
                className="input-field"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password">Senha</label>
              <input
                id="login-password"
                data-testid="login-password-input"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="login-options">
              <label className="checkbox-label">
                <input type="checkbox" className="checkbox-input" />
                <span>Lembrar-me</span>
              </label>
              <a href="#" className="link-primary">Esqueceu a senha?</a>
            </div>

            <button 
              type="submit" 
              className="btn-primary btn-full" 
              data-testid="login-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Entrando...
                </>
              ) : (
                'Entrar na plataforma'
              )}
            </button>
          </form>

          {/* Links Rápidos por Tipo de Usuário */}
          <div className="user-types-section">
            <p className="section-title">Acesso rápido por perfil:</p>
            <div className="user-types-grid">
              <div className="user-type-card">
                <p className="user-type-title">Sou Candidato</p>
                <p className="user-type-subtitle">Criar conta grátis</p>
                <Link to="/candidato/cadastro">
                  <button className="btn-secondary btn-sm btn-full">
                    Cadastrar
                  </button>
                </Link>
              </div>
              
              <div className="user-type-card">
                <p className="user-type-title">Sou Cliente</p>
                <p className="user-type-subtitle">Preciso contratar</p>
                <p className="user-type-note">Use suas credenciais</p>
              </div>
            </div>
            
            <div className="quick-links">
              <Link to="/carreiras" className="link-primary">
                Ver vagas disponíveis →
              </Link>
            </div>
            
            <div className="admin-note">
              <p>Admin/Recruiter: Use o login padrão acima</p>
            </div>
          </div>

          <div className="login-footer">
            <p className="text-muted text-center">
              © Grupo Ciatos Reestruturações Empresariais – Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          min-height: 100vh;
          background: var(--ciatos-bg-secondary);
        }

        /* Lado Esquerdo - Branding */
        .login-branding {
          flex: 1;
          background: linear-gradient(135deg, var(--ciatos-primary) 0%, var(--ciatos-primary-dark) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-2xl);
          position: relative;
          overflow: hidden;
        }

        .login-branding::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.5;
        }

        .branding-content {
          position: relative;
          z-index: 1;
          max-width: 500px;
          color: white;
        }

        .branding-title {
          font-size: 3rem;
          font-weight: 700;
          margin: var(--space-lg) 0 var(--space-md);
          color: white;
        }

        .branding-subtitle {
          font-size: 1.125rem;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: var(--space-xl);
        }

        .branding-features {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
        }

        .feature-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        /* Lado Direito - Formulário */
        .login-form-side {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl);
          background: var(--ciatos-bg-secondary);
        }

        .login-card {
          width: 100%;
          max-width: 480px;
          padding: var(--space-2xl);
        }

        .login-header {
          margin-bottom: var(--space-xl);
        }

        .login-header h2 {
          margin-bottom: var(--space-xs);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .login-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          margin: calc(var(--space-sm) * -1) 0 var(--space-sm);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          cursor: pointer;
          color: var(--ciatos-gray);
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .link-primary {
          color: var(--ciatos-primary);
          text-decoration: none;
          font-weight: 600;
          transition: all var(--transition-fast);
        }

        .link-primary:hover {
          color: var(--ciatos-primary-hover);
        }

        .btn-full {
          width: 100%;
        }

        .btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: var(--space-md);
          border: 1px solid var(--ciatos-gray-lighter);
          background: white;
          color: var(--ciatos-gray-dark);
          border-radius: var(--radius-md);
          font-weight: 600;
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .btn-google:hover {
          background: var(--ciatos-bg-secondary);
          border-color: var(--ciatos-gray);
        }

        .google-icon {
          width: 20px;
          height: 20px;
        }

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: var(--space-md) 0;
          color: var(--ciatos-gray);
          font-size: 0.875rem;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--ciatos-gray-lighter);
        }

        .divider span {
          padding: 0 var(--space-sm);
        }

        .user-types-section {
          margin-top: var(--space-xl);
          padding-top: var(--space-md);
          border-top: 1px solid var(--ciatos-gray-lighter);
        }

        .section-title {
          font-size: 0.875rem;
          color: var(--ciatos-gray);
          text-align: center;
          margin-bottom: var(--space-md);
        }

        .user-types-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .user-type-card {
          text-align: center;
          padding: var(--space-sm);
          border: 1px solid var(--ciatos-gray-lighter);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .user-type-card:hover {
          background: var(--ciatos-bg-secondary);
        }

        .user-type-title {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: var(--space-xs);
        }

        .user-type-subtitle {
          font-size: 0.75rem;
          color: var(--ciatos-gray);
          margin-bottom: var(--space-sm);
        }

        .user-type-note {
          font-size: 0.75rem;
          color: var(--ciatos-primary);
        }

        .quick-links {
          text-align: center;
          margin-bottom: var(--space-sm);
        }

        .admin-note {
          text-align: center;
        }

        .admin-note p {
          font-size: 0.75rem;
          color: var(--ciatos-gray);
        }

        .login-footer {
          margin-top: var(--space-xl);
          padding-top: var(--space-md);
          border-top: 1px solid var(--ciatos-gray-lighter);
        }

        .login-footer p {
          font-size: 0.75rem;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: var(--space-xs);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsividade */
        @media (max-width: 1024px) {
          .login-branding {
            display: none;
          }
          
          .login-form-side {
            flex: 1;
          }
        }

        @media (max-width: 640px) {
          .login-card {
            padding: var(--space-lg);
          }
          
          .branding-title {
            font-size: 2rem;
          }

          .user-types-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
