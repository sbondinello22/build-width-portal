import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { sendMail } from "../../lib/email/mailer";
import { generateInvoicePdfBuffer } from "../../lib/pdf/generateInvoicePdf";
import { logActivity } from "../../lib/activityLog";
import { getSettings } from "../settings/settings.service";
import { GenerateInvoiceInput, UpdateInvoiceInput, UpdateStatusInput } from "./invoices.schema";

const invoiceInclude = { client: true, lineItems: true, payments: true } as const;

export function listInvoices() {
  return prisma.invoice.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } });
}

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
  if (!invoice) throw new ApiError(404, "Invoice not found");
  return invoice;
}

async function nextInvoiceNumber(prefix: string): Promise<string> {
  const count = await prisma.invoice.count();
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
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

  const settings = await getSettings();
  const subtotal = Math.round(lineItemsData.reduce((sum, li) => sum + li.amount, 0) * 100) / 100;
  const invoiceNumber = await nextInvoiceNumber(settings.invoiceNumberPrefix);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + settings.defaultPaymentTermsDays);
  const tax = Math.round(subtotal * (Number(settings.defaultTaxRate) / 100) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const invoiceId = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: input.clientId,
        status: "DRAFT",
        dueDate,
        subtotal,
        tax,
        total,
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

  const invoice = await getInvoice(invoiceId);
  await logActivity({
    userId: createdById,
    entityType: "invoice",
    entityId: invoice.id,
    action: "generated",
    message: `Invoice ${invoice.invoiceNumber} generated for ${client.name} ($${invoice.total})`,
  });
  return invoice;
}

export async function updateInvoiceStatus(id: string, input: UpdateStatusInput) {
  const invoice = await getInvoice(id);
  if (invoice.status === "PAID") {
    throw new ApiError(409, "Cannot change the status of a paid invoice");
  }
  return prisma.invoice.update({ where: { id }, data: { status: input.status }, include: invoiceInclude });
}

export async function updateInvoice(id: string, input: UpdateInvoiceInput) {
  const invoice = await getInvoice(id);
  if (invoice.status !== "DRAFT") {
    throw new ApiError(409, "Only draft invoices can be edited");
  }

  const tax = input.tax ?? Number(invoice.tax);
  const total = Math.round((Number(invoice.subtotal) + tax) * 100) / 100;

  return prisma.invoice.update({
    where: { id },
    data: {
      dueDate: input.dueDate ?? undefined,
      tax,
      total,
      notes: input.notes ?? undefined,
    },
    include: invoiceInclude,
  });
}

export async function deleteInvoice(id: string) {
  const invoice = await getInvoice(id);
  if (invoice.status !== "DRAFT") {
    throw new ApiError(409, "Only draft invoices can be deleted");
  }

  await prisma.$transaction(async (tx) => {
    await tx.timeEntry.updateMany({
      where: { invoiceLineItemId: { in: invoice.lineItems.map((li) => li.id) } },
      data: { billed: false, invoiceLineItemId: null },
    });
    await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
    await tx.invoice.delete({ where: { id } });
  });

  await logActivity({
    entityType: "invoice",
    entityId: id,
    action: "deleted",
    message: `Draft invoice ${invoice.invoiceNumber} was deleted`,
  });
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

  const updated = await prisma.invoice.update({ where: { id }, data: { status: "SENT" }, include: invoiceInclude });
  await logActivity({
    entityType: "invoice",
    entityId: updated.id,
    action: "sent",
    message: `Invoice ${updated.invoiceNumber} was emailed to ${updated.client.email}`,
  });
  return updated;
}

export async function duplicateInvoice(id: string, createdById: string) {
  const source = await getInvoice(id);
  const settings = await getSettings();

  const invoiceNumber = await nextInvoiceNumber(settings.invoiceNumberPrefix);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + settings.defaultPaymentTermsDays);

  const newInvoiceId = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: source.clientId,
        status: "DRAFT",
        dueDate,
        subtotal: source.subtotal,
        tax: source.tax,
        total: source.total,
        currency: source.currency,
        notes: source.notes,
        createdById,
      },
    });

    for (const li of source.lineItems) {
      await tx.invoiceLineItem.create({
        data: {
          invoiceId: invoice.id,
          projectId: li.projectId,
          description: li.description,
          hours: li.hours,
          rate: li.rate,
          amount: li.amount,
        },
      });
    }

    return invoice.id;
  });

  const invoice = await getInvoice(newInvoiceId);
  await logActivity({
    userId: createdById,
    entityType: "invoice",
    entityId: invoice.id,
    action: "duplicated",
    message: `Invoice ${invoice.invoiceNumber} created by repeating ${source.invoiceNumber}`,
  });
  return invoice;
}
