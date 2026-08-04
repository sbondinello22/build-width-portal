import Stripe from "stripe";
import { stripe } from "../../lib/stripe/stripeClient";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { env } from "../../config/env";

export async function createCheckoutSession(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new ApiError(404, "Invoice not found");
  if (invoice.status !== "SENT" && invoice.status !== "OVERDUE") {
    throw new ApiError(409, "Only sent or overdue invoices can be paid");
  }

  const amountDue = Number(invoice.total) - Number(invoice.amountPaid);
  if (amountDue <= 0) {
    throw new ApiError(409, "Invoice has no outstanding balance");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: invoice.currency,
          product_data: { name: `Invoice ${invoice.invoiceNumber}` },
          unit_amount: Math.round(amountDue * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { invoiceId: invoice.id },
    success_url: `${env.FRONTEND_URL}/invoices/${invoice.id}?payment=success`,
    cancel_url: `${env.FRONTEND_URL}/invoices/${invoice.id}?payment=cancelled`,
  });

  await prisma.invoice.update({ where: { id: invoice.id }, data: { stripeCheckoutSessionId: session.id } });
  return session;
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new ApiError(400, "Webhook signature verification failed");
  }

  if (event.type !== "checkout.session.completed") return;

  const session = event.data.object as Stripe.Checkout.Session;
  const invoiceId = session.metadata?.invoiceId;
  if (!invoiceId) return;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.status === "PAID") return;

  const amount = (session.amount_total ?? 0) / 100;

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        invoiceId,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
        amount,
        currency: session.currency ?? invoice.currency,
        status: "SUCCEEDED",
        receivedAt: new Date(),
      },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "PAID", amountPaid: amount, paidAt: new Date() },
    }),
    prisma.activityLog.create({
      data: {
        entityType: "invoice",
        entityId: invoiceId,
        action: "paid",
        message: `Invoice ${invoice.invoiceNumber} paid via Stripe`,
      },
    }),
  ]);
}
