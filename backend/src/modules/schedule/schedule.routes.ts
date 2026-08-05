import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateBody, validateQuery } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/roles.middleware";
import { createEventSchema, listEventsQuerySchema, updateEventSchema } from "./schedule.schema";
import * as controller from "./schedule.controller";

export const scheduleRouter = Router();
scheduleRouter.use(requireAuth, requireRole("ADMIN"));

scheduleRouter.get("/", validateQuery(listEventsQuerySchema), asyncHandler(controller.listHandler));
scheduleRouter.post("/", validateBody(createEventSchema), asyncHandler(controller.createHandler));
scheduleRouter.patch("/:id", validateBody(updateEventSchema), asyncHandler(controller.updateHandler));
scheduleRouter.delete("/:id", asyncHandler(controller.deleteHandler));
