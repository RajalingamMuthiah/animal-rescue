// WhatsApp Button Component - Floating button to open WhatsApp group
import React from 'react';

const WhatsAppButton: React.FC = () => {
  // Handle WhatsApp click - opens WhatsApp group link
  const handleWhatsAppClick = () => {
    // Replace with actual WhatsApp group link
    window.open('https://chat.whatsapp.com/EidHbbXLJF6GvCiPwHRpe3?mode=gi_t', '_blank');
  };

  return (
    <button
      className="floating-btn"
      onClick={handleWhatsAppClick}
      style={{
        bottom: '20px',
        left: '20px',
        backgroundColor: '#25D366',
        color: 'white',
      }}
      title="Contact us on WhatsApp"
    >
      💬
    </button>
  );
};

export default WhatsAppButton;
