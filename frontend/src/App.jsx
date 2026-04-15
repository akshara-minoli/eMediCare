import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import BookAppointment from './pages/BookAppointment';
import Telemedicine from './pages/Telemedicine';
import SymptomChecker from './pages/SymptomChecker';
import AdminPanel from './pages/AdminPanel';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { pathname } = useLocation();
  const showNavbar = pathname === '/';

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/forgot-password"   element={<ForgotPassword />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/reset-password"    element={<ResetPassword />} />
        <Route path="/dashboard"         element={<Dashboard />} />
        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute role="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/doctors"           element={<Doctors />} />
        <Route path="/appointments"      element={<Appointments />} />
        <Route path="/book-appointment/:doctorId" element={<BookAppointment />} />
        <Route path="/telemedicine"      element={<Telemedicine />} />
        <Route path="/symptom-checker"   element={<SymptomChecker />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route path="/about"             element={<About />} />
        <Route path="/contact"           element={<Contact />} />
        <Route path="*"                  element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
