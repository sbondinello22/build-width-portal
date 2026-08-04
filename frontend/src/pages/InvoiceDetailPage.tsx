import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getInvoice, invoicePdfUrl, sendInvoice, updateInvoiceStatus } from "../api/invoices";
import type { InvoiceStatus } from "../api/invoices";
import { createCheckoutSession } from "../api/payments";

const editableStatuses: InvoiceStatus[] = ["DRAFT", "SENT", "OVERDUE", "VOID"];

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = id!;
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const paymentResult = searchParams.get("payment");

  const { data: invoice } = useQuery({ queryKey: ["invoices", invoiceId], queryFn: () => getInvoice(invoiceId) });

  const payMutation = useMutation({
    mutationFn: () => createCheckoutSession(invoiceId),
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => sendInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: InvoiceStatus) => updateInvoiceStatus(invoiceId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  if (!invoice) {
    return <p className="text-gray-500">Loading…</p>;
  }

  return (
    <div>
      {paymentResult === "success" && (
        <div className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Payment received — thank you! It may take a moment to reflect below.
        </div>
      )}
      {paymentResult === "cancelled" && (
        <div className="mb-4 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
          Payment was cancelled. No charge was made.
        </div>
      )}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{invoice.invoiceNumber}</h1>
          <p className="text-gray-500">
            {invoice.client.name} · {invoice.client.email} · Due {new Date(invoice.dueDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <select
              value={invoice.status}
              onChange={(e) => statusMutation.mutate(e.target.value as InvoiceStatus)}
              disabled={invoice.status === "PAID"}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              {editableStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              {invoice.status === "PAID" && <option value="PAID">PAID</option>}
            </select>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">{invoice.status}</span>
          )}
          <a
            href={invoicePdfUrl(invoiceId)}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Download PDF
          </a>
          {isAdmin && invoice.status === "DRAFT" && (
            <button
              type="button"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {sendMutation.isPending ? "Sending…" : "Send to Client"}
            </button>
          )}
          {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
            <button
              type="button"
              onClick={() => payMutation.mutate()}
              disabled={payMutation.isPending}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {payMutation.isPending ? "Redirecting…" : "Pay with Stripe"}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems?.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 text-gray-900">{item.description}</td>
                <td className="px-4 py-3 text-gray-600">{item.hours}</td>
                <td className="px-4 py-3 text-gray-600">${item.rate}/hr</td>
                <td className="px-4 py-3 text-gray-600">${item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <div className="w-48 space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${invoice.subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>${invoice.tax}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>${invoice.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
