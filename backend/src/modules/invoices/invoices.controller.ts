import { Request, Response } from "express";
import * as invoicesService from "./invoices.service";
import { generateInvoicePdfBuffer } from "../../lib/pdf/generateInvoicePdf";

export async function listHandler(_req: Request, res: Response) {
  const invoices = await invoicesService.listInvoices();
  res.json({ invoices });
}

export async function getHandler(req: Request, res: Response) {
  const invoice = await invoicesService.getInvoice(req.params.id);
  res.json({ invoice });
}

export async function generateHandler(req: Request, res: Response) {
  const invoice = await invoicesService.generateInvoice(req.body, req.user!.id);
  res.status(201).json({ invoice });
}

export async function pdfHandler(req: Request, res: Response) {
  const invoice = await invoicesService.getInvoice(req.params.id);
  const buffer = await generateInvoicePdfBuffer(invoice);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(buffer);
}

export async function sendHandler(req: Request, res: Response) {
  const invoice = await invoicesService.sendInvoice(req.params.id);
  res.json({ invoice });
}

export async function updateStatusHandler(req: Request, res: Response) {
  const invoice = await invoicesService.updateInvoiceStatus(req.params.id, req.body);
  res.json({ invoice });
}
