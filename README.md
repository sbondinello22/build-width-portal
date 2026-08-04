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
