import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AccessDenied from './pages/AccessDenied';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherClasses from './pages/teacher/TeacherClasses';
import TeacherClassDetail from './pages/teacher/TeacherClassDetail';
import StudentClasses from './pages/student/StudentClasses';
import StudentNotifications from './pages/student/StudentNotifications';
import ParentDashboard from './pages/parent/ParentDashboard';

// Layouts
import TeacherLayout from './components/TeacherLayout';
import StudentLayout from './components/StudentLayout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Home — detects role and redirects */}
      <Route path="/" element={<Home />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminDashboard />} />

      {/* Teacher routes */}
      <Route element={<TeacherLayout />}>
        <Route path="/teacher/classes" element={<TeacherClasses />} />
        <Route path="/teacher/classes/:classId" element={<TeacherClassDetail />} />
      </Route>

      {/* Student routes */}
      <Route element={<StudentLayout />}>
        <Route path="/student/classes" element={<StudentClasses />} />
        <Route path="/student/notifications" element={<StudentNotifications />} />
      </Route>

      {/* Parent */}
      <Route path="/parent" element={<ParentDashboard />} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App