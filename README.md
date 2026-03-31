# ReviveAI

AI-powered lead reactivation system for car dealerships.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in your credentials:

- **Supabase**: Get URL and keys from your Supabase project settings
- **Twilio**: Get credentials from the Twilio console
- **Resend**: Get your API key from resend.com
- **Anthropic**: Get your API key from console.anthropic.com

### 3. Set up the database

Run the SQL in `supabase/schema.sql` in your Supabase SQL editor.

Optionally run `supabase/seed.sql` for sample data.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Phase 1 Features

- Lead dashboard with status overview
- CSV lead import with preview
- Status badges (pending, contacted, responded, appointed, dead)
- Dark sidebar navigation

## Database Schema

See `supabase/schema.sql` for the full schema including:
- `leads` — core lead records
- `conversations` — SMS/email message history
- `appointments` — scheduled appointments
