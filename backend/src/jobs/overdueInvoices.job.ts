import { prisma } from "../config/prisma";
import { sendMail } from "../lib/email/mailer";
import { logActivity } from "../lib/activityLog";
import { getSettings } from "../modules/settings/settings.service";

export async function runOverdueInvoiceCheck() {
  const now = new Date();
  const settings = await getSettings();

  const newlyOverdue = await prisma.invoice.findMany({
    where: { status: "SENT", dueDate: { lt: now } },
  });
  for (const invoice of newlyOverdue) {
    await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "OVERDUE" } });
    await logActivity({
      entityType: "invoice",
      entityId: invoice.id,
      action: "overdue",
      message: `Invoice ${invoice.invoiceNumber} is now overdue`,
    });
  }

  const reminderCutoff = new Date(now.getTime() - settings.overdueReminderIntervalDays * 86_400_000);
  const dueForReminder = await prisma.invoice.findMany({
    where: {
      status: "OVERDUE",
      OR: [{ lastReminderSentAt: null }, { lastReminderSentAt: { lt: reminderCutoff } }],
    },
    include: { client: true },
  });

  for (const invoice of dueForReminder) {
    const amountDue = Number(invoice.total) - Number(invoice.amountPaid);
    await sendMail({
      to: invoice.client.email,
      subject: `Reminder: Invoice ${invoice.invoiceNumber} is overdue`,
      text: `Invoice ${invoice.invoiceNumber} for $${amountDue.toFixed(2)} was due on ${invoice.dueDate.toDateString()} and is now overdue. Please arrange payment at your earliest convenience.`,
    });
    await prisma.invoice.update({ where: { id: invoice.id }, data: { lastReminderSentAt: now } });
    await logActivity({
      entityType: "invoice",
      entityId: invoice.id,
      action: "reminder_sent",
      message: `Overdue reminder sent for invoice ${invoice.invoiceNumber}`,
    });
  }

  return { markedOverdue: newlyOverdue.length, remindersSent: dueForReminder.length };
}
