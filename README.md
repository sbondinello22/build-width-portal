# Employee Portal

Small-business employee portal: client management, project & time tracking, invoicing with PDF export, Stripe payments, and overdue-invoice reminders.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Auth**: custom email/password with JWT (httpOnly cookies, access+refresh rotation)
- **PDF**: pdfkit
- **Payments**: Stripe Checkout + webhooks
- **Scheduled jobs**: node-cron

## Development

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, etc.
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Stripe setup (payments)

Payments are not fully wired until you supply real Stripe test-mode credentials in `backend/.env`:

1. Create a free Stripe account and switch to **test mode**.
2. Copy your test secret key (`sk_test_...`) from the Stripe dashboard into `STRIPE_SECRET_KEY`.
3. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
   ```bash
   stripe login
   stripe listen --forward-to localhost:4000/api/webhooks/stripe
   ```
   This prints a webhook signing secret (`whsec_...`) — put it in `STRIPE_WEBHOOK_SECRET`.
4. Restart the backend. On an invoice with status `SENT` or `OVERDUE`, click **Pay with Stripe** and complete checkout with Stripe's test card `4242 4242 4242 4242` (any future expiry, any CVC).
5. The webhook marks the invoice `PAID` and records a `Payment` row once Stripe confirms the charge.

Until these are set, invoice generation, PDF export, and email sending all work normally — only the "Pay with Stripe" button will fail (Stripe will reject the placeholder key).
