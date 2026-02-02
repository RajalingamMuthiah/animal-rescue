// Donation Section Component - NGO trust-building
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const DonationSection: React.FC = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    amount: '',
    message: '',
  });

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('donations')
        .insert({
          donor_name: formData.name,
          donor_email: formData.email,
          amount: parseFloat(formData.amount),
          message: formData.message || null,
          status: 'pending',
        });

      if (error) throw error;

      alert('🙏 Thank you for your generous donation! Your support saves lives.');
      setShowForm(false);
      setFormData({ name: '', email: '', amount: '', message: '' });
    } catch (error) {
      console.error('Donation error:', error);
      alert('❌ Unable to record your donation. Please try again.');
    }
  };

  return (
    <section className="donation-section">
      <div className="section-container">
        <h2 className="section-title">💝 Support Our Mission</h2>
        <p className="donation-message">
          Every rupee helps us rescue, rehabilitate, and rehome animals in need. 
          Your donation directly funds emergency medical care, shelter, and food.
        </p>

        {!showForm ? (
          <div className="donation-cta">
            <button 
              className="btn-donate"
              onClick={() => setShowForm(true)}
            >
              Donate Now
            </button>
            <p className="trust-badge">
              ✅ 100% Transparent • Tax Deductible • NGO Registered
            </p>
          </div>
        ) : (
          <div className="donation-form-wrapper">
            <form onSubmit={handleDonate} className="donation-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Donation Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="500"
                  min="50"
                  required
                />
              </div>

              <div className="form-group">
                <label>Message (Optional)</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Share why you're supporting us..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-donate">
                  Complete Donation
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>

              <p className="payment-note">
                💳 Payment gateway integration (Razorpay/Stripe) - Coming Soon<br />
                Currently tracking donation pledges for admin transparency
              </p>
            </form>
          </div>
        )}

        <div className="donation-stats">
          <div className="stat-item">
            <h3>🐕 250+</h3>
            <p>Animals Rescued</p>
          </div>
          <div className="stat-item">
            <h3>🏥 150+</h3>
            <p>Medical Treatments</p>
          </div>
          <div className="stat-item">
            <h3>🏡 200+</h3>
            <p>Successful Rehomings</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DonationSection;
