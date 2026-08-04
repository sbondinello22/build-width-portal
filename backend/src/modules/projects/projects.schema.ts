import { z } from "zod";

export const projectStatusEnum = z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]);

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  rate: z.coerce.number().nonnegative(),
  budgetHours: z.coerce.number().nonnegative().optional(),
  status: projectStatusEnum.optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
