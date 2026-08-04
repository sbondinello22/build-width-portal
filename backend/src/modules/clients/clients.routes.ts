import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/roles.middleware";
import { createClientSchema, updateClientSchema } from "./clients.schema";
import * as controller from "./clients.controller";
import { projectsRouterForClient } from "../projects/projects.routes";

export const clientsRouter = Router();

clientsRouter.use(requireAuth);

clientsRouter.get("/", asyncHandler(controller.listHandler));
clientsRouter.post("/", requireRole("ADMIN"), validateBody(createClientSchema), asyncHandler(controller.createHandler));
clientsRouter.get("/:id", asyncHandler(controller.getHandler));
clientsRouter.patch("/:id", requireRole("ADMIN"), validateBody(updateClientSchema), asyncHandler(controller.updateHandler));
clientsRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(controller.deleteHandler));

clientsRouter.use("/:clientId/projects", projectsRouterForClient);
