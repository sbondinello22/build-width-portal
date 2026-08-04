import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateBody } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/roles.middleware";
import { generateInvoiceSchema, updateStatusSchema } from "./invoices.schema";
import * as controller from "./invoices.controller";
import { checkoutSessionHandler } from "../payments/payments.controller";

export const invoicesRouter = Router();
invoicesRouter.use(requireAuth);

invoicesRouter.get("/", asyncHandler(controller.listHandler));
invoicesRouter.post(
  "/generate",
  requireRole("ADMIN"),
  validateBody(generateInvoiceSchema),
  asyncHandler(controller.generateHandler)
);
invoicesRouter.get("/:id", asyncHandler(controller.getHandler));
invoicesRouter.get("/:id/pdf", asyncHandler(controller.pdfHandler));
invoicesRouter.post("/:id/send", requireRole("ADMIN"), asyncHandler(controller.sendHandler));
invoicesRouter.post("/:id/checkout-session", asyncHandler(checkoutSessionHandler));
invoicesRouter.patch(
  "/:id/status",
  requireRole("ADMIN"),
  validateBody(updateStatusSchema),
  asyncHandler(controller.updateStatusHandler)
);
