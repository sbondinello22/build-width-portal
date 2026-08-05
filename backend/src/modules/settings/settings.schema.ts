import { z } from "zod";

export const updateSettingsSchema = z.object({
  defaultPaymentTermsDays: z.coerce.number().int().min(1).max(365).optional(),
  defaultTaxRate: z.coerce.number().min(0).max(100).optional(),
  invoiceNumberPrefix: z.string().min(1).max(20).optional(),
  overdueReminderIntervalDays: z.coerce.number().int().min(1).max(90).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
