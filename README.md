## 📥 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Duckaet/zenchat.git
cd zenchat
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase and backend API info
npm run dev
```

### 3. Backend Setup

```bash
cd ../backend
npm install
cp .env.example .env
# Edit .env with your API keys and config
npm run dev
```

### 4. Database Setup

- Create a Supabase project.
- Run the SQL in `supabase/migrations` to set up tables and policies.

