import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
