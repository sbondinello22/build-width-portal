import { Request, Response } from "express";
import * as projectsService from "./projects.service";

export async function listForClientHandler(req: Request, res: Response) {
  const projects = await projectsService.listProjectsForClient(req.params.clientId);
  res.json({ projects });
}

export async function createForClientHandler(req: Request, res: Response) {
  const project = await projectsService.createProjectForClient(req.params.clientId, req.body);
  res.status(201).json({ project });
}

export async function getHandler(req: Request, res: Response) {
  const project = await projectsService.getProject(req.params.id);
  res.json({ project });
}

export async function updateHandler(req: Request, res: Response) {
  const project = await projectsService.updateProject(req.params.id, req.body);
  res.json({ project });
}

export async function deleteHandler(req: Request, res: Response) {
  await projectsService.deleteProject(req.params.id);
  res.status(204).send();
}
