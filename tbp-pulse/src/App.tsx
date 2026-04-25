import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActivityProvider } from './context/ActivityContext';
import { AlertProvider } from './context/AlertContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Team from './pages/Team';
import NewUpdate from './pages/NewUpdate';
import Login from './pages/Login';
import Settings from './pages/Settings';
import ClientDetail from './pages/ClientDetail';
import TasksCalendar from './pages/TasksCalendar';
import Activities from './pages/Activities';
import Docs from './pages/Docs';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-tbp-orange/30 border-t-tbp-orange rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Dacă cumva ajunge aici fără user (deși ProtectedRoute ar trebui să prevină), facem fallback
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar user={user} />
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="px-8 py-8 lg:px-12 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ActivityProvider>
        <AlertProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/client/:id" element={<ProtectedRoute><Layout><ClientDetail /></Layout></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Layout><TasksCalendar /></Layout></ProtectedRoute>} />
              <Route path="/activities" element={<ProtectedRoute><Layout><Activities /></Layout></ProtectedRoute>} />
              <Route path="/docs" element={<ProtectedRoute><Layout><Docs /></Layout></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute><Layout><Alerts /></Layout></ProtectedRoute>} />
              <Route path="/team" element={<ProtectedRoute><Layout><Team /></Layout></ProtectedRoute>} />
              <Route path="/updates/new" element={<ProtectedRoute><Layout><NewUpdate /></Layout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </AlertProvider>
      </ActivityProvider>
    </AuthProvider>
  );
}




