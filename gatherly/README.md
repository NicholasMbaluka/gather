# 🎯 Gatherly — Social Meetup App

A production-ready social events app built for the Kenyan market. Discover nearby events, join them, chat in real-time, and connect with other attendees.

---

## ✨ Features

- **Auth** — Google OAuth + Email/Password via Supabase Auth
- **Events** — Create, browse, filter, and join events with cover images
- **Real-time Chat** — Group chat per event with typing indicators (Supabase Realtime)
- **Social Connections** — Send/accept/reject connection requests
- **Ratings** — Rate interactions 1–5 stars after events
- **User Profiles** — View attended events, connections, ratings
- **Monetization** — Premium subscriptions + Featured event boosts via M-Pesa STK Push
- **Mobile-first** — Responsive design with smooth animations

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourname/gatherly.git
cd gatherly
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the **SQL Editor**, paste and run the contents of `supabase/schema.sql`
3. In **Authentication → Providers**, enable:
   - **Email** (with email confirmations optional for dev)
   - **Google** (add your OAuth credentials)
4. In **Storage**, the schema.sql will auto-create `event-images` and `avatars` buckets

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Find these in your Supabase project: **Settings → API**

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Schema

```
users              — Profiles linked to auth.users
events             — Event listings
event_attendees    — Who joined which event (unique constraint)
messages           — Real-time group chat per event
connections        — Social connection requests
ratings            — Post-event user ratings (1–5 stars)
payments           — M-Pesa transaction records
profile_views      — Premium feature: who viewed your profile
```

---

## 💳 M-Pesa Integration

### Pricing (KES)
| Product | Price |
|---------|-------|
| Premium Monthly | KES 150 |
| Premium Quarterly | KES 400 |
| Featured Event Boost | KES 200 |

### Setup M-Pesa (Production)

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app and get Consumer Key + Secret
3. Deploy Edge Functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-id

# Set secrets
supabase secrets set MPESA_CONSUMER_KEY=xxx
supabase secrets set MPESA_CONSUMER_SECRET=xxx
supabase secrets set MPESA_SHORTCODE=xxx
supabase secrets set MPESA_PASSKEY=xxx
supabase secrets set MPESA_CALLBACK_URL=https://your-project-id.supabase.co/functions/v1/mpesa-callback

# Deploy functions
supabase functions deploy mpesa-stkpush
supabase functions deploy mpesa-callback
```

4. Update `PremiumModal.tsx` and `FeaturedModal.tsx` to call the Edge Function:
```typescript
const res = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mpesa-stkpush`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ phone, amount: plan.price, reference: payment.reference, type: selected }),
  }
)
```

---

## 🔒 Row Level Security

All tables have RLS enabled with these key policies:

| Table | Read | Write |
|-------|------|-------|
| `users` | Everyone | Own row only |
| `events` | Everyone | Creator only (update/delete) |
| `event_attendees` | Everyone | Own row only |
| `messages` | Attendees only | Attendees only |
| `connections` | Own connections | Own row only |
| `ratings` | Everyone | Own ratings only |
| `payments` | Own payments | Own row only |
| `profile_views` | Premium owners | Authenticated users |

---

## 🚢 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Or connect your GitHub repo directly at [vercel.com](https://vercel.com) for automatic deployments.

---

## 📁 Project Structure

```
gatherly/
├── app/
│   ├── login/page.tsx          # Login with Google + Email
│   ├── signup/page.tsx         # 2-step signup with profile creation
│   ├── events/
│   │   ├── page.tsx            # Browse/discover events
│   │   ├── create/page.tsx     # Create new event
│   │   └── [id]/page.tsx       # Event detail + chat + attendees
│   ├── profile/[id]/page.tsx   # User profile page
│   ├── dashboard/page.tsx      # User dashboard + settings
│   └── auth/callback/route.ts  # OAuth callback handler
├── components/
│   ├── Navbar.tsx              # Responsive top navigation
│   ├── EventCard.tsx           # Grid + list view event card
│   ├── ChatBox.tsx             # Real-time chat with typing indicator
│   ├── UserCard.tsx            # User card with connect button
│   ├── Skeleton.tsx            # Loading skeleton components
│   ├── PremiumModal.tsx        # M-Pesa premium subscription UI
│   ├── FeaturedModal.tsx       # M-Pesa event boost UI
│   └── RatingModal.tsx         # 1–5 star rating modal
├── hooks/
│   ├── useAuth.ts              # Auth state + profile
│   ├── useEvents.ts            # Events CRUD + join/leave
│   └── useChat.ts              # Realtime messages + typing
├── lib/
│   ├── supabase-client.ts      # Browser Supabase client
│   ├── supabase-server.ts      # Server Supabase client
│   ├── database.types.ts       # Full TypeScript database types
│   └── utils.ts                # Helpers, formatters, constants
├── supabase/
│   ├── schema.sql              # Complete DB setup + RLS + seed
│   └── functions/
│       ├── mpesa-stkpush/      # M-Pesa STK Push Edge Function
│       └── mpesa-callback/     # M-Pesa payment webhook
├── middleware.ts               # Auth route protection
└── .env.example                # Environment variables template
```

---

## 🎨 Design System

- **Font**: Playfair Display (headings) + DM Sans (body)
- **Primary Color**: `#f97316` (Orange 500) — warm, energetic
- **Theme**: Light-first with dark mode ready via CSS variables
- **Radius**: `0.75rem` rounded corners throughout
- **Animation**: Fade-in, slide-in, shimmer skeleton, pulse dots

---

## 🔧 Adding Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
4. In Supabase: **Auth → Providers → Google** — paste Client ID + Secret

---

## 📱 Progressive Web App (Optional)

Add to `app/manifest.json`:
```json
{
  "name": "Gatherly",
  "short_name": "Gatherly",
  "theme_color": "#f97316",
  "background_color": "#faf9f8",
  "display": "standalone",
  "start_url": "/events"
}
```

---

## 🤝 Contributing

PRs welcome! Key areas to improve:
- Google Maps integration for event locations
- Push notifications (Web Push API)
- Event photo galleries
- Recurring events
- In-app M-Pesa payment status polling

---

## 📄 License

MIT
