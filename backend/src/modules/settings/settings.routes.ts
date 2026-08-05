import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/roles.middleware";
import { updateSettingsSchema } from "./settings.schema";
import * as controller from "./settings.controller";

export const settingsRouter = Router();
settingsRouter.use(requireAuth, requireRole("ADMIN"));

settingsRouter.get("/", asyncHandler(controller.getHandler));
settingsRouter.patch("/", validateBody(updateSettingsSchema), asyncHandler(controller.updateHandler));
settingsRouter.get("/payments-status", controller.paymentsStatusHandler);
