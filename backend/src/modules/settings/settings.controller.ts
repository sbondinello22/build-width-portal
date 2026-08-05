import { Request, Response } from "express";
import * as settingsService from "./settings.service";

export async function getHandler(_req: Request, res: Response) {
  const settings = await settingsService.getSettings();
  res.json({ settings });
}

export async function updateHandler(req: Request, res: Response) {
  const settings = await settingsService.updateSettings(req.body);
  res.json({ settings });
}
