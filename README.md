# 🐾 Animal Rescue Website

A complete, working animal rescue platform built with React, TypeScript, and plain CSS.

## 🚀 Features

- **Landing Page**: Emotional rescue message with clear call-to-action
- **User Authentication**: Login & Registration (localStorage-based)
- **Rescue Form**: Quick form to report animals in distress
- **Volunteer Dashboard**: Track rescues, stats, and upload photos
- **Admin Dashboard**: View all rescue requests and volunteer statistics
- **Floating Helpers**: WhatsApp and Chatbot buttons for instant help

## 📁 Project Structure

```
animal-rescue-emergency-response-platform/
├── src/
│   ├── components/
│   │   ├── Header.tsx          # Navigation header
│   │   ├── Footer.tsx          # Footer component
│   │   ├── WhatsAppButton.tsx  # Floating WhatsApp button
│   │   └── ChatBotButton.tsx   # Floating chatbot button
│   ├── pages/
│   │   ├── LandingPage.tsx     # Homepage
│   │   ├── Login.tsx           # Login page
│   │   ├── Register.tsx        # Registration page
│   │   ├── RescueForm.tsx      # Report rescue form
│   │   ├── VolunteerDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── styles/
│   │   ├── global.css          # Global styles
│   │   ├── header.css          # Header & footer styles
│   │   └── dashboard.css       # Dashboard styles
│   ├── App.tsx                 # Main app with routing
│   └── index.tsx               # Entry point
└── package.json
```

## 🛠️ Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **React Router DOM** - Client-side routing
- **Plain CSS** - Styling (no Tailwind, no CSS-in-JS)
- **localStorage** - Data persistence & authentication

## 📦 Installation & Setup

1. Navigate to the project directory:
   ```bash
   cd animal-rescue-emergency-response-platform
   ```

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open browser to:
   ```
   http://localhost:3000
   ```

## 🔐 Demo Accounts

### Admin Account
- Email: `admin@rescue.com`
- Password: `admin123`

### Volunteer Account
- Email: `volunteer@rescue.com`
- Password: `vol123`

## 🗺️ Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Landing Page | Homepage with hero section |
| `/login` | Login | User authentication |
| `/register` | Sign Up | New user registration |
| `/rescue` | Rescue Form | Report animal in need |
| `/volunteer` | Volunteer Dashboard | View stats & activities |
| `/admin` | Admin Dashboard | Manage rescues & volunteers |

## 🎨 Design

- **Color Scheme**: Soft green (#4caf50) and white
- **Mobile-Friendly**: Responsive design
- **Clean UI**: Large buttons, clear text
- **Emergency-Focused**: Quick access to rescue form

## 💾 Data Storage

All data is stored in browser's localStorage:
- `users` - Registered users
- `currentUser` - Logged in user
- `rescueRequests` - All rescue submissions

## 🔧 Scripts

```bash
npm start        # Start development server
npm run build    # Create production build
npm test         # Run tests
```

## ✅ Verification

- ✅ Zero build errors
- ✅ TypeScript compilation successful
- ✅ All routes working
- ✅ Components properly structured
- ✅ No over-engineering
- ✅ Beginner-friendly code
- ✅ Clear comments throughout

## 🆘 Emergency Contact

WhatsApp: Click the floating button (bottom left)
Chatbot: Click the floating button (bottom right)
Hotline: +1 (234) 567-890

## 📝 Notes

- This is a frontend-only application
- No actual backend or database
- Uses mock data and localStorage
- Perfect for learning React + TypeScript
- Code is intentionally kept simple and well-commented

---

**Built with ❤️ for animal rescue organizations**

Every life matters. 🐾
