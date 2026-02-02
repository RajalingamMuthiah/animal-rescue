// Register Page - Simple registration form
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    rescueArea: '',
    experience: '',
    role: 'volunteer', // Default role
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle registration - Supabase Auth + DB
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 1. Create auth user in Supabase
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;

      if (!signUpData.user?.id) {
        throw new Error('User creation failed - no user ID returned');
      }

      const userId = signUpData.user.id;

      // 2. Insert volunteer profile into Supabase volunteers table
      const { error: insertError } = await supabase
        .from('volunteers')
        .insert({
          id: userId,
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          city: formData.city || null,
          rescue_area: formData.rescueArea || null,
          experience: formData.experience || null,
          role: 'volunteer',
        });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        // Don't throw - allow signup to proceed even if profile insert fails
      }

      alert(
        '✅ Registration successful! Please check your email to confirm your account, then login.'
      );
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(
        `❌ Registration failed: ${error.message || 'Please try again.'}`
      );
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '550px', margin: '50px auto' }}>
        <div className="card">
          <h1 style={{ textAlign: 'center', color: '#388e3c', marginBottom: '30px' }}>
            📝 Join Our Mission
          </h1>

          <form onSubmit={handleRegister}>
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
            />

            <label>City</label>
            <input
              type="text"
              name="city"
              placeholder="City you volunteer in"
              value={formData.city}
              onChange={handleChange}
            />

            <label>Rescue Area (if applicable)</label>
            <input
              type="text"
              name="rescueArea"
              placeholder="e.g., North Delhi, Bangalore outskirts"
              value={formData.rescueArea}
              onChange={handleChange}
            />

            <label>Volunteer Experience</label>
            <textarea
              name="experience"
              placeholder="Tell us about your rescue or volunteer experience..."
              value={formData.experience}
              onChange={handleChange}
              style={{ minHeight: '80px', fontFamily: 'inherit' }}
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />

            <button 
              type="submit" 
              className="btn btn-primary btn-large"
              style={{ width: '100%', marginTop: '20px' }}
            >
              Create Account
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
            Already have an account?{' '}
            <span 
              onClick={() => navigate('/login')}
              style={{ color: '#4caf50', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
