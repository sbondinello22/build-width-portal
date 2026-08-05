import { Request, Response } from "express";
import * as analyticsService from "./analytics.service";
import type { GroupBy } from "./analytics.service";

const validGroupBy: GroupBy[] = ["day", "week", "month"];

export async function timeSeriesHandler(req: Request, res: Response) {
  const groupByParam = String(req.query.groupBy ?? "day");
  const groupBy = (validGroupBy.includes(groupByParam as GroupBy) ? groupByParam : "day") as GroupBy;
  const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
  const clientId = req.query.clientId ? String(req.query.clientId) : undefined;
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;

  const series = await analyticsService.getHoursTimeSeries({ groupBy, projectId, clientId, from, to });
  res.json({ series });
}

export async function projectsHandler(req: Request, res: Response) {
  const clientId = req.query.clientId ? String(req.query.clientId) : undefined;
  const projects = await analyticsService.getProjectAnalytics({ clientId });
  res.json({ projects });
}
