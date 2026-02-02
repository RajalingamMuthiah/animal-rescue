// Footer Component - Modern NGO-style footer with dark green background
import React from 'react';
import '../styles/footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-content">
          <div className="footer-column">
            <h4>🐾 Animal Rescue</h4>
            <p>Saving lives, one paw at a time. A community-driven animal rescue platform.</p>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/rescue">Report Rescue</a></li>
              <li><a href="/register">Join Volunteer</a></li>
              <li><a href="/login">Dashboard</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Emergency</h4>
            <p><strong>Hotline:</strong> <a href="tel:+91 9833460712">+91 98334 60712</a></p>
            <p><strong>Hours:</strong> 24/7 Available</p>
            <p><strong>Response Time:</strong> &lt; 2 hours</p>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>
            <p>Email: arjunmudaliyar99@gmail.com</p>
            <p>WhatsApp: Click the button below →</p>
            <p>Location: Multiple rescue centers</p>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>&copy; 2026 Animal Rescue. All rights reserved. Every life matters. 💚</p>
          <p></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
