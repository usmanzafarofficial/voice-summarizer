## Backend (Auth + Subscription API)

Directory structure:

- `backend/src/controllers/` - request handlers
- `backend/src/routes/` - route definitions
- `backend/src/services/` - data access / Stripe integration
- `backend/src/utils/` - helpers (jwt/password)
- `backend/src/models/` - MongoDB models
- `backend/src/middleware/` - auth middleware

### Setup

1. Copy `.env.example` to `.env` and fill in your values
2. Install dependencies: `npm install`
3. Seed plans in DB and Stripe: `npm run seed:plans`
4. Run: `npm run dev`

Backend defaults to `http://localhost:3001`.

### Endpoints

**Auth:**
- `POST /api/auth/signup` - `{ "name": "...", "email": "...", "password": "..." }`
- `POST /api/auth/login` - `{ "email": "...", "password": "..." }`

**Plans:**
- `GET /api/plans` - Get all active plans

**Subscriptions:**
- `POST /api/subscriptions/checkout` - Create Stripe checkout session (requires auth)
- `GET /api/subscriptions` - Get user subscriptions (requires auth)

**Webhooks:**
- `POST /api/webhook/stripe` - Stripe webhook endpoint (for payment confirmations)

### Seeding Plans

Run `npm run seed:plans` to create plans in MongoDB and Stripe. This will:
- Create products and prices in Stripe
- Save plans to MongoDB with Stripe IDs

