import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { createTimeEntrySchema, updateTimeEntrySchema } from "./time-entries.schema";
import * as controller from "./time-entries.controller";

export const timeEntriesRouterForProject = Router({ mergeParams: true });
timeEntriesRouterForProject.use(requireAuth);
timeEntriesRouterForProject.get("/", asyncHandler(controller.listForProjectHandler));
timeEntriesRouterForProject.post(
  "/",
  validateBody(createTimeEntrySchema),
  asyncHandler(controller.createForProjectHandler)
);

export const timeEntriesRouter = Router();
timeEntriesRouter.use(requireAuth);
timeEntriesRouter.patch("/:id", validateBody(updateTimeEntrySchema), asyncHandler(controller.updateHandler));
timeEntriesRouter.post("/:id/stop", asyncHandler(controller.stopHandler));
timeEntriesRouter.delete("/:id", asyncHandler(controller.deleteHandler));
