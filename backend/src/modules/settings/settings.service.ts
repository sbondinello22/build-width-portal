import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { UpdateSettingsInput } from "./settings.schema";

const SINGLETON_ID = "singleton";

export async function getSettings() {
  return prisma.settings.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
}

export async function updateSettings(input: UpdateSettingsInput) {
  await getSettings();
  return prisma.settings.update({ where: { id: SINGLETON_ID }, data: input });
}

export function getPaymentsStatus() {
  const stripeConfigured = env.STRIPE_SECRET_KEY.startsWith("sk_");
  const stripeMode = env.STRIPE_SECRET_KEY.startsWith("sk_live_")
    ? "live"
    : env.STRIPE_SECRET_KEY.startsWith("sk_test_")
      ? "test"
      : null;
  const paypalConfigured = Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);

  return { stripeConfigured, stripeMode, paypalConfigured };
}
