import { Request, Response } from "express";
import * as scheduleService from "./schedule.service";

export async function listHandler(req: Request, res: Response) {
  const events = await scheduleService.listEvents(req.query as unknown as { from: Date; to: Date });
  res.json({ events });
}

export async function createHandler(req: Request, res: Response) {
  const event = await scheduleService.createEvent(req.body, req.user!.id);
  res.status(201).json({ event });
}

export async function updateHandler(req: Request, res: Response) {
  const event = await scheduleService.updateEvent(req.params.id, req.body, req.user!.id);
  res.json({ event });
}

export async function deleteHandler(req: Request, res: Response) {
  await scheduleService.deleteEvent(req.params.id, req.user!.id);
  res.status(204).send();
}
