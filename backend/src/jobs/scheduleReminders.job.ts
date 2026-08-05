import { prisma } from "../config/prisma";
import { sendMail } from "../lib/email/mailer";

export async function runScheduleReminderCheck() {
  const now = new Date();

  const dueEvents = await prisma.scheduleEvent.findMany({
    where: { reminderAt: { lte: now }, reminderSentAt: null },
    include: { createdBy: { select: { name: true, email: true } } },
  });

  for (const event of dueEvents) {
    await sendMail({
      to: event.createdBy.email,
      subject: `Reminder: ${event.title}`,
      text: [
        `This is a reminder for "${event.title}", scheduled for ${event.startAt.toLocaleString()}.`,
        event.description ?? null,
      ]
        .filter(Boolean)
        .join("\n\n"),
    });
    await prisma.scheduleEvent.update({ where: { id: event.id }, data: { reminderSentAt: now } });
  }

  return { remindersSent: dueEvents.length };
}
