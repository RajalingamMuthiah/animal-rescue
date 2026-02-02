// Volunteer Dashboard - View assigned rescues and accept/reject
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import '../styles/dashboard.css';

interface RescueRequest {
  id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  location_text: string;
  reporter_phone: string;
  description: string;
  status: string;
  assigned_at: string;
  created_at: string;
}

const haversineDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const VolunteerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const [assignedRescues, setAssignedRescues] = useState<RescueRequest[]>([]);
  const [volunteerData, setVolunteerData] = useState<any>(null);
  const [volunteerName, setVolunteerName] = useState(user?.name || 'Volunteer');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // Load volunteer data and assigned rescues
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        // Get volunteer ID
        const { data: authData } = await supabase.auth.getUser();
        const volunteerId = authData.user?.id;

        if (!volunteerId) {
          setIsLoading(false);
          return;
        }

        // Load volunteer profile
        const { data: volunteerProfile } = await supabase
          .from('volunteers')
          .select('*')
          .eq('id', volunteerId)
          .single();

        if (volunteerProfile) {
          setVolunteerData(volunteerProfile);
          setVolunteerName(volunteerProfile.full_name || user?.name || 'Volunteer');
        }

        // Load assigned rescues
        const { data: rescues, error } = await supabase
          .from('rescue_requests')
          .select('*')
          .eq('assigned_volunteer_id', volunteerId)
          .in('status', ['assigned', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (isMounted) {
          setAssignedRescues(rescues || []);
        }
      } catch (error) {
        console.error('Error loading volunteer data:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user, isLoggedIn]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAcceptRescue = async (rescueId: string) => {
    try {
      const { error } = await supabase
        .from('rescue_requests')
        .update({ status: 'accepted' })
        .eq('id', rescueId);

      if (error) throw error;

      // Update local state
      setAssignedRescues(
        assignedRescues.map((r) =>
          r.id === rescueId ? { ...r, status: 'accepted' } : r
        )
      );

      alert('✅ Rescue accepted! Please proceed to the location.');
    } catch (error) {
      console.error('Error accepting rescue:', error);
      alert('❌ Failed to accept rescue. Please try again.');
    }
  };

  const handleRejectRescue = async (rescueId: string) => {
    if (!window.confirm('Are you sure you want to reject this rescue? It will be reassigned to another volunteer.')) {
      return;
    }

    try {
      // Call reassign API
      const response = await fetch('/api/assignRescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rescueRequestId: rescueId,
          latitude: assignedRescues.find((r) => r.id === rescueId)?.latitude,
          longitude: assignedRescues.find((r) => r.id === rescueId)?.longitude,
        }),
      });

      if (!response.ok) throw new Error('Reassignment failed');

      // Remove from local state
      setAssignedRescues(assignedRescues.filter((r) => r.id !== rescueId));

      alert('✅ Rescue rejected and reassigned to another volunteer.');
    } catch (error) {
      console.error('Error rejecting rescue:', error);
      alert('❌ Failed to reject rescue. Please try again.');
    }
  };

  const calculateDistance = (rescue: RescueRequest) => {
    if (!volunteerData?.latitude || !volunteerData?.longitude) {
      return 'N/A';
    }
    const distKm = haversineDistanceKm(
      volunteerData.latitude,
      volunteerData.longitude,
      rescue.latitude,
      rescue.longitude
    );
    return `${Math.round(distKm * 10) / 10} km`;
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header dashboard-header-row">
        <div>
          <h1>👋 Welcome, {volunteerName}!</h1>
          <p>Thank you for being a voice for the voiceless.</p>
        </div>
        <div className="dashboard-actions">
          <div className="profile-menu" ref={dropdownRef}>
            <button
              className="profile-menu-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <span className="profile-avatar">{getInitials(volunteerName)}</span>
              <span className="profile-menu-label">Profile</span>
              <span className="profile-menu-caret">▾</span>
            </button>

            {showProfileMenu && (
              <div className="profile-menu-dropdown">
                <button
                  className="profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/profile');
                  }}
                >
                  👤 My Profile
                </button>
                <button
                  className="profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/my-gallery');
                  }}
                >
                  🖼️ My Gallery
                </button>
                <button className="profile-menu-item logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats">
        <div className="stat-box">
          <h2>{rescueCount}</h2>
          <p>Total Rescues</p>
        </div>

        <div className="stat-box">
          <h2>{animalsFed}</h2>
          <p>Animals Fed</p>
        </div>

        <div className="stat-box">
          <h2>{rewardPoints}</h2>
          <p>Reward Points</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <h2>📸 Upload Rescue Photos</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Document your rescue work and inspire others
        </p>
        
        <div className="file-input-wrapper">
          <label className="file-input-label">
            <input 
              type="file" 
              accept="image/*"
              onChange={handlePhotoUpload}
            />
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
            <div style={{ fontSize: '18px', color: '#4caf50', fontWeight: 'bold' }}>
              Click to Upload Photo
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              PNG, JPG up to 10MB
            </div>
          </label>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h2>📋 Recent Rescue Requests</h2>
        
        {recentActivities.length > 0 ? (
          <ul className="activity-list">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="activity-item">
                <div className="activity-icon">🐾</div>
                <div className="activity-details">
                  <strong>{activity.location}</strong>
                  <span>Contact: {activity.contact}</span>
                  <span style={{ display: 'block', marginTop: '5px' }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No rescue requests yet. Report your first rescue!
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          className="btn btn-primary btn-large"
          onClick={() => navigate('/rescue')}
        >
          🚨 Report New Rescue
        </button>
        <button 
          className="btn btn-secondary btn-large"
          onClick={() => navigate('/my-gallery')}
        >
          🖼️ View My Gallery
        </button>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
