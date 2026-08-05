import { prisma } from "../../config/prisma";
import { UpdateSettingsInput } from "./settings.schema";

const SINGLETON_ID = "singleton";

export async function getSettings() {
  return prisma.settings.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID },
  });
}

export async function updateSettings(input: UpdateSettingsInput) {
  await getSettings();
  return prisma.settings.update({ where: { id: SINGLETON_ID }, data: input });
}
