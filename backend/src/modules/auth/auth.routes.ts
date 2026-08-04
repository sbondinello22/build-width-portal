import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { registerSchema, loginSchema } from "./auth.schema";
import * as controller from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), asyncHandler(controller.registerHandler));
authRouter.post("/login", validateBody(loginSchema), asyncHandler(controller.loginHandler));
authRouter.post("/refresh", asyncHandler(controller.refreshHandler));
authRouter.post("/logout", asyncHandler(controller.logoutHandler));
authRouter.get("/me", requireAuth, asyncHandler(controller.meHandler));
