import cron from "node-cron";
import { env } from "../config/env";
import { runOverdueInvoiceCheck } from "./overdueInvoices.job";

export function startScheduler() {
  cron.schedule(env.CRON_OVERDUE_SCHEDULE, () => {
    runOverdueInvoiceCheck()
      .then(({ markedOverdue, remindersSent }) => {
        console.log(`Overdue invoice check: ${markedOverdue} marked overdue, ${remindersSent} reminders sent`);
      })
      .catch((err) => console.error("Overdue invoice check failed", err));
  });
}
