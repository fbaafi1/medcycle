# MedCycle — Healthcare Resource Exchange Platform

MedCycle is a web platform where hospitals, clinics, and individuals can post available medications, medical supplies, and equipment for others to claim. Built to reduce medical waste and improve resource distribution in healthcare.

## Features

- **User Authentication** — Email/password signup and login via Supabase Auth
- **User Profiles** — Organization name, contact person, phone number, and location
- **Create Listings** — Post medications, equipment, or supplies with category-specific fields
- **Listings Feed** — Browse all available listings with search and category filters
- **Listing Details** — View full details with image lightbox preview
- **Contact Options** — Call or WhatsApp the listing owner directly
- **My Listings** — Manage your own listings (edit, delete, mark as taken)
- **Admin Panel** — View all listings and users with search functionality
- **Mobile Responsive** — Fully responsive design for all screen sizes

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Framework   | Next.js 16 (App Router)       |
| Language    | TypeScript                    |
| Styling     | Tailwind CSS v4               |
| Backend     | Supabase (Auth + DB + Storage)|
| Font        | Inter (Google Fonts)          |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Install Dependencies

```bash
cd medcycle
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from **Supabase Dashboard → Settings → API**.

### 3. Set Up Database

1. Go to your **Supabase Dashboard → SQL Editor**
2. Open `supabase_setup.sql` from the project root
3. Paste the entire file and click **Run**

This creates:
- `profiles` and `listings` tables
- Row Level Security (RLS) policies
- Storage buckets (`listing-images`, `licenses`)
- Storage access policies
- Auto-profile trigger on signup

### 4. Disable Email Confirmation (MVP)

Go to **Supabase Dashboard → Authentication → Providers → Email** and turn **OFF** "Confirm email".

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Listing Categories

| Category    | Extra Fields                        |
|-------------|-------------------------------------|
| Medication  | Generic Name, Trade Name, Expiry Date |
| Equipment   | Condition (New / Used / Needs Repair) |
| Supply      | Quantity                            |

## Making a User Admin

After a user signs up, run this in the Supabase SQL Editor:

```sql
UPDATE public.profiles
SET is_admin = true
WHERE user_id = 'THE_USER_UUID_HERE';
```

Find user UUIDs in **Supabase Dashboard → Authentication → Users**.

## Project Structure

```
medcycle/
├── app/
│   ├── page.tsx              # Homepage (listings feed)
│   ├── layout.tsx            # Root layout
│   ├── auth/
│   │   ├── login/page.tsx    # Login page
│   │   └── signup/page.tsx   # Signup page
│   ├── profile/page.tsx      # Profile creation/edit
│   ├── listings/
│   │   ├── create/page.tsx   # Create listing
│   │   └── [id]/
│   │       ├── page.tsx      # Listing detail
│   │       └── edit/page.tsx # Edit listing
│   ├── my-listings/page.tsx  # User's own listings
│   └── admin/page.tsx        # Admin panel
├── components/
│   ├── Navbar.tsx            # Navigation bar
│   ├── Footer.tsx            # Footer
│   ├── ListingCard.tsx       # Listing card component
│   └── Lightbox.tsx          # Image lightbox preview
├── contexts/
│   └── AuthContext.tsx       # Auth state provider
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── types.ts              # TypeScript types
├── supabase_setup.sql        # Database setup script
└── .env.local                # Environment variables
```

## Important Notes

- No payment system — this is a free resource-sharing platform
- No messaging system — contact is via phone call or WhatsApp
- No logistics handling — users coordinate pickup/delivery themselves
- All listings include a disclaimer about item safety

## License

This project is for educational and humanitarian purposes.
