import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import CandidateDashboardPage from './pages/CandidateDashboardPage';
import JobsPage from './pages/JobsPage';
import CreateJobPage from './pages/CreateJobPage';
import JobDashboardPage from './pages/JobDashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import CandidatesPage from './pages/CandidatesPage';
import CareerSitePage from './pages/CareerSitePage';
import CandidateProfilePage from './pages/CandidateProfilePage';
import CandidateSignupPage from './pages/CandidateSignupPage';
import CandidateQuestionnairesPage from './pages/CandidateQuestionnairesPage';
import JobDetailsPage from './pages/JobDetailsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import AdminOrganizationsPage from './pages/AdminOrganizationsPage';
import JobCandidatesPage from './pages/JobCandidatesPage';
import AnalystJobDetailPage from './pages/AnalystJobDetailPage';
import RecruiterDashboardPage from './pages/RecruiterDashboardPage';
import JobPipelinePage from './pages/JobPipelinePage';
import ApplicationHistoryPage from './pages/ApplicationHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import NotificationPreferencesPage from './pages/NotificationPreferencesPage';
import InterviewsCalendarPage from './pages/InterviewsCalendarPage';
import JobEditPage from './pages/JobEditPage';
import JobsKanbanPage from './pages/JobsKanbanPage';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/carreiras" element={<CareerSitePage />} />
      <Route path="/candidato/cadastro" element={<CandidateSignupPage />} />
      <Route path="/candidato/questionarios" element={<CandidateQuestionnairesPage />} />
      <Route 
        path="/change-password" 
        element={
          <PrivateRoute>
            <ChangePasswordPage />
          </PrivateRoute>
        } 
      />
      
      {/* Rotas do Analista/Recrutador */}
      <Route
        path="/recruiter/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/recruiter"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/analista/vagas-kanban"
        element={
          <PrivateRoute>
            <JobsKanbanPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/jobs/:jobId/pipeline"
        element={
          <PrivateRoute>
            <JobPipelinePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/applications/:applicationId/history"
        element={
          <PrivateRoute>
            <ApplicationHistoryPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <PrivateRoute>
            <NotificationsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/notification-preferences"
        element={
          <PrivateRoute>
            <NotificationPreferencesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/interviews-calendar"
        element={
          <PrivateRoute>
            <InterviewsCalendarPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/jobs/:jobId/edit"
        element={
          <PrivateRoute>
            <JobEditPage />
          </PrivateRoute>
        }
      />
      
      {/* Rotas do Candidato */}
      <Route
        path="/candidato/perfil"
        element={
          <PrivateRoute>
            <CandidateProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/candidato/dashboard"
        element={
          <PrivateRoute>
            <CandidateDashboardPage />
          </PrivateRoute>
        }
      />
      
      {/* Rotas do Cliente */}
      <Route
        path="/cliente/dashboard"
        element={
          <PrivateRoute>
            <ClientDashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/job/:jobId/candidates"
        element={
          <PrivateRoute>
            <JobCandidatesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/cliente/vagas"
        element={
          <PrivateRoute>
            <JobsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/cliente/shortlist"
        element={
          <PrivateRoute>
            <ApplicationsPage />
          </PrivateRoute>
        }
      />
      
      {/* Rotas Admin/Recruiter */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/jobs"
        element={
          <PrivateRoute>
            <JobsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/jobs/:jobId/manage"
        element={
          <PrivateRoute>
            <AnalystJobDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/jobs/new"
        element={
          <PrivateRoute>
            <CreateJobPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/jobs/:jobId/dashboard"
        element={
          <PrivateRoute>
            <JobDashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <PrivateRoute>
            <ApplicationsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/candidates"
        element={
          <PrivateRoute>
            <CandidatesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <PrivateRoute>
            <AdminUserManagementPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/organizacoes"
        element={
          <PrivateRoute>
            <AdminOrganizationsPage />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
