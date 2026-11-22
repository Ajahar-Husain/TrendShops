# TrendShops

TrendShops is a MERN e-commerce starter for an India-focused online store. The `client/` directory contains the React storefront and admin screens; `server/` contains the Express API, Mongoose models, authentication, catalog, cart and order routes. The separate `E:\TrendShops\TrendShops\` directory contains supplied HTML/image design references, not executable application code.

## What works in this project

- Product catalog with seeded categories, search, price sorting, deals and product details
- Customer registration, login and persistent browser cart
- Editable customer profile, saved delivery addresses and email verification
- Account wishlist with saved products
- Address-based UPI/QR checkout with manual admin approval
- Customer order history, order details, timeline and cancellation
- Admin dashboard, product creation/deactivation and order status updates
- MongoDB persistence through Mongoose
- JWT authentication and admin-only API routes

## Integration status

Checkout uses a **manual UPI flow without a payment gateway**. The app builds a UPI QR from `MERCHANT_UPI_VPA`; customers submit a payment claim and an admin must verify the transfer in the merchant's UPI/bank account before approving the order. QR transfers may be real. The website cannot verify UPI transactions automatically, so only configure a VPA that you control and verify every transfer before approval. Courier integrations, WhatsApp delivery, PDF invoices and automatic refunds are not implemented.

## Requirements

- Node.js 18 or newer and npm
- MongoDB 6 or newer, running locally or available through MongoDB Atlas

## Setup

From `E:\TrendShops\mern-app`:

```powershell
npm run install-all
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

Edit `server\.env`:

- Set `MONGODB_URI` to your MongoDB connection string.
- Replace both JWT placeholder values with different, randomly generated secrets.
- Set `CLIENT_URL=http://localhost:3000`.
- Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` to the admin credentials you want. Do not use a production password in a shared development environment.
- Set `MERCHANT_UPI_VPA` to a merchant UPI ID you control. The QR can initiate a real transfer; admins must verify receipt manually.
- Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `EMAIL_FROM` to send account email-verification links. Verification links expire after one hour. The sample SMTP credentials in `server\.env.example` are placeholders.

Start a local MongoDB instance with Docker, or use an existing local MongoDB/Atlas database:

```powershell
docker compose up -d mongodb
```

The client defaults to the local API at `http://localhost:5000`; change `client\.env` only if your API runs elsewhere.

To enable Google address autocomplete and current-location lookup, set `VITE_GOOGLE_MAPS_API_KEY` in `client\.env`. Enable the Maps JavaScript API, Places API (New), and Geocoding API in the same Google Cloud project, with billing enabled. Restrict the key to your website's HTTP referrers and the required APIs. The key is used by the browser and must not be treated as a server secret. Without it, delivery addresses can still be entered manually.

Seed the catalog and admin account, then run the frontend and API:

```powershell
cd server
npm run seed
cd ..
npm run dev
```

Open:

- Storefront: <http://localhost:3000>
- API health: <http://localhost:5000/api/health>

The seed command creates six categories and twelve example products. It creates or promotes an admin only when both `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set.

## Useful commands

Run from the project root:

| Command | Purpose |
|---|---|
| `npm run dev` | Run the API and Vite development server |
| `npm run build` | Build the client for production |
| `npm run lint` | Run client ESLint checks |
| `npm run check` | Check API entrypoint syntax |
| `npm test` | Run API validation/auth and UPI QR unit tests |
| `npm start` | Start the API |
| `npm run install-all` | Install root, API and client dependencies |

Run `npm run seed` from `server\` after configuring `server\.env`.

## API overview

All API routes are under `/api`:

- `GET /health`
- `/auth` — register, login, refresh, profile, address, wishlist and email verification operations
- `/products` and `/categories` — browse and manage the catalog
- `/cart` — authenticated cart operations
- `/orders` — UPI order placement, customer order history, cancellation and admin fulfilment
- `/payments/demo` — UPI QR instructions and customer payment submission for manual verification
- `/payments/admin/approval-queue` — administrator payment approval queue

The API is implemented in `server/server.js`; models are in `server/models/`, and routes are in `server/routes/`.

## Deployment notes

Build the client with `npm run build` and serve `client/dist` using a static host. Deploy the API as a separate Node.js service and configure `MONGODB_URI`, strong JWT secrets, `CLIENT_URL`, and `NODE_ENV=production` in the hosting provider's secret manager. Never publish `.env` files or commit real provider credentials.
