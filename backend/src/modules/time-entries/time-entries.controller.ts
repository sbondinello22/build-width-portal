import { Request, Response } from "express";
import * as service from "./time-entries.service";

export async function listForProjectHandler(req: Request, res: Response) {
  const entries = await service.listTimeEntriesForProject(req.params.projectId, req.user!);
  res.json({ timeEntries: entries });
}

export async function createForProjectHandler(req: Request, res: Response) {
  const entry = await service.createTimeEntryForProject(req.params.projectId, req.body, req.user!);
  res.status(201).json({ timeEntry: entry });
}

export async function updateHandler(req: Request, res: Response) {
  const entry = await service.updateTimeEntry(req.params.id, req.body, req.user!);
  res.json({ timeEntry: entry });
}

export async function stopHandler(req: Request, res: Response) {
  const entry = await service.stopTimeEntry(req.params.id, req.user!);
  res.json({ timeEntry: entry });
}

export async function deleteHandler(req: Request, res: Response) {
  await service.deleteTimeEntry(req.params.id, req.user!);
  res.status(204).send();
}
