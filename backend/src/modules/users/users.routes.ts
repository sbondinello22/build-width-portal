import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/roles.middleware";
import { createUserSchema } from "./users.schema";
import * as controller from "./users.controller";

export const usersRouter = Router();
usersRouter.use(requireAuth, requireRole("ADMIN"));

usersRouter.get("/", asyncHandler(controller.listHandler));
usersRouter.post("/", validateBody(createUserSchema), asyncHandler(controller.createHandler));
usersRouter.delete("/:id", asyncHandler(controller.deleteHandler));
