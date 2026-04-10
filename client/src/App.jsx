// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login         from './pages/Login';
import StudentSearch from './pages/StudentSearch';
import StudentRecord from './pages/StudentRecord';
import Admin         from './pages/Admin';
import NavBar        from './components/NavBar';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">טוען...</div>;
  if (!user)   return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/" />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute><NavBar /><StudentSearch /></ProtectedRoute>
          } />
          <Route path="/students/:id" element={
            <ProtectedRoute><NavBar /><StudentRecord /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><NavBar /><Admin /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
