import { z } from "zod";

export const generateInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  timeEntryIds: z.array(z.string().uuid()).min(1),
});

export const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "OVERDUE", "VOID"]),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
