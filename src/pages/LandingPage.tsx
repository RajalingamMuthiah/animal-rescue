// Landing Page - Modern, full-width animal rescue NGO platform (Supabase-backed)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import WhatsAppButton from '../components/WhatsAppButton';
import ChatBotButton from '../components/ChatBotButton';
import DonationSection from '../components/DonationSection';
import '../styles/landing.css';

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string;
  created_at: string;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  // Load real gallery images from Supabase (public + admin-approved only)
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        const { data, error } = await supabase
          .from('images')
          .select('id, image_url, caption, created_at')
          .eq('visibility', 'public')
          .eq('approved_by_admin', true)
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;
        setGalleryImages(data || []);
      } catch (error) {
        console.error('Error loading landing gallery:', error);
      }
    };

    loadGalleryImages();
  }, []);

  return (
    <div className="landing-page">
      {/* HERO SECTION - Two-column layout with documentary-style image */}
      <section className="hero-section">
        {/* Hero content container - creates alignment baseline for all sections */}
        <div className="hero-container">
          <div className="hero-grid">
            <div className="hero-content">
              <h1 className="hero-title">They Don't Have A Voice.<br />You Can Be Theirs.</h1>
              <p className="hero-subtitle">Every animal deserves a second chance. Report, rescue, and save lives with our trusted NGO community.</p>

              <div className="hero-buttons">
                {/* Primary CTA - Report Animal */}
                <button 
                  className="btn-hero-primary"
                  onClick={() => navigate('/rescue')}
                >
                  🚨 Report Animal Now
                </button>
                
                {/* Secondary CTA - Join as Volunteer */}
                <button 
                  className="btn-hero-secondary"
                  onClick={() => navigate('/register')}
                >
                  🤝 Join as Volunteer
                </button>
              </div>

              <p className="hero-trust">Verified rescue teams and partner vets • NGO-led operations • Rapid emergency response</p>
            </div>

            <div className="hero-image-col">
              <img
                src="/Arjun-dog.png"
                alt="Volunteer caring for a rescued dog"
                className="hero-image"
              />
              <p className="hero-image-caption">Volunteer during post-rescue care</p>
            </div>
          </div>
        </div>
      </section>

      {/* ACTION CARDS SECTION - What we offer */}
      <section className="action-cards-section">
        <div className="section-container">
          <h2 className="section-title">How You Can Help</h2>
          <p className="section-subtitle">Multiple ways to make a difference</p>

          <div className="cards-grid">
            {/* Card 1 - Report */}
            <div className="action-card">
              <div className="card-icon">📸</div>
              <h3>Report Injured Animal</h3>
              <p>See an animal in trouble? Upload a photo and location. Our team responds immediately.</p>
              <button 
                className="btn-card"
                onClick={() => navigate('/rescue')}
              >
                Report Now
              </button>
            </div>

            {/* Card 2 - Volunteer */}
            <div className="action-card">
              <div className="card-icon">🤝</div>
              <h3>Join Our Network</h3>
              <p>Become a volunteer and actively rescue animals in your community with our team.</p>
              <button 
                className="btn-card"
                onClick={() => navigate('/register')}
              >
                Volunteer
              </button>
            </div>

            {/* Card 3 - Support */}
            <div className="action-card">
              <div className="card-icon">💚</div>
              <h3>Emergency Support</h3>
              <p>Quick access to hotlines, guides, and professional rescue coordinators 24/7.</p>
              <button 
                className="btn-card"
                onClick={() => alert('📞 Hotline: +91 98334 60712\n💬 WhatsApp: Click button below')}
              >
                Get Help
              </button>
            </div>

            {/* Card 4 - Response */}
            <div className="action-card">
              <div className="card-icon">⚡</div>
              <h3>Fast Response</h3>
              <p>Average rescue response time under 2 hours. We prioritize emergency cases.</p>
              <button 
                className="btn-card"
                onClick={() => navigate('/login')}
              >
                Track Rescue
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY SECTION - Rescued animals showcase */}
      <section className="gallery-section">
        <div className="section-container">
          <h2 className="section-title">Rescued Lives Gallery</h2>
          <p className="section-subtitle">Every image tells a rescue story. Every life matters.</p>

          {galleryImages.length > 0 ? (
            <div className="gallery-grid">
              {galleryImages.map((image) => (
                <div 
                  key={image.id}
                  className="gallery-card"
                  onClick={() => navigate('/gallery')}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && navigate('/gallery')}
                >
                  <div className="gallery-image-wrapper">
                    <img 
                      src={image.image_url} 
                      alt={image.caption || 'Rescue moment'}
                      className="gallery-image"
                    />
                    <div className="gallery-overlay">
                      <span className="overlay-text">View Gallery</span>
                    </div>
                  </div>
                  <div className="gallery-card-info">
                    <p>{image.caption || 'Rescue Success'}</p>
                    <small>{new Date(image.created_at).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
              <p style={{ fontSize: '18px', color: '#666' }}>📷 Gallery will fill with rescue stories as volunteers share their moments</p>
            </div>
          )}

          <div className="gallery-cta">
            <button 
              className="btn-see-all"
              onClick={() => navigate('/gallery')}
            >
              See All Rescued Stories →
            </button>
          </div>
        </div>
      </section>

      {/* DONATION SECTION - NGO Transparency */}
      <DonationSection />

      {/* CTA SECTION - Emotional call to action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Become The Reason An Animal Survives Today</h2>
          <p>Join thousands of volunteers making real difference. No experience necessary.</p>
          
          <div className="cta-buttons">
            <button 
              className="btn-join-volunteer"
              onClick={() => navigate('/register')}
            >
              💪 Join as Volunteer
            </button>
            <button 
              className="btn-report"
              onClick={() => navigate('/rescue')}
            >
              🚨 Report Rescue
            </button>
          </div>

          <p className="cta-stats">
            <strong>500+</strong> animals rescued | <strong>200+</strong> active volunteers | <strong>95%</strong> recovery rate
          </p>
        </div>
      </section>

      {/* FLOATING HELPER BUTTONS */}
      <WhatsAppButton />
      <ChatBotButton />
    </div>
  );
};

export default LandingPage;
