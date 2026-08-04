import { Request, Response } from "express";
import * as paymentsService from "./payments.service";

export async function checkoutSessionHandler(req: Request, res: Response) {
  const session = await paymentsService.createCheckoutSession(req.params.id);
  res.json({ url: session.url });
}

export async function webhookHandler(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];
  await paymentsService.handleStripeWebhook(req.body, signature as string);
  res.json({ received: true });
}
