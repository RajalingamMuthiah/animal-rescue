// Main App Component with React Router
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import RescueForm from './pages/RescueForm';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GalleryPage from './pages/Gallery';
import UserProfile from './pages/UserProfile';
import MyGallery from './pages/MyGallery';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          
          {/* Define all routes */}
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/rescue" element={<RescueForm />} />
            <Route path="/volunteer" element={<VolunteerDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/my-gallery" element={<MyGallery />} />
          </Routes>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
