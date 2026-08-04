import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/roles.middleware";
import { createProjectSchema, updateProjectSchema } from "./projects.schema";
import * as controller from "./projects.controller";

export const projectsRouterForClient = Router({ mergeParams: true });
projectsRouterForClient.get("/", asyncHandler(controller.listForClientHandler));
projectsRouterForClient.post(
  "/",
  requireRole("ADMIN"),
  validateBody(createProjectSchema),
  asyncHandler(controller.createForClientHandler)
);

export const projectsRouter = Router();
projectsRouter.use(requireAuth);
projectsRouter.get("/:id", asyncHandler(controller.getHandler));
projectsRouter.patch("/:id", requireRole("ADMIN"), validateBody(updateProjectSchema), asyncHandler(controller.updateHandler));
projectsRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.deleteHandler));
