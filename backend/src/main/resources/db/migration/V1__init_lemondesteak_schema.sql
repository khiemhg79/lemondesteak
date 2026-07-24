CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PAID', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "OrderDetailStatus" AS ENUM ('WAITING', 'PREPARING', 'DONE', 'SERVED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS categories (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  "categoryName" text NOT NULL,
  description text,
  image text,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS items (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  image text,
  "isAvailable" boolean NOT NULL DEFAULT true,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "categoryId" text,
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_categoryId_fkey FOREIGN KEY ("categoryId") REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS combos (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  image text,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT combos_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS roles (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  "roleName" text NOT NULL UNIQUE,
  description text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  username text NOT NULL,
  phone text NOT NULL UNIQUE,
  email text,
  password text NOT NULL,
  "isActive" boolean NOT NULL DEFAULT true,
  "lastLoginAt" timestamp with time zone,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  role "Role" NOT NULL DEFAULT 'CUSTOMER',
  "roleId" text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_roleId_fkey FOREIGN KEY ("roleId") REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS customers (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  "fullName" text NOT NULL,
  "dateOfBirth" date,
  address text,
  city text,
  district text,
  "customerType" text NOT NULL DEFAULT 'GUEST',
  "loyaltyPoints" integer NOT NULL DEFAULT 0,
  "totalSpent" numeric NOT NULL DEFAULT 0,
  "userId" text,
  "isActive" boolean NOT NULL DEFAULT true,
  phone text,
  email text,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tables (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  "tableNumber" text NOT NULL UNIQUE,
  capacity integer NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'EMPTY',
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tables_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS promotions (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  name text NOT NULL,
  type text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  "minOrderAmount" numeric NOT NULL DEFAULT 0,
  "maxDiscount" numeric,
  description text,
  "startDate" timestamp with time zone NOT NULL,
  "endDate" timestamp with time zone NOT NULL,
  "usageLimit" integer,
  "usedCount" integer NOT NULL DEFAULT 0,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promotions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS orders (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  "orderNumber" integer GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  "subTotal" numeric NOT NULL DEFAULT 0,
  "taxAmount" numeric NOT NULL DEFAULT 0,
  "serviceCharge" numeric NOT NULL DEFAULT 0,
  "discountAmount" numeric NOT NULL DEFAULT 0,
  "totalAmount" numeric NOT NULL DEFAULT 0,
  "orderStatus" text NOT NULL DEFAULT 'PENDING',
  "customerNotes" text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "tableId" text,
  "userId" text,
  "customerId" text,
  "promoCode" text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_tableId_fkey FOREIGN KEY ("tableId") REFERENCES tables(id),
  CONSTRAINT orders_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id),
  CONSTRAINT orders_customerId_fkey FOREIGN KEY ("customerId") REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  "invoiceNumber" text NOT NULL UNIQUE,
  "subTotal" numeric NOT NULL DEFAULT 0,
  "customerName" text,
  "customerTaxCode" text,
  "taxAmount" numeric NOT NULL DEFAULT 0,
  "totalAmount" numeric NOT NULL DEFAULT 0,
  "paymentMethod" text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "orderId" text,
  "customerId" text,
  "tableId" text,
  status "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
  "paidAt" timestamp with time zone,
  note text,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_orderId_fkey FOREIGN KEY ("orderId") REFERENCES orders(id),
  CONSTRAINT invoices_customerId_fkey FOREIGN KEY ("customerId") REFERENCES customers(id),
  CONSTRAINT invoices_tableId_fkey FOREIGN KEY ("tableId") REFERENCES tables(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  "paymentMethod" text NOT NULL DEFAULT 'CASH',
  amount numeric NOT NULL DEFAULT 0,
  "paidAmount" numeric NOT NULL DEFAULT 0,
  "changeAmount" numeric NOT NULL DEFAULT 0,
  "paymentStatus" text NOT NULL DEFAULT 'PENDING',
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "invoiceId" text,
  "orderId" text,
  "paidAt" timestamp with time zone,
  "transactionCode" text,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_invoiceId_fkey FOREIGN KEY ("invoiceId") REFERENCES invoices(id),
  CONSTRAINT payments_orderId_fkey FOREIGN KEY ("orderId") REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS comboitems (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  "comboId" text NOT NULL,
  "itemId" text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  CONSTRAINT comboitems_pkey PRIMARY KEY (id),
  CONSTRAINT comboitems_comboId_fkey FOREIGN KEY ("comboId") REFERENCES combos(id),
  CONSTRAINT comboitems_itemId_fkey FOREIGN KEY ("itemId") REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS customerpromotions (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  "customerId" text NOT NULL,
  "promotionId" text NOT NULL,
  "isUsed" boolean NOT NULL DEFAULT false,
  "usedAt" timestamp with time zone,
  "assignedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customerpromotions_pkey PRIMARY KEY (id),
  CONSTRAINT customerpromotions_customerId_fkey FOREIGN KEY ("customerId") REFERENCES customers(id),
  CONSTRAINT customerpromotions_promotionId_fkey FOREIGN KEY ("promotionId") REFERENCES promotions(id),
  CONSTRAINT customerpromotions_customer_promo_unique UNIQUE ("customerId", "promotionId")
);

CREATE TABLE IF NOT EXISTS orderdetails (
  id text NOT NULL DEFAULT (gen_random_uuid())::text,
  "orderId" text NOT NULL,
  "itemId" text,
  "comboId" text,
  quantity integer NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  status "OrderDetailStatus" NOT NULL DEFAULT 'WAITING',
  CONSTRAINT orderdetails_pkey PRIMARY KEY (id),
  CONSTRAINT orderdetails_orderId_fkey FOREIGN KEY ("orderId") REFERENCES orders(id),
  CONSTRAINT orderdetails_itemId_fkey FOREIGN KEY ("itemId") REFERENCES items(id),
  CONSTRAINT orderdetails_comboId_fkey FOREIGN KEY ("comboId") REFERENCES combos(id),
  CONSTRAINT orderdetails_item_or_combo_check CHECK (
    ("itemId" IS NOT NULL AND "comboId" IS NULL) OR ("itemId" IS NULL AND "comboId" IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items("categoryId");
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders("tableId", "orderStatus");
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders("customerId");
CREATE INDEX IF NOT EXISTS idx_orderdetails_order ON orderdetails("orderId");
CREATE INDEX IF NOT EXISTS idx_customerpromotions_customer ON customerpromotions("customerId");
CREATE INDEX IF NOT EXISTS idx_promotions_active_dates ON promotions("isActive", "startDate", "endDate");

INSERT INTO roles("roleName", description)
VALUES ('CUSTOMER', 'Khách hàng'), ('STAFF', 'Nhân viên'), ('ADMIN', 'Quản trị viên')
ON CONFLICT ("roleName") DO NOTHING;
