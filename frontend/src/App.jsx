import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import BookAppointment from './pages/BookAppointment';
import Telemedicine from './pages/Telemedicine';
import SymptomChecker from './pages/SymptomChecker';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"                  element={<Home />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/dashboard"         element={<Dashboard />} />
        <Route path="/doctors"           element={<Doctors />} />
        <Route path="/appointments"      element={<Appointments />} />
        <Route path="/appointments/book" element={<BookAppointment />} />
        <Route path="/telemedicine"      element={<Telemedicine />} />
        <Route path="/symptom-checker"   element={<SymptomChecker />} />
        <Route path="/admin"             element={<AdminPanel />} />
        <Route path="*"                  element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;