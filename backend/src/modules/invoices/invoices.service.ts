import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { sendMail } from "../../lib/email/mailer";
import { generateInvoicePdfBuffer } from "../../lib/pdf/generateInvoicePdf";
import { GenerateInvoiceInput, UpdateStatusInput } from "./invoices.schema";

const invoiceInclude = { client: true, lineItems: true, payments: true } as const;

export function listInvoices() {
  return prisma.invoice.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } });
}

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
  if (!invoice) throw new ApiError(404, "Invoice not found");
  return invoice;
}

async function nextInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

export async function generateInvoice(input: GenerateInvoiceInput, createdById: string) {
  const client = await prisma.client.findUnique({ where: { id: input.clientId } });
  if (!client) throw new ApiError(404, "Client not found");

  const entries = await prisma.timeEntry.findMany({
    where: { id: { in: input.timeEntryIds } },
    include: { project: true },
  });
  if (entries.length !== input.timeEntryIds.length) {
    throw new ApiError(400, "One or more time entries were not found");
  }
  for (const entry of entries) {
    if (entry.project.clientId !== input.clientId) {
      throw new ApiError(400, `Time entry ${entry.id} does not belong to a project for this client`);
    }
    if (entry.billed) {
      throw new ApiError(409, `Time entry ${entry.id} has already been billed`);
    }
    if (!entry.endedAt || entry.durationMinutes === null) {
      throw new ApiError(400, `Time entry ${entry.id} is still running and cannot be billed`);
    }
  }

  const byProject = new Map<string, { project: (typeof entries)[number]["project"]; entries: typeof entries }>();
  for (const entry of entries) {
    const group = byProject.get(entry.projectId);
    if (group) group.entries.push(entry);
    else byProject.set(entry.projectId, { project: entry.project, entries: [entry] });
  }

  const lineItemsData = Array.from(byProject.values()).map(({ project, entries: projectEntries }) => {
    const totalMinutes = projectEntries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
    const hours = Math.round((totalMinutes / 60) * 100) / 100;
    const rate = Number(project.rate);
    const amount = Math.round(hours * rate * 100) / 100;
    return {
      projectId: project.id,
      description: project.name,
      hours,
      rate,
      amount,
      entryIds: projectEntries.map((e) => e.id),
    };
  });

  const subtotal = Math.round(lineItemsData.reduce((sum, li) => sum + li.amount, 0) * 100) / 100;
  const invoiceNumber = await nextInvoiceNumber();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const invoiceId = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: input.clientId,
        status: "DRAFT",
        dueDate,
        subtotal,
        tax: 0,
        total: subtotal,
        createdById,
      },
    });

    for (const li of lineItemsData) {
      const lineItem = await tx.invoiceLineItem.create({
        data: {
          invoiceId: invoice.id,
          projectId: li.projectId,
          description: li.description,
          hours: li.hours,
          rate: li.rate,
          amount: li.amount,
        },
      });
      await tx.timeEntry.updateMany({
        where: { id: { in: li.entryIds } },
        data: { billed: true, invoiceLineItemId: lineItem.id },
      });
    }

    return invoice.id;
  });

  return getInvoice(invoiceId);
}

export async function updateInvoiceStatus(id: string, input: UpdateStatusInput) {
  const invoice = await getInvoice(id);
  if (invoice.status === "PAID") {
    throw new ApiError(409, "Cannot change the status of a paid invoice");
  }
  return prisma.invoice.update({ where: { id }, data: { status: input.status }, include: invoiceInclude });
}

export async function sendInvoice(id: string) {
  const invoice = await getInvoice(id);
  if (invoice.status === "PAID" || invoice.status === "VOID") {
    throw new ApiError(409, `Cannot send an invoice with status ${invoice.status}`);
  }

  const pdfBuffer = await generateInvoicePdfBuffer(invoice);
  await sendMail({
    to: invoice.client.email,
    subject: `Invoice ${invoice.invoiceNumber}`,
    text: `Please find attached invoice ${invoice.invoiceNumber} for $${Number(invoice.total).toFixed(2)}, due ${invoice.dueDate.toDateString()}.`,
    attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdfBuffer }],
  });

  return prisma.invoice.update({ where: { id }, data: { status: "SENT" }, include: invoiceInclude });
}
