# Synapsis Frontend - Real-Time Chat UI

This is the frontend for Synapsis, a modern, highly interactive messaging application built with React and Socket.io.

## 🎨 Design Philosophy

Synapsis features a custom **Pink WhatsApp-inspired theme** designed for a premium, vibrant user experience.
- **Colors**: A curated palette centered around `#c33797` (Primary Pink) and smooth surfaces (`#f7f9fc`).
- **Aesthetics**: Glassmorphism, fluid animations, and custom polished modals (Block, Report, Exit Group).
- **Typography**: Clean, modern look using the **Inter** font family.

## 🚀 Technical Highlights

### Core Technology
- **Framework**: React 18 (powered by Vite for ultra-fast development).
- **Real-Time**: `socket.io-client` for instant message delivery and presence updates.
- **Networking**: Axios with interceptors for automatic JWT attachment and error handling.
- **Icons**: Lucide React for consistent, high-quality iconography.

### Key Features
- **Smart Chat Interface**: Message bubbles with status ticks, typing indicators, and threaded replies.
- **Status Feed**: A beautiful interface for viewing 24-hour disappearing stories (Text & Images).
- **Interactive Profiles**: View public bios, "Life Vibe" cards, and mutual friends.
- **Blocking System**: A seamless UI for blocking/unblocking users with immediate feedback.
- **Group Management**: Complete group lifecycle management including creation and customized exit flows.

## 📂 Project Structure

```text
client/src/
├── components/     # UI Building Blocks
│   ├── ChatWindow.jsx    # The core messaging interface
│   ├── Sidebar.jsx       # Chat list and navigation
│   ├── MessageBubble.jsx # Individual message rendering
│   └── ...               # Modals (GroupProfile, StatusViewer, etc.)
├── pages/          # Full Page Layouts
│   ├── AuthPage.jsx      # Login and Registration
│   ├── ChatLayout.jsx    # Main application dashboard
│   └── PublicProfilePage.jsx
├── services/       # External Integrations
│   ├── api.js            # Axios instance and API calls
│   └── socket.js         # Socket.io connection and event helpers
└── contexts/       # Global State
    └── AuthContext.jsx   # Authentication and User Session state
```

## ⚙️ Environment Variables

For production, the client requires the following environment variables (defined in your Vercel/Hosting dashboard):

- `VITE_API_URL`: The URL of your deployed backend API (e.g., `https://api.Synapsis.com/api`).
- `VITE_SOCKET_URL`: The base URL of your deployed Socket.io server (e.g., `https://api.Synapsis.com`).

## 🛠️ Development

To run the frontend locally:
1. `npm install`
2. `npm run dev`
3. The app will be available at `http://localhost:5173`.
