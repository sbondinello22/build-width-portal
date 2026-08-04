import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth.middleware";
import * as controller from "./dashboard.controller";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);
dashboardRouter.get("/summary", asyncHandler(controller.summaryHandler));
dashboardRouter.get("/activity", asyncHandler(controller.activityHandler));
