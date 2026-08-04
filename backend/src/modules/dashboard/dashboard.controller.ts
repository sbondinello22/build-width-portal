import { Request, Response } from "express";
import * as dashboardService from "./dashboard.service";

export async function summaryHandler(req: Request, res: Response) {
  const summary = await dashboardService.getSummary(req.user!);
  res.json(summary);
}

export async function activityHandler(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const activity = await dashboardService.getActivity(page);
  res.json({ activity });
}
