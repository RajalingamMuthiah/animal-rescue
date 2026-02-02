// My Gallery Page - Personal uploads by logged-in user (Supabase-backed)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import '../styles/dashboard.css';

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string;
  created_at: string;
  uploader_id: string;
  visibility: 'private' | 'public';
  approved_by_admin: boolean;
  deleted_for_user: boolean;
}

const MyGallery: React.FC = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [myImages, setMyImages] = useState<GalleryImage[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // Get Supabase user ID (from auth session)
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  useEffect(() => {
    const getSupabaseUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user?.id) {
          setSupabaseUserId(data.user.id);
        }
      } catch (error) {
        console.error('Failed to get Supabase user:', error);
      }
    };
    getSupabaseUser();
  }, []);

  // Load user's images from Supabase DB
  useEffect(() => {
    const loadMyImages = async () => {
      if (!supabaseUserId) return;
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .eq('uploader_id', supabaseUserId)
          .eq('deleted_for_user', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMyImages(data || []);
      } catch (error) {
        console.error('Error loading my images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMyImages();
  }, [supabaseUserId]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !supabaseUserId) return;

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      // 1. Upload file to Supabase Storage
      const timestamp = Date.now();
      const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const storagePath = `gallery/${supabaseUserId}/${timestamp}-${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      // 3. Insert into images table
      const { error: insertError } = await supabase
        .from('images')
        .insert({
          uploader_id: supabaseUserId,
          image_url: publicUrl,
          caption: newCaption || null,
          visibility: 'private',
          approved_by_admin: false,
          deleted_for_user: false,
        });

      if (insertError) throw insertError;

      // 4. Refresh gallery from DB
      const { data, error: fetchError } = await supabase
        .from('images')
        .select('*')
        .eq('uploader_id', supabaseUserId)
        .eq('deleted_for_user', false)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMyImages(data || []);

      setNewCaption('');
      setShowUploadForm(false);
      alert('✅ Photo uploaded successfully! Thank you for your contribution.');
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Error uploading photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!window.confirm('Are you sure? This will remove from your gallery (image stays public).')) return;

    try {
      // Update: mark deleted_for_user = true (volunteer hide only)
      const { error } = await supabase
        .from('images')
        .update({ deleted_for_user: true })
        .eq('id', id)
        .eq('uploader_id', supabaseUserId);

      if (error) throw error;

      // Refresh gallery
      setMyImages(myImages.filter((img) => img.id !== id));
      setSelectedImage(null);
      alert('✅ Removed from your gallery.');
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Error removing image.');
    }
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>🖼️ My Gallery</h1>
          <p>Your rescue moments and contributions</p>
        </div>
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading your gallery...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🖼️ My Gallery</h1>
        <p>Your rescue moments and contributions</p>
      </div>

      {/* Upload Section */}
      {!showUploadForm ? (
        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <button
            onClick={() => setShowUploadForm(true)}
            className="btn btn-primary btn-large"
          >
            📷 Upload New Photo
          </button>
        </div>
      ) : (
        <div className="upload-section">
          <h2>📸 Upload Rescue Photo</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Share your rescue moment and help inspire others
          </p>

          <div className="file-input-wrapper">
            <label className="file-input-label">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isUploading}
              />
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
              <div style={{ fontSize: '18px', color: '#4caf50', fontWeight: 'bold' }}>
                {isUploading ? 'Uploading...' : 'Click to Upload Photo'}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                PNG, JPG up to 10MB
              </div>
            </label>
          </div>

          <label style={{ marginTop: '20px' }}>Photo Caption (Optional)</label>
          <textarea
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            placeholder="Add a caption to describe your rescue moment..."
            style={{ minHeight: '80px' }}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button
              onClick={() => setShowUploadForm(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      <div style={{ marginTop: '40px' }}>
        {myImages.length > 0 ? (
          <div>
            <h2 style={{ marginBottom: '20px' }}>
              Your Uploads ({myImages.length})
            </h2>
            <div className="gallery-grid">
              {myImages.map((image) => (
                <div
                  key={image.id}
                  className="gallery-card"
                  onClick={() => setSelectedImage(image)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="gallery-image-wrapper">
                    <img
                      src={image.image_url}
                      alt={image.caption || 'Rescue photo'}
                      className="gallery-image"
                    />
                  </div>
                  <div className="gallery-card-info">
                    <p>{image.caption || 'Untitled'}</p>
                    <small>{new Date(image.created_at).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '12px',
              border: '1px solid #eee',
            }}
          >
            <p style={{ fontSize: '24px', marginBottom: '10px' }}>🐾</p>
            <h3 style={{ color: '#666', marginBottom: '10px' }}>
              You haven't uploaded any rescue moments yet
            </h3>
            <p style={{ color: '#999', marginBottom: '20px' }}>
              Your first rescue story starts here. Share your volunteer moments and inspire others!
            </p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="btn btn-primary"
            >
              📷 Upload Your First Photo
            </button>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease',
          }}
          onClick={closeModal}
        >
          {/* Modal Container */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              animation: 'slideUp 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0, 0, 0, 0.6)',
                border: 'none',
                color: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
              }}
              title="Close (ESC)"
            >
              ✕
            </button>

            {/* Image */}
            <img
              src={selectedImage.image_url}
              alt={selectedImage.caption}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />

            {/* Image Info */}
            <div style={{ padding: '24px', backgroundColor: 'white' }}>
              {selectedImage.caption && (
                <p style={{ fontSize: '18px', color: '#333', marginBottom: '12px', fontWeight: 500 }}>
                  {selectedImage.caption}
                </p>
              )}
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '20px' }}>
                📅 {new Date(selectedImage.created_at).toLocaleString()}
              </p>

              {/* Delete Button */}
              <button
                onClick={() => {
                  handleDeleteImage(selectedImage.id);
                }}
                style={{
                  background: '#ffebee',
                  color: '#d32f2f',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#ffcdd2';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#ffebee';
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>

          {/* CSS Animations */}
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default MyGallery;
