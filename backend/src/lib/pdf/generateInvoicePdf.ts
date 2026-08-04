import PDFDocument from "pdfkit";
import type { Client, Invoice, InvoiceLineItem } from "@prisma/client";

type InvoiceWithRelations = Invoice & { client: Client; lineItems: InvoiceLineItem[] };

export function generateInvoicePdfBuffer(invoice: InvoiceWithRelations): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("INVOICE", { align: "right" });
    doc.fontSize(10).text(invoice.invoiceNumber, { align: "right" });
    doc.moveDown(2);

    doc.fontSize(12).text(`Bill To: ${invoice.client.name}`);
    if (invoice.client.company) doc.text(invoice.client.company);
    doc.text(invoice.client.email);
    doc.moveDown();

    doc.text(`Issue Date: ${invoice.issueDate.toDateString()}`);
    doc.text(`Due Date: ${invoice.dueDate.toDateString()}`);
    doc.text(`Status: ${invoice.status}`);
    doc.moveDown();

    const tableTop = doc.y;
    doc.font("Helvetica-Bold");
    doc.text("Description", 50, tableTop);
    doc.text("Hours", 300, tableTop, { width: 60, align: "right" });
    doc.text("Rate", 370, tableTop, { width: 60, align: "right" });
    doc.text("Amount", 450, tableTop, { width: 90, align: "right" });
    doc.font("Helvetica");

    let y = tableTop + 20;
    for (const item of invoice.lineItems) {
      doc.text(item.description, 50, y, { width: 240 });
      doc.text(String(item.hours), 300, y, { width: 60, align: "right" });
      doc.text(`$${Number(item.rate).toFixed(2)}`, 370, y, { width: 60, align: "right" });
      doc.text(`$${Number(item.amount).toFixed(2)}`, 450, y, { width: 90, align: "right" });
      y += 20;
    }

    doc.moveTo(50, y).lineTo(540, y).stroke();
    y += 10;
    doc.text(`Subtotal: $${Number(invoice.subtotal).toFixed(2)}`, 370, y, { width: 170, align: "right" });
    y += 15;
    doc.text(`Tax: $${Number(invoice.tax).toFixed(2)}`, 370, y, { width: 170, align: "right" });
    y += 15;
    doc
      .font("Helvetica-Bold")
      .text(`Total: $${Number(invoice.total).toFixed(2)}`, 370, y, { width: 170, align: "right" });

    doc.end();
  });
}
