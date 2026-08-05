-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "defaultPaymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "defaultTaxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "invoiceNumberPrefix" TEXT NOT NULL DEFAULT 'INV-',
    "overdueReminderIntervalDays" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
