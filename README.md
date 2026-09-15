# Zen-Chat

![Zen-Chat Logo](/logo.png)

A modern, privacy-focused AI chat application with multimodal capabilities, web search integration, and offline support.

## 🌟 Overview

Zen-Chat is a full-stack AI chat application that allows users to interact with multiple AI models from leading providers through a clean, user-friendly interface. It features offline support, web search integration, and a focus on performance and user privacy.

## ✨ Key Features

- **Multiple AI Models** - Access to Llama 3.1, DeepSeek R1, Gemma, and other models via OpenRouter
- **Real-time Chat** - Responsive streaming responses with markdown support
- **Web Search Integration** - Get up-to-date information via Brave Search API
- **Offline Support** - Continue chatting even without an internet connection
- **Local-First Architecture** - Data stored locally with optional cloud syncing
- **Dark/Light Mode** - Elegant theme system with system preference detection
- **Responsive Design** - Optimized for both desktop and mobile devices
- **Share Conversations** - Generate shareable links to conversations
- **Markdown Support** - Rich formatting with code syntax highlighting
- **Chat Management** - Organize conversations by time periods (Today, Last 7 Days, Last 30 Days)
- **Message Actions** - Copy, fork conversations, and follow-up suggestions

## 🏗️ Architecture

### Frontend ([`frontend`](frontend ))
- **React 18** with TypeScript and Vite
- **Tailwind CSS** with custom theme variables
- **Shadcn UI** component system for consistent design
- **Dexie.js** for IndexedDB local storage
- **React Markdown** for text formatting
- **Supabase** for authentication and cloud sync

### Backend ([`backend`](backend ))
- **Node.js** with Express and TypeScript
- **OpenRouter** for multi-model AI integration
- **Brave Search API** for web search capabilities
- **Supabase** for data persistence

## 📂 Project Structure

```
zen-chat/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── chat/         # Chat interface components
│   │   │   │   ├── ChatSidebar.tsx      # Conversation management
│   │   │   │   ├── ChatWindow.tsx       # Main chat display
│   │   │   │   ├── ChatInput.tsx        # Message input with attachments
│   │   │   │   ├── ChatMessage.tsx      # Individual message display
│   │   │   │   ├── MessageRenderer.tsx  # Markdown and code rendering
│   │   │   │   ├── EmptyState.tsx       # Welcome screen
│   │   │   │   └── SharedChatView.tsx   # Public conversation view
│   │   │   ├── ui/           # Shadcn/ui component library
│   │   │   ├── auth/         # Authentication components
│   │   │   └── features/     # Feature components (insights, image gen)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand state management
│   │   ├── services/         # API services and database
│   │   └── types/            # TypeScript definitions
│   ├── supabase/            # Database migrations
│   └── public/              # Static assets
└── backend/                 # Node.js backend
    ├── src/
    │   ├── routes/          # API endpoints
    │   │   ├── chat.ts      # Chat completion and models
    │   │   └── search.ts    # Web search endpoints
    │   ├── services/        # Business logic
    │   │   ├── llm/         # AI model integrations
    │   │   └── websearch.ts # Brave Search integration
    │   ├── middleware/      # Express middleware
    │   ├── types/           # TypeScript definitions
    │   └── utils/           # Utility functions
    └── .env                 # Environment configuration
```

## 🛠️ Tech Stack

### Core Technologies
- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL), IndexedDB (local)
- **Styling**: Tailwind CSS, Shadcn/ui
- **AI Integration**: OpenRouter API
- **Search**: Brave Search API
- **Authentication**: Supabase Auth

### Key Dependencies
- **React Ecosystem**: React Router, Zustand (state), React Markdown
- **UI Components**: Radix UI primitives, Lucide icons
- **Development**: ESLint, PostCSS, tsx (dev server)
- **Utilities**: date-fns, class-variance-authority

## 📋 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for cloud features)
- OpenRouter API key
- Brave Search API key (optional)

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/yourusername/zen-chat.git
cd zen-chat
```

#### 2. Frontend Setup
```bash
# Move to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your environment variables
# VITE_API_BASE_URL=http://localhost:5000
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start the development server
npm run dev
```

#### 3. Backend Setup
```bash
# Move to backend directory
cd ../backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your API keys
# OPENROUTER_API_KEY=your_openrouter_api_key
# BRAVE_SEARCH_API_KEY=your_brave_search_api_key
# PORT=5000
# YOUR_SITE_URL=http://localhost:5173

# Start the development server
npm run dev
```

#### 4. Create Supabase Database
Import the migration files from the [`frontend/supabase/migrations`](frontend/supabase/migrations ) directory to your Supabase project:

```sql
-- Run the migration file in your Supabase SQL editor
-- File: 20250608110442_emerald_spire.sql
```

## 🎯 Core Features

### Chat Interface
- **Responsive Sidebar** - Collapsible conversation list with search functionality
- **Time-based Organization** - Conversations grouped by Today, Last 7 Days, Last 30 Days
- **Context Menus** - Rename, share, and delete conversations
- **Real-time Updates** - Live conversation syncing across devices

### AI Integration
- **Multi-Model Support** - Choose from Llama 3.1, DeepSeek R1, Gemma models
- **Streaming Responses** - Real-time message streaming for immediate feedback
- **Context Awareness** - Maintains conversation history and context
- **Search Enhancement** - Integrate web search results into AI responses

### Message Features
- **Rich Formatting** - Full Markdown support with GitHub Flavored Markdown
- **Code Highlighting** - Syntax highlighting for 100+ programming languages
- **Message Actions** - Copy messages, fork conversations at any point
- **File Attachments** - Support for images and documents (UI ready)

### Offline Capabilities
- **IndexedDB Storage** - All conversations stored locally first
- **Background Sync** - Automatic cloud synchronization when online
- **Offline Mode** - Continue viewing and organizing chats without internet

## 🎨 UI Components

The frontend uses a comprehensive design system built on Shadcn/ui:

### Layout Components
- **Card, Sheet, Dialog** - Container and modal components
- **Scroll Area** - Custom scrollbars and viewport management
- **Navigation Menu** - Complex navigation with dropdowns

### Interactive Elements
- **Button** - Multiple variants (default, outline, ghost, destructive)
- **Command Palette** - Search interface with keyboard navigation
- **Context Menu** - Right-click menus with nested items
- **Carousel** - Image and content sliders

### Data Display
- **Table** - Responsive data tables with sorting
- **Chart** - Analytics visualization (prepared for insights)
- **Progress** - Loading and progress indicators

## 🔒 Privacy & Security

- **Local-first approach** - Your data stays on your device by default
- **Optional cloud sync** - Sync across devices with Supabase encryption
- **No data harvesting** - Your conversations are not used for training
- **Row Level Security** - Database policies ensure user data isolation

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the dist/ folder
```

### Backend (Railway/Render)
```bash
npm run build
npm start
```

### Environment Variables
Ensure all required environment variables are set in your deployment platform.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and TypeScript conventions
- Add appropriate error handling and logging
- Test your changes across different screen sizes
- Ensure offline functionality works as expected

## 🙏 Acknowledgments

- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [OpenRouter](https://openrouter.ai/) for AI model access
- [Supabase](https://supabase.com/) for backend infrastructure
- [Brave Search](https://brave.com/search/) for web search capabilities

---

<p align="center">Made with ❤️ using React, Node.js, and AI</p>

