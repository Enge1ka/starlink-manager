-- ============================================================
-- Starlink Manager – Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Trigger function for auto-updating "updatedAt" columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── User ────────────────────────────────────────────────────
CREATE TABLE "User" (
  "id"        TEXT PRIMARY KEY,
  "username"  TEXT NOT NULL UNIQUE,
  "password"  TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "role"      TEXT NOT NULL DEFAULT 'admin',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Customer ────────────────────────────────────────────────
CREATE TABLE "Customer" (
  "id"        TEXT PRIMARY KEY,
  "code"      TEXT NOT NULL UNIQUE,
  "name"      TEXT NOT NULL,
  "company"   TEXT,
  "phone"     TEXT,
  "email"     TEXT,
  "address"   TEXT,
  "tpin"      TEXT,
  "notes"     TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_customer_updated_at
  BEFORE UPDATE ON "Customer"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Kit ─────────────────────────────────────────────────────
CREATE TABLE "Kit" (
  "id"            TEXT PRIMARY KEY,
  "kitName"       TEXT NOT NULL,
  "serialNumber"  TEXT NOT NULL UNIQUE,
  "dishId"        TEXT,
  "routerId"      TEXT,
  "terminalId"    TEXT,
  "status"        TEXT NOT NULL DEFAULT 'Active',
  "customerId"    TEXT REFERENCES "Customer"("id"),
  "location"      TEXT,
  "installedDate" TIMESTAMPTZ,
  "billingType"   TEXT NOT NULL DEFAULT 'ClientBilling',
  "monthlyCost"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "expiryDate"    TIMESTAMPTZ,
  "notes"         TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_kit_updated_at
  BEFORE UPDATE ON "Kit"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Invoice ─────────────────────────────────────────────────
CREATE TABLE "Invoice" (
  "id"            TEXT PRIMARY KEY,
  "invoiceNumber" TEXT NOT NULL UNIQUE,
  "customerId"    TEXT NOT NULL REFERENCES "Customer"("id"),
  "issueDate"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "dueDate"       TIMESTAMPTZ NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'Pending',
  "notes"         TEXT,
  "subtotal"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discountPct"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discountAmt"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxPct"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxAmt"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amountPaid"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "balance"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_invoice_updated_at
  BEFORE UPDATE ON "Invoice"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── InvoiceItem ─────────────────────────────────────────────
CREATE TABLE "InvoiceItem" (
  "id"          TEXT PRIMARY KEY,
  "invoiceId"   TEXT NOT NULL REFERENCES "Invoice"("id") ON DELETE CASCADE,
  "code"        TEXT,
  "description" TEXT NOT NULL,
  "quantity"    DOUBLE PRECISION NOT NULL,
  "unit"        TEXT,
  "unitPrice"   DOUBLE PRECISION NOT NULL,
  "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxPct"      DOUBLE PRECISION NOT NULL DEFAULT 0,
  "nettPrice"   DOUBLE PRECISION NOT NULL
);

-- ─── Payment ─────────────────────────────────────────────────
CREATE TABLE "Payment" (
  "id"          TEXT PRIMARY KEY,
  "invoiceId"   TEXT NOT NULL REFERENCES "Invoice"("id"),
  "amount"      DOUBLE PRECISION NOT NULL,
  "paymentDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "method"      TEXT,
  "reference"   TEXT,
  "notes"       TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Settings (singleton row) ─────────────────────────────────
CREATE TABLE "Settings" (
  "id"                  TEXT PRIMARY KEY DEFAULT 'singleton',
  "companyName"         TEXT NOT NULL DEFAULT 'PrimeGrid Technologies',
  "companyAddress"      TEXT NOT NULL DEFAULT '#59 EK Park, 7th Street, Nkana West, Kitwe, Copperbelt, Zambia',
  "companyPhone"        TEXT NOT NULL DEFAULT '',
  "companyEmail"        TEXT NOT NULL DEFAULT 'Sales@primegrid.com',
  "companyLogo"         TEXT,
  "bankAccountName"     TEXT NOT NULL DEFAULT 'PRIMEGRID TECHNOLOGIES',
  "bankName"            TEXT NOT NULL DEFAULT 'Stanbic Bank Zambia Limited',
  "bankAccountNumber"   TEXT NOT NULL DEFAULT '9130008140433 (ZMW)',
  "bankBranchName"      TEXT NOT NULL DEFAULT 'Kitwe Branch',
  "bankBranchCode"      TEXT NOT NULL DEFAULT '1006',
  "bankSortCode"        TEXT NOT NULL DEFAULT '040206',
  "bankSwift"           TEXT NOT NULL DEFAULT 'SBICZMLX',
  "invoicePrefix"       TEXT NOT NULL DEFAULT 'INV',
  "invoiceNextNumber"   INTEGER NOT NULL DEFAULT 1,
  "defaultPaymentTerms" INTEGER NOT NULL DEFAULT 0,
  "defaultTaxPct"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency"            TEXT NOT NULL DEFAULT 'ZMW',
  "currencySymbol"      TEXT NOT NULL DEFAULT 'K',
  "showLogo"            BOOLEAN NOT NULL DEFAULT TRUE,
  "showBankDetails"     BOOLEAN NOT NULL DEFAULT TRUE,
  "showTaxColumn"       BOOLEAN NOT NULL DEFAULT TRUE,
  "showDiscountColumn"  BOOLEAN NOT NULL DEFAULT TRUE,
  "showUnitColumn"      BOOLEAN NOT NULL DEFAULT TRUE,
  "showCodeColumn"      BOOLEAN NOT NULL DEFAULT TRUE,
  "showShipTo"          BOOLEAN NOT NULL DEFAULT FALSE,
  "showTaxReference"    BOOLEAN NOT NULL DEFAULT FALSE,
  "showYourReference"   BOOLEAN NOT NULL DEFAULT FALSE,
  "footerText"          TEXT NOT NULL DEFAULT '',
  "expiryWarningDays1"  INTEGER NOT NULL DEFAULT 7,
  "expiryWarningDays2"  INTEGER NOT NULL DEFAULT 3,
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON "Settings"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO "Settings" ("id") VALUES ('singleton') ON CONFLICT DO NOTHING;

-- ─── AuditLog ────────────────────────────────────────────────
CREATE TABLE "AuditLog" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT,
  "userName"  TEXT,
  "action"    TEXT NOT NULL,
  "entity"    TEXT NOT NULL,
  "entityId"  TEXT,
  "details"   TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Default admin user ───────────────────────────────────────
-- Password: Admin1234!
INSERT INTO "User" ("id", "username", "password", "name", "role", "createdAt", "updatedAt")
VALUES (
  'cmpmqfmcv0000uwtnp6lm2efu',
  'admin',
  '$2b$12$ksA2QjuTxIn3g7ZmhTiICu8O/i2hXr8X5Mix308p8j1659WkPgNbG',
  'Admin',
  'admin',
  '2026-05-26T14:30:23.215Z',
  '2026-05-26T14:30:23.215Z'
) ON CONFLICT DO NOTHING;
