-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "tpin" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Kit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kitName" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "dishId" TEXT,
    "routerId" TEXT,
    "terminalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "customerId" TEXT,
    "location" TEXT,
    "installedDate" DATETIME,
    "billingType" TEXT NOT NULL DEFAULT 'ClientBilling',
    "monthlyCost" REAL NOT NULL DEFAULT 0,
    "expiryDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "discountPct" REAL NOT NULL DEFAULT 0,
    "discountAmt" REAL NOT NULL DEFAULT 0,
    "taxPct" REAL NOT NULL DEFAULT 0,
    "taxAmt" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT,
    "unitPrice" REAL NOT NULL,
    "discountPct" REAL NOT NULL DEFAULT 0,
    "taxPct" REAL NOT NULL DEFAULT 0,
    "nettPrice" REAL NOT NULL,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "companyName" TEXT NOT NULL DEFAULT 'PrimeGrid Technologies',
    "companyAddress" TEXT NOT NULL DEFAULT '#59 EK Park, 7th Street, Nkana West, Kitwe, Copperbelt, Zambia',
    "companyPhone" TEXT NOT NULL DEFAULT '',
    "companyEmail" TEXT NOT NULL DEFAULT 'Sales@primegrid.com',
    "companyLogo" TEXT,
    "bankAccountName" TEXT NOT NULL DEFAULT 'PRIMEGRID TECHNOLOGIES',
    "bankName" TEXT NOT NULL DEFAULT 'Stanbic Bank Zambia Limited',
    "bankAccountNumber" TEXT NOT NULL DEFAULT '9130008140433 (ZMW)',
    "bankBranchName" TEXT NOT NULL DEFAULT 'Kitwe Branch',
    "bankBranchCode" TEXT NOT NULL DEFAULT '1006',
    "bankSortCode" TEXT NOT NULL DEFAULT '040206',
    "bankSwift" TEXT NOT NULL DEFAULT 'SBICZMLX',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "invoiceNextNumber" INTEGER NOT NULL DEFAULT 1,
    "defaultPaymentTerms" INTEGER NOT NULL DEFAULT 0,
    "defaultTaxPct" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ZMW',
    "currencySymbol" TEXT NOT NULL DEFAULT 'K',
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showBankDetails" BOOLEAN NOT NULL DEFAULT true,
    "showTaxColumn" BOOLEAN NOT NULL DEFAULT true,
    "showDiscountColumn" BOOLEAN NOT NULL DEFAULT true,
    "showUnitColumn" BOOLEAN NOT NULL DEFAULT true,
    "showCodeColumn" BOOLEAN NOT NULL DEFAULT true,
    "showShipTo" BOOLEAN NOT NULL DEFAULT false,
    "showTaxReference" BOOLEAN NOT NULL DEFAULT false,
    "showYourReference" BOOLEAN NOT NULL DEFAULT false,
    "footerText" TEXT NOT NULL DEFAULT '',
    "expiryWarningDays1" INTEGER NOT NULL DEFAULT 7,
    "expiryWarningDays2" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Kit_serialNumber_key" ON "Kit"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
