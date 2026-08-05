import cron from "node-cron";
import { env } from "../config/env";
import { runOverdueInvoiceCheck } from "./overdueInvoices.job";
import { runScheduleReminderCheck } from "./scheduleReminders.job";

export function startScheduler() {
  cron.schedule(env.CRON_OVERDUE_SCHEDULE, () => {
    runOverdueInvoiceCheck()
      .then(({ markedOverdue, remindersSent }) => {
        console.log(`Overdue invoice check: ${markedOverdue} marked overdue, ${remindersSent} reminders sent`);
      })
      .catch((err) => console.error("Overdue invoice check failed", err));
  });

  cron.schedule(env.CRON_SCHEDULE_REMINDER, () => {
    runScheduleReminderCheck()
      .then(({ remindersSent }) => {
        if (remindersSent > 0) console.log(`Schedule reminder check: ${remindersSent} reminders sent`);
      })
      .catch((err) => console.error("Schedule reminder check failed", err));
  });
}
