// ChatBot Button Component - Functional Rescue Chatbot with Location
import React, { useState, useEffect, useRef } from 'react';

type Message = {
  sender: 'bot' | 'user';
  text: string;
  showLocationButton?: boolean;
};

const ChatBotButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text:
        '🐾 Hi! I am the Rescue Assistant.\n\n' +
        'You can type:\n' +
        '• rescue\n' +
        '• injured animal\n' +
        '• how to help\n' +
        '• contact\n\n' +
        'I’m here to help animals in need ❤️',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Bot logic
  const getBotResponse = (text: string): Message => {
    const msg = text.toLowerCase();

    if (msg.includes('rescue') || msg.includes('injured')) {
      return {
        sender: 'bot',
        text:
          '🚑 Found an injured animal?\n\n' +
          '1️⃣ Upload a photo\n' +
          '2️⃣ Share your live location\n' +
          '3️⃣ Our volunteers will reach you fast\n\n' +
          '📍 Please share your location now.',
        showLocationButton: true,
      };
    }

    if (msg.includes('help')) {
      return {
        sender: 'bot',
        text:
          '🤝 You can help by:\n\n' +
          '• Reporting injured animals\n' +
          '• Volunteering\n' +
          '• Donating for rescue & treatment\n\n' +
          'Every small help saves a life 🐕',
      };
    }

    if (msg.includes('contact')) {
      return {
        sender: 'bot',
        text:
          '📞 Emergency Contact\n\n' +
          'Phone: +91-XXXXXXXXXX\n' +
          'Email: rescue@ngo.org\n\n' +
          'For urgent cases, please call immediately.',
      };
    }

    return {
      sender: 'bot',
      text:
        '🤖 I didn’t fully understand that.\n\n' +
        'Try typing:\n' +
        '• rescue\n' +
        '• injured animal\n' +
        '• help',
    };
  };

  // Send message
  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    const botReply = getBotResponse(input);

    setMessages((prev) => [...prev, userMessage, botReply]);
    setInput('');
  };

  // Location sharing
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '❌ Location not supported on this device.' },
      ]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

        setMessages((prev) => [
          ...prev,
          { sender: 'user', text: '📍 Shared my live location' },
          {
            sender: 'bot',
            text:
              '✅ Location received!\n\n' +
              `Latitude: ${latitude.toFixed(5)}\n` +
              `Longitude: ${longitude.toFixed(5)}\n\n` +
              `🗺️ Open in Maps:\n${mapLink}`,
          },
        ]);
      },
      () => {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text:
              '❌ Unable to fetch location.\nPlease enable GPS and try again.',
          },
        ]);
      }
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="floating-btn"
        onClick={() => setOpen(!open)}
        title="Rescue Assistant"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#2196F3',
          color: '#fff',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        🤖
      </button>

      {/* Chat Window */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '320px',
            height: '420px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#2196F3',
              color: '#fff',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              fontWeight: 'bold',
            }}
          >
            🐾 Rescue Assistant
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: '10px',
              overflowY: 'auto',
              background: '#f9f9f9',
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '10px',
                  textAlign: msg.sender === 'user' ? 'right' : 'left',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background:
                      msg.sender === 'user' ? '#DCF8C6' : '#fff',
                    whiteSpace: 'pre-line',
                    maxWidth: '85%',
                  }}
                >
                  {msg.text}

                  {msg.showLocationButton && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={handleShareLocation}
                        style={{
                          backgroundColor: '#4CAF50',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        📍 Share My Location
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              display: 'flex',
              padding: '8px',
              borderTop: '1px solid #ddd',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                outline: 'none',
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                marginLeft: '6px',
                padding: '8px 12px',
                backgroundColor: '#2196F3',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBotButton;
