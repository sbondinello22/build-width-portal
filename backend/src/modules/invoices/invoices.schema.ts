import { z } from "zod";

export const generateInvoiceSchema = z
  .object({
    clientId: z.string().uuid(),
    timeEntryIds: z.array(z.string().uuid()).default([]),
    customLineItems: z
      .array(
        z.object({
          description: z.string().min(1),
          hours: z.number().positive(),
          amount: z.number().positive(),
        })
      )
      .default([]),
  })
  .refine((data) => data.timeEntryIds.length > 0 || data.customLineItems.length > 0, {
    message: "Select at least one time entry or add a custom line item",
  });

export const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "OVERDUE", "VOID"]),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.coerce.date().optional(),
  tax: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
