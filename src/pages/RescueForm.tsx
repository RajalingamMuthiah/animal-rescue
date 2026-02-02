// Rescue Form Page - Report an animal in need
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const RescueForm: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    image: null as File | null,
    locationText: 'Detecting location...',
    latitude: null as number | null,
    longitude: null as number | null,
    contact: '',
    description: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setFormData((prev) => ({
        ...prev,
        locationText: 'Location unavailable (GPS not supported)',
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
          locationText: `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }));
      },
      () => {
        setFormData((prev) => ({
          ...prev,
          locationText: 'Location unavailable (GPS permission denied)',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image || !formData.latitude || !formData.longitude) {
      alert('⚠️ Please allow GPS access and upload an image before submitting.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Submitting rescue request...');

    try {
      // 1) Upload image to Supabase Storage
      const timestamp = Date.now();
      const filename = formData.image.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const storagePath = `rescue-requests/${timestamp}-${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('rescue-requests')
        .upload(storagePath, formData.image);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('rescue-requests')
        .getPublicUrl(storagePath);

      const imageUrl = urlData.publicUrl;

      // 2) Save rescue request in Supabase DB
      const { data: insertData, error: insertError } = await supabase
        .from('rescue_requests')
        .insert({
          image_url: imageUrl,
          latitude: formData.latitude,
          longitude: formData.longitude,
          location_text: formData.locationText,
          reporter_phone: formData.contact,
          description: formData.description || null,
          status: 'pending',
          submitted_by: isLoggedIn && user ? user.email : null,
          submitter_name: isLoggedIn && user ? user.name : 'Public User',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // 3) Notify nearest volunteer via Vercel function
      setStatusMessage('Notifying nearest volunteer...');

      const notifyResponse = await fetch('/api/notifyVolunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rescueRequestId: insertData?.id,
          latitude: formData.latitude,
          longitude: formData.longitude,
          reporterPhone: formData.contact,
        }),
      });

      if (!notifyResponse.ok) {
        throw new Error('Volunteer notification failed');
      }

      setStatusMessage('Volunteers notified successfully');
      alert('✅ Volunteers notified successfully');

      // Redirect based on user type
      if (isLoggedIn && user?.role === 'volunteer') {
        navigate('/volunteer');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Rescue request error:', error);
      alert('❌ Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '700px', margin: '50px auto' }}>
        <div className="card">
          <h1 style={{ textAlign: 'center', color: '#388e3c', marginBottom: '10px' }}>
            🚨 Report Animal Rescue
          </h1>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
            Every second counts. Fill out this quick form to save a life.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Image Upload */}
            <label>📷 Upload Photo of Animal *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
              style={{ padding: '10px' }}
            />
            
            {imagePreview && (
              <div style={{ margin: '15px 0', textAlign: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px', 
                    borderRadius: '8px',
                    border: '2px solid #4caf50'
                  }} 
                />
              </div>
            )}

            {/* Auto-filled Location */}
            <label>📍 Location (Auto-detected)</label>
            <input
              type="text"
              value={formData.locationText}
              readOnly
              style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
            />
            <small style={{ color: '#666', fontSize: '14px' }}>
              Location is automatically detected using GPS
            </small>

            {/* Contact Number */}
            <label>📞 Your Contact Number *</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              required
            />

            {/* Description */}
            <label>📝 Brief Description (Optional)</label>
            <textarea
              placeholder="Describe the situation (e.g., injured dog, stray cat, etc.)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary btn-large"
              style={{ width: '100%', marginTop: '20px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : '🆘 Submit Rescue Request'}
            </button>
          </form>

          {statusMessage && (
            <div
              style={{
                marginTop: '20px',
                padding: '12px 16px',
                backgroundColor: '#e8f5e9',
                border: '1px solid #c8e6c9',
                borderRadius: '8px',
                color: '#2e7d32',
                textAlign: 'center',
              }}
            >
              {statusMessage}
            </div>
          )}

          <div style={{ 
            marginTop: '30px', 
            padding: '15px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '8px',
            border: '1px solid #ffc107'
          }}>
            <strong>⚡ Emergency?</strong> Call our hotline: <strong>+1 (234) 567-890</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescueForm;
