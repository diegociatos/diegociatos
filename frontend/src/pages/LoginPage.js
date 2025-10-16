import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const AUTH_REDIRECT_URL = `${window.location.origin}/dashboard`;
const GOOGLE_AUTH_URL = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(AUTH_REDIRECT_URL)}`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin, user, getUserRole, userRoles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      handleGoogleCallback(sessionId);
    } else if (user && userRoles.length > 0) {
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

  const handleGoogleCallback = async (sessionId) => {
    setLoading(true);
    try {
      await googleLogin(sessionId);
      window.history.replaceState(null, '', '/dashboard');
      navigate('/dashboard');
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer login com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Iniciando login...');
      const response = await login(email, password);
      console.log('Login response:', response);
      console.log('Token no localStorage:', localStorage.getItem('access_token'));
      
      // Verificar se precisa trocar senha
      if (response.user && response.user.requires_password_change) {
        toast.info('Você precisa alterar sua senha no primeiro acesso');
        navigate('/change-password');
        return;
      }
      
      toast.success('Login realizado com sucesso!');
      redirectBasedOnRole();
    } catch (error) {
      console.error('Erro no login:', error);
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)' }}>
      <Card className="w-full max-w-md glass-card" data-testid="login-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Ciatos Recrutamento</CardTitle>
          <CardDescription>Plataforma de Recrutamento & Seleção</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Removemos as abas e mantemos apenas o login */}
          <form onSubmit={handleLogin} className="space-y-4 mt-4" data-testid="login-form">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                data-testid="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full btn-primary" data-testid="login-submit-button" disabled={loading}>
              Entrar
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Ou continue com</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              data-testid="google-login-button"
              onClick={() => window.location.href = GOOGLE_AUTH_URL}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Login com Google
            </Button>
          </div>

          {/* Links Rápidos por Tipo de Usuário */}
          <div className="mt-8 border-t pt-6">
            <p className="text-sm text-gray-600 text-center mb-4">Acesso rápido por perfil:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <p className="font-semibold text-sm mb-1">Sou Candidato</p>
                <p className="text-xs text-gray-500 mb-2">Criar conta grátis</p>
                <Link to="/candidato/cadastro">
                  <Button variant="outline" size="sm" className="w-full">
                    Cadastrar
                  </Button>
                </Link>
              </div>
              
              <div className="text-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <p className="font-semibold text-sm mb-1">Sou Cliente</p>
                <p className="text-xs text-gray-500 mb-2">Preciso contratar</p>
                <p className="text-xs text-blue-600">Use suas credenciais</p>
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <Link to="/carreiras" className="text-sm text-blue-600 hover:underline">
                Ver vagas disponíveis →
              </Link>
            </div>
            
            <div className="mt-2 text-center text-xs text-gray-500">
              <p>Admin/Recruiter: Use o login padrão acima</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
