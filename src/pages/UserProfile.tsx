// User Profile Page - Edit and view user information
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

const UserProfile: React.FC = () => {
  const { user, isLoggedIn, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    rescueArea: '',
    experience: '',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    } else if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        rescueArea: user.rescueArea || '',
        experience: user.experience || '',
      });
    }
  }, [user, isLoggedIn, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        rescueArea: formData.rescueArea,
        experience: formData.experience,
      });
      setIsEditing(false);
      alert('✅ Profile updated successfully!');
    } catch (error) {
      console.error('Profile update failed:', error);
      alert('❌ Failed to update profile. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>👤 My Profile</h1>
        <p>Your personal information and preferences</p>
      </div>

      <div style={{ maxWidth: '700px', margin: '30px auto' }}>
        <div className="card" style={{ padding: '30px' }}>
          {!isEditing ? (
            <div>
              {/* View Mode */}
              <div className="profile-section">
                <h2>Personal Information</h2>
                <div className="profile-row">
                  <label>Full Name</label>
                  <p>{formData.name}</p>
                </div>
                <div className="profile-row">
                  <label>Email Address</label>
                  <p>{formData.email}</p>
                </div>
                <div className="profile-row">
                  <label>Phone Number</label>
                  <p>{formData.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="profile-section">
                <h2>Rescue Information</h2>
                <div className="profile-row">
                  <label>City</label>
                  <p>{formData.city || 'Not provided'}</p>
                </div>
                <div className="profile-row">
                  <label>Preferred Rescue Area</label>
                  <p>{formData.rescueArea || 'Not provided'}</p>
                </div>
                <div className="profile-row">
                  <label>Experience (Optional)</label>
                  <p>{formData.experience || 'Not provided'}</p>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
              >
                ✏️ Edit Profile
              </button>
            </div>
          ) : (
            <div>
              {/* Edit Mode */}
              <h2 style={{ marginBottom: '20px' }}>Edit Your Profile</h2>

              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />

              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
              />
              <small style={{ color: '#999' }}>Email cannot be changed</small>

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
                placeholder="Enter your city"
                value={formData.city}
                onChange={handleChange}
              />

              <label>Preferred Rescue Area</label>
              <input
                type="text"
                name="rescueArea"
                placeholder="e.g., Downtown, Suburbs"
                value={formData.rescueArea}
                onChange={handleChange}
              />

              <label>Experience (Optional)</label>
              <textarea
                name="experience"
                placeholder="Tell us about your rescue experience..."
                value={formData.experience}
                onChange={handleChange}
                style={{ minHeight: '100px' }}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={handleSave} className="btn btn-primary">
                  💾 Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
