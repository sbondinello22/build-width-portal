import { Request, Response } from "express";
import * as usersService from "./users.service";

export async function listHandler(_req: Request, res: Response) {
  const users = await usersService.listUsers();
  res.json({ users });
}

export async function createHandler(req: Request, res: Response) {
  const user = await usersService.createUser(req.body);
  res.status(201).json({ user });
}

export async function deleteHandler(req: Request, res: Response) {
  await usersService.deactivateUser(req.params.id, req.user!.id);
  res.status(204).send();
}
