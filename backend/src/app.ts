import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";
import { authRouter } from "./modules/auth/auth.routes";
import { clientsRouter } from "./modules/clients/clients.routes";
import { projectsRouter } from "./modules/projects/projects.routes";
import { timeEntriesRouter } from "./modules/time-entries/time-entries.routes";
import { invoicesRouter } from "./modules/invoices/invoices.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";
import { usersRouter } from "./modules/users/users.routes";
import { settingsRouter } from "./modules/settings/settings.routes";
import { scheduleRouter } from "./modules/schedule/schedule.routes";
import { webhookHandler } from "./modules/payments/payments.controller";
import { asyncHandler } from "./utils/asyncHandler";

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());

app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), asyncHandler(webhookHandler));

app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/time-entries", timeEntriesRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/users", usersRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/schedule", scheduleRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorMiddleware);
