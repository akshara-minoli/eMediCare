import { Navigate } from 'react-router-dom';

function getStoredUser() {
  try {
    const raw = localStorage.getItem('emedicare_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('emedicare_token');
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
    return <Navigate to="/patient-dashboard" replace />;
  }

  return children;
}
