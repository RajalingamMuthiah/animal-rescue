// Admin Dashboard - View all rescue requests and volunteer stats
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import '../styles/dashboard.css';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [rescueRequests, setRescueRequests] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'public' | 'volunteer'>('public');
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load rescue requests from Supabase
  useEffect(() => {
    const loadRescueRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('rescue_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRescueRequests(data || []);
      } catch (error) {
        console.error('Error loading rescue requests:', error);
      }
    };

    loadRescueRequests();
  }, []);

  // Load donations from Supabase
  useEffect(() => {
    const loadDonations = async () => {
      try {
        const { data, error } = await supabase
          .from('donations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDonations(data || []);
      } catch (error) {
        console.error('Error loading donations:', error);
      }
    };

    loadDonations();
  }, []);

  // Load volunteers from Supabase
  useEffect(() => {
    const loadVolunteers = async () => {
      try {
        const { data } = await supabase
          .from('volunteers')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setVolunteers(data);
        }
      } catch (error) {
        console.error('Error loading volunteers from Supabase:', error);
      }
    };

    loadVolunteers();
  }, []);

  // Load gallery images from Supabase
  useEffect(() => {
    const loadGalleryImages = async () => {
      setIsLoadingGallery(true);
      try {
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setGalleryImages(data || []);
      } catch (error) {
        console.error('Error loading gallery images:', error);
      } finally {
        setIsLoadingGallery(false);
      }
    };

    loadGalleryImages();
  }, []);

  // Calculate volunteer stats
  const getVolunteerStats = (volunteer: { id?: string; email?: string; user_email?: string }) => {
    const volunteerRescues = volunteer.id
      ? rescueRequests.filter(r => r.assigned_volunteer_id === volunteer.id)
      : [];

    const imagesUploaded = volunteer.id
      ? galleryImages.filter(img => img.uploader_id === volunteer.id).length
      : 0;

    const lastActiveDate = volunteerRescues
      .map((r) => r.created_at)
      .filter(Boolean)
      .sort()
      .pop();

    return {
      totalRescues: volunteerRescues.length,
      imagesUploaded,
      lastActive: lastActiveDate ? new Date(lastActiveDate).toLocaleDateString() : 'Never'
    };
  };

  // Separate public vs volunteer rescue requests
  const publicRescues = rescueRequests.filter(r => !r.submitted_by);
  const volunteerRescues = rescueRequests.filter(r => r.submitted_by);

  const handleToggleApproval = async (id: string, currentApproved: boolean) => {
    try {
      const { error } = await supabase
        .from('images')
        .update({ approved_by_admin: !currentApproved })
        .eq('id', id);

      if (error) throw error;

      // Refresh gallery
      const updatedImages = galleryImages.map((img) =>
        img.id === id ? { ...img, approved_by_admin: !currentApproved } : img
      );
      setGalleryImages(updatedImages);
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('❌ Error updating image approval.');
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
    try {
      const { error } = await supabase
        .from('images')
        .update({ visibility: newVisibility })
        .eq('id', id);

      if (error) throw error;

      const updatedImages = galleryImages.map((img) =>
        img.id === id ? { ...img, visibility: newVisibility } : img
      );
      setGalleryImages(updatedImages);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('❌ Error updating visibility.');
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!window.confirm('Delete this image permanently? This will remove from storage and database.')) return;

    try {
      // 1. Get image URL to find storage path
      const image = galleryImages.find((img) => img.id === id);
      if (image?.image_url) {
        // Extract path from public URL: https://...supabase.co/storage/v1/object/public/gallery/...
        const pathMatch = image.image_url.match(/\/gallery\/.+/);
        if (pathMatch) {
          const storagePath = pathMatch[0].substring(1); // Remove leading /

          // 2. Delete from storage
          await supabase.storage.from('gallery').remove([storagePath]);
        }
      }

      // 3. Delete from database
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGalleryImages(galleryImages.filter((img) => img.id !== id));
      alert('✅ Image deleted successfully.');
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Error deleting image.');
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard">
      {/* Proper Header with No Overlapping */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>👨‍💼 Admin Dashboard</h1>
          <p>Manage rescue operations and monitor volunteer activity</p>
        </div>
        <div className="admin-header-right">
          <span className="user-info">Admin: {user.name}</span>
          <button onClick={() => { logout(); navigate('/'); }} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats">
        <div className="stat-box">
          <h2>{rescueRequests.length}</h2>
          <p>Total Rescue Requests</p>
        </div>

        <div className="stat-box">
          <h2>{volunteers.length}</h2>
          <p>Active Volunteers</p>
        </div>

        <div className="stat-box">
          <h2>{galleryImages.length}</h2>
          <p>Gallery Images</p>
        </div>

        <div className="stat-box">
          <h2>₹{donations.reduce((sum, d) => sum + (d.amount || 0), 0)}</h2>
          <p>Total Donations</p>
        </div>
      </div>

      {/* Volunteer Management Table */}
      <div className="admin-table-section">
        <h2>👥 Volunteer Management</h2>
        
        {volunteers.length > 0 ? (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>City</th>
                  <th>Rescue Area</th>
                  <th>Experience</th>
                  <th>Joined</th>
                  <th>Rescues</th>
                  <th>Images</th>
                  <th>Last Active</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((volunteer) => {
                  const stats = getVolunteerStats(volunteer);
                  return (
                    <tr key={volunteer.email || volunteer.id}>
                      <td><strong>{volunteer.full_name || volunteer.name || 'Volunteer'}</strong></td>
                      <td>{volunteer.email || 'N/A'}</td>
                      <td>{volunteer.phone || 'N/A'}</td>
                      <td>{volunteer.role || 'volunteer'}</td>
                      <td>{volunteer.city || 'N/A'}</td>
                      <td>{volunteer.rescueArea || volunteer.rescue_area || 'N/A'}</td>
                      <td>{volunteer.experience || 'N/A'}</td>
                      <td>{volunteer.created_at ? new Date(volunteer.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</td>
                      <td><span className="badge badge-green">{stats.totalRescues}</span></td>
                      <td><span className="badge badge-blue">{stats.imagesUploaded}</span></td>
                      <td>{stats.lastActive}</td>
                      <td><span className="status-active">Active</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No volunteers registered yet.</p>
        )}
      </div>

      {/* Rescue Requests - Tabbed View (Public vs Volunteer) */}
      <div className="admin-table-section">
        <h2>🚨 Rescue Requests</h2>
        
        <div className="tab-buttons">
          <button 
            className={activeTab === 'public' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('public')}
          >
            🌍 Public Requests ({publicRescues.length})
          </button>
          <button 
            className={activeTab === 'volunteer' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('volunteer')}
          >
            🦺 Volunteer Reports ({volunteerRescues.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'public' ? (
            publicRescues.length > 0 ? (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Location</th>
                      <th>Contact</th>
                      <th>Description</th>
                      <th>Image</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicRescues.map((request) => (
                      <tr key={request.id}>
                        <td>#{request.id.toString().slice(-6)}</td>
                        <td>{request.location_text || 'Location unavailable'}</td>
                        <td>{request.reporter_phone || 'N/A'}</td>
                        <td>{request.description || 'Emergency rescue'}</td>
                        <td>
                          {request.image_url ? (
                            <img src={request.image_url} alt="Rescue" className="table-thumbnail" />
                          ) : 'No image'}
                        </td>
                        <td><span className="status-pending">{request.status}</span></td>
                        <td>{new Date(request.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No public rescue requests yet.</p>
            )
          ) : (
            volunteerRescues.length > 0 ? (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Volunteer</th>
                      <th>Location</th>
                      <th>Contact</th>
                      <th>Description</th>
                      <th>Image</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteerRescues.map((request) => (
                      <tr key={request.id}>
                        <td>#{request.id.toString().slice(-6)}</td>
                        <td><strong>{request.submitted_by}</strong></td>
                        <td>{request.location_text || 'Location unavailable'}</td>
                        <td>{request.reporter_phone || 'N/A'}</td>
                        <td>{request.description || 'Volunteer report'}</td>
                        <td>
                          {request.image_url ? (
                            <img src={request.image_url} alt="Rescue" className="table-thumbnail" />
                          ) : 'No image'}
                        </td>
                        <td><span className="status-pending">{request.status}</span></td>
                        <td>{new Date(request.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No volunteer rescue reports yet.</p>
            )
          )}
        </div>
      </div>

      {/* Public Gallery Moderation */}
      <div className="admin-table-section">
        <h2>🖼️ Gallery Moderation (Supabase-backed)</h2>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          ✅ = approved & public | 🔒 = private | All images are stored securely in Supabase Storage
        </p>

        {isLoadingGallery ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Loading images...</p>
        ) : galleryImages.length > 0 ? (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Caption</th>
                  <th>Visibility</th>
                  <th>Admin Approved</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {galleryImages.map((image) => (
                  <tr key={image.id}>
                    <td>
                      {image.image_url ? (
                        <img src={image.image_url} alt="Gallery" className="table-thumbnail" />
                      ) : (
                        'No image'
                      )}
                    </td>
                    <td>{image.caption || '(no caption)'}</td>
                    <td>
                      <span className={`badge ${image.visibility === 'public' ? 'badge-green' : 'badge-blue'}`}>
                        {image.visibility === 'public' ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${image.approved_by_admin ? 'badge-green' : 'badge-blue'}`}>
                        {image.approved_by_admin ? '✅ Yes' : '⏳ Pending'}
                      </span>
                    </td>
                    <td>{new Date(image.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-action-buttons">
                        {!image.approved_by_admin && (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleToggleApproval(image.id, image.approved_by_admin)}
                          >
                            ✅ Approve
                          </button>
                        )}
                        {image.approved_by_admin && (
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleToggleApproval(image.id, image.approved_by_admin)}
                          >
                            ⏳ Reject
                          </button>
                        )}
                        <button
                          className="btn btn-secondary"
                          onClick={() =>
                            handleToggleVisibility(image.id, image.visibility)
                          }
                        >
                          {image.visibility === 'public' ? '🔒 Hide' : '🌍 Show'}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No gallery uploads yet.</p>
        )}
      </div>

      {/* Donation Tracking */}
      <div className="admin-table-section">
        <h2>💝 Donation Tracking</h2>
        
        {donations.length > 0 ? (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Donor Name</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Message</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation.id}>
                    <td><strong>{donation.donor_name || 'Anonymous'}</strong></td>
                    <td>{donation.donor_email || 'N/A'}</td>
                    <td className="amount">₹{donation.amount}</td>
                    <td>{donation.message || 'Anonymous donation'}</td>
                    <td>{donation.created_at ? new Date(donation.created_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No donations received yet. Share the platform to build trust!</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
