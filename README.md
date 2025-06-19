1. Clone the repository

git clone https://github.com/Duckaet/zenchat.


2. Frontend Setup

# Move to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Start the development server
npm run dev

3. Backend Setup

# Move to backend directory
cd ../backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env


PORT=5000
OPENROUTER_API_KEY=
YOUR_SITE_URL=http://localhost:5173
NODE_ENV=development
BRAVE_SEARCH_API_KEY

# Start the development server
npm run dev

4. Create Supabase Database
Import the migration files from the supabase directory to your Supabase project.