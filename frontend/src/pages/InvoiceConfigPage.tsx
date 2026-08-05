import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "../api/settings";
import { InvoicesSubNav } from "../components/layout/InvoicesSubNav";
import { FormField } from "../components/ui/FormField";

export function InvoiceConfigPage() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });

  const [paymentTerms, setPaymentTerms] = useState("30");
  const [taxRate, setTaxRate] = useState("0");
  const [prefix, setPrefix] = useState("INV-");
  const [reminderInterval, setReminderInterval] = useState("3");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setPaymentTerms(String(settings.defaultPaymentTermsDays));
      setTaxRate(settings.defaultTaxRate);
      setPrefix(settings.invoiceNumberPrefix);
      setReminderInterval(String(settings.overdueReminderIntervalDays));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate({
      defaultPaymentTermsDays: Number(paymentTerms),
      defaultTaxRate: Number(taxRate),
      invoiceNumberPrefix: prefix,
      overdueReminderIntervalDays: Number(reminderInterval),
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-[var(--text-primary)]">Invoices</h1>
      <InvoicesSubNav />

      <h2 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">Configure</h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Defaults applied when generating or repeating invoices, and reminder timing for overdue invoices.
      </p>

      <form
        onSubmit={handleSubmit}
        className="max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        {saved && (
          <div className="mb-4 rounded-md bg-[var(--banner-success-bg)] px-3 py-2 text-sm text-[var(--banner-success-text)]">
            Settings saved.
          </div>
        )}
        <FormField
          label="Default Payment Terms (days)"
          type="number"
          min="1"
          max="365"
          required
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
        />
        <FormField
          label="Default Tax Rate (%)"
          type="number"
          min="0"
          max="100"
          step="0.01"
          required
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
        />
        <FormField
          label="Invoice Number Prefix"
          maxLength={20}
          required
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
        />
        <FormField
          label="Overdue Reminder Interval (days)"
          type="number"
          min="1"
          max="90"
          required
          value={reminderInterval}
          onChange={(e) => setReminderInterval(e.target.value)}
        />
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="mt-2 w-full rounded-md bg-[var(--brand-blue)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--brand-blue-dark)] disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
