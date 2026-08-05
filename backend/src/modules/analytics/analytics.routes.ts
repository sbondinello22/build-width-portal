import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/roles.middleware";
import * as controller from "./analytics.controller";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth, requireRole("ADMIN"));

analyticsRouter.get("/time-series", asyncHandler(controller.timeSeriesHandler));
analyticsRouter.get("/projects", asyncHandler(controller.projectsHandler));
