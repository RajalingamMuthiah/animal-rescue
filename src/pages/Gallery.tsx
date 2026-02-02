// Gallery Page - Showcase of rescued animals (Supabase-backed)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string;
  created_at: string;
  visibility: 'private' | 'public';
  approved_by_admin: boolean;
}

const GalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load only public, admin-approved images from Supabase
  useEffect(() => {
    const loadPublicImages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .eq('visibility', 'public')
          .eq('approved_by_admin', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAllImages(data || []);
      } catch (error) {
        console.error('Error loading gallery images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPublicImages();
  }, []);

  return (
    <div className="page">
      <div className="container" style={{ textAlign: 'center', paddingTop: '40px' }}>
        <h1 style={{ color: '#2e7d32', marginBottom: '10px' }}>🐾 Rescued Lives Gallery</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          Every image tells a rescue story • Transparency builds trust
        </p>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading gallery...
          </div>
        ) : allImages.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '40px',
            }}
          >
            {allImages.map((image) => (
              <div
                key={image.id}
                className="gallery-card"
                onClick={() => setSelectedImage(image)}
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  border: '1px solid #e0e0e0',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img
                  src={image.image_url}
                  alt={image.caption || 'Rescue moment'}
                  style={{
                    width: '100%',
                    height: '300px',
                    objectFit: 'cover',
                  }}
                />
                <div className="gallery-card-info">
                  <p><strong>{image.caption || 'Rescue Moment'}</strong></p>
                  <small>{new Date(image.created_at).toLocaleDateString()}</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '60px 20px', backgroundColor: '#f9f9f9', borderRadius: '12px', marginBottom: '40px' }}>
            <p style={{ fontSize: '24px', marginBottom: '10px' }}>📷</p>
            <h3 style={{ color: '#666', marginBottom: '10px' }}>No rescue moments shared yet</h3>
            <p style={{ color: '#999' }}>Gallery will fill with rescue stories as volunteers upload photos</p>
          </div>
        )}

        <button
          className="btn btn-primary btn-large"
          onClick={() => navigate('/')}
          style={{ marginBottom: '30px' }}
        >
          ← Back to Home
        </button>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="image-modal"
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '24px',
                cursor: 'pointer',
                zIndex: 10000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              ✕
            </button>
            <img
              src={selectedImage.image_url}
              alt={selectedImage.caption}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
            <div style={{ padding: '20px', backgroundColor: 'white' }}>
              <p><strong>{selectedImage.caption || 'Rescue Moment'}</strong></p>
              <small style={{ color: '#666' }}>
                Uploaded on {new Date(selectedImage.created_at).toLocaleDateString()}
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
