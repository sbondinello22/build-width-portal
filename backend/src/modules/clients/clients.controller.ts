import { Request, Response } from "express";
import * as clientsService from "./clients.service";

export async function listHandler(_req: Request, res: Response) {
  const clients = await clientsService.listClients();
  res.json({ clients });
}

export async function getHandler(req: Request, res: Response) {
  const client = await clientsService.getClient(req.params.id);
  res.json({ client });
}

export async function createHandler(req: Request, res: Response) {
  const client = await clientsService.createClient(req.body, req.user!.id);
  res.status(201).json({ client });
}

export async function updateHandler(req: Request, res: Response) {
  const client = await clientsService.updateClient(req.params.id, req.body);
  res.json({ client });
}

export async function deleteHandler(req: Request, res: Response) {
  await clientsService.deleteClient(req.params.id);
  res.status(204).send();
}
