# Smile Meter CMS

A simple content management system for the Smile Meter app, allowing administrators and store managers to upload and schedule images for different units.

## Features

- **Authentication:** Secure login for admins and store managers
- **Role-based Access:** Admins can manage all units, store managers only their assigned units
- **Unit Management:** Create, update, and manage units
- **Image Upload:** Upload images for different prize categories (small, medium, top)
- **Image Scheduling:** Schedule images for future dates
- **Simple Analytics:** View basic usage statistics

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smile-meter-cms.git
cd smile-meter-cms
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```
Then edit `.env.local` with your Supabase credentials.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

Create the following tables in your Supabase project:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  role VARCHAR CHECK (role IN ('admin', 'store_manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Units Table
```sql
CREATE TABLE units (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  assigned_manager_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Unit Images Table
```sql
CREATE TABLE unit_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id VARCHAR REFERENCES units(id) NOT NULL,
  category VARCHAR CHECK (category IN ('small_prize', 'medium_prize', 'top_prize')) NOT NULL,
  image_url TEXT NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Scheduled Images Table
```sql
CREATE TABLE scheduled_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id VARCHAR REFERENCES units(id) NOT NULL,
  category VARCHAR CHECK (category IN ('small_prize', 'medium_prize', 'top_prize')) NOT NULL,
  image_url TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(unit_id, category, scheduled_date)
);
```

## Deployment

The app can be deployed to Vercel by connecting your GitHub repository.

## License

MIT