import { z } from "zod";

export const createTimeEntrySchema = z.object({
  description: z.string().max(1000).optional(),
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional(),
  billable: z.boolean().optional(),
});

export const updateTimeEntrySchema = z.object({
  description: z.string().max(1000).optional(),
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().nullable().optional(),
  billable: z.boolean().optional(),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
