// Login Page - Supabase authentication
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handle login - uses AuthContext for state management
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const loggedInUser = await login(email, password);

      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/volunteer');
      }
    } catch (error: any) {
      setError(error.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '500px', margin: '50px auto' }}>
        <div className="card">
          <h1 style={{ textAlign: 'center', color: '#388e3c', marginBottom: '30px' }}>
            🔐 Login
          </h1>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              whiteSpace: 'pre-wrap'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button 
              type="submit" 
              className="btn btn-primary btn-large"
              style={{ width: '100%', marginTop: '20px' }}
            >
              Login
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
            Don't have an account?{' '}
            <span 
              onClick={() => navigate('/register')}
              style={{ color: '#4caf50', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Sign Up
            </span>
          </p>

          <div style={{ 
            marginTop: '30px', 
            padding: '15px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <strong>Tip:</strong> Use the email and password you registered with.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
