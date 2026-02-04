// WhatsApp Button Component - Professional floating button with official logo
import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const WhatsAppIcon = FaWhatsapp as unknown as React.FC<React.SVGProps<SVGSVGElement>>;

const WhatsAppButton: React.FC = () => {
  const handleWhatsAppClick = () => {
    window.open('https://chat.whatsapp.com/EidHbbXLJF6GvCiPwHRpe3?mode=gi_t', '_blank');
  };

  return (
    <button
      className="whatsapp-floating-btn"
      onClick={handleWhatsAppClick}
      aria-label="WhatsApp"
      title="WhatsApp"
    >
      <WhatsAppIcon aria-hidden="true" focusable="false" />
    </button>
  );
};

export default WhatsAppButton;
