-- =============================================================================
-- INCREMENTAL MIGRATION: v1.2 → v1.3
-- Shiv Furniture Works ERP - Final Enterprise Enhancements
-- Applied: 2026-06
-- =============================================================================

BEGIN;

-- 1. Create Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to maintain updated_at on warehouses
CREATE OR REPLACE TRIGGER trigger_update_warehouses_updated_at
    BEFORE UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert Default Warehouse if not present
INSERT INTO warehouses (name, code, address, is_active)
VALUES ('Main Warehouse', 'WH-MAIN', 'Primary Distribution Center', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Alter Inventory to support Multi-Warehouse
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reorder_point NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- Associate existing inventory with Main Warehouse
UPDATE inventory 
SET warehouse_id = (SELECT id FROM warehouses WHERE code = 'WH-MAIN')
WHERE warehouse_id IS NULL;

-- Make warehouse_id NOT NULL after updating existing rows
ALTER TABLE inventory ALTER COLUMN warehouse_id SET NOT NULL;

-- Populate reorder point from products for existing rows
UPDATE inventory i
SET reorder_point = p.reorder_point
FROM products p
WHERE i.product_id = p.id AND i.reorder_point = 0.00;

-- Drop unique constraint on product_id to allow a product in multiple warehouses
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_product_id_key;
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS uq_inventory_product_warehouse;

-- Add new composite unique constraint (product_id, warehouse_id)
ALTER TABLE inventory ADD CONSTRAINT uq_inventory_product_warehouse UNIQUE (product_id, warehouse_id);

-- Add warehouse_id to Stock Ledger
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;

-- Associate existing ledger rows with Main Warehouse
UPDATE stock_ledger
SET warehouse_id = (SELECT id FROM warehouses WHERE code = 'WH-MAIN')
WHERE warehouse_id IS NULL;

-- Create index for quick warehouse-aware queries
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_warehouse_id ON stock_ledger(warehouse_id);


-- 3. Create Warehouse Transfers Tables
CREATE TABLE IF NOT EXISTS warehouse_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number VARCHAR(100) UNIQUE NOT NULL,
    source_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    destination_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_transfer_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT chk_source_dest_different CHECK (source_warehouse_id <> destination_warehouse_id)
);

CREATE OR REPLACE TRIGGER trigger_update_warehouse_transfers_updated_at
    BEFORE UPDATE ON warehouse_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS warehouse_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 2) NOT NULL,
    CONSTRAINT chk_transfer_item_qty CHECK (quantity > 0.00)
);

CREATE INDEX IF NOT EXISTS idx_transfers_source ON warehouse_transfers(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_dest ON warehouse_transfers(destination_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_tid ON warehouse_transfer_items(transfer_id);


-- 4. Create Sales & Purchase Invoices
CREATE TABLE IF NOT EXISTS sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_sales_invoice_payment_status CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE')),
    CONSTRAINT chk_sales_invoice_status CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'CANCELLED')),
    CONSTRAINT chk_sales_invoice_totals CHECK (grand_total >= 0.00 AND paid_amount >= 0.00)
);

CREATE OR REPLACE TRIGGER trigger_update_sales_invoices_updated_at
    BEFORE UPDATE ON sales_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS purchase_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_purchase_invoice_payment_status CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE')),
    CONSTRAINT chk_purchase_invoice_status CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'CANCELLED')),
    CONSTRAINT chk_purchase_invoice_totals CHECK (grand_total >= 0.00 AND paid_amount >= 0.00)
);

CREATE OR REPLACE TRIGGER trigger_update_purchase_invoices_updated_at
    BEFORE UPDATE ON purchase_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_sales_invoices_so ON sales_invoices(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_po ON purchase_invoices(purchase_order_id);


-- 5. Create Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_type VARCHAR(50) NOT NULL,
    sales_invoice_id UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
    purchase_invoice_id UUID REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    transaction_reference VARCHAR(100),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_payment_invoice_type CHECK (invoice_type IN ('SALES', 'PURCHASE')),
    CONSTRAINT chk_payment_amount_positive CHECK (amount > 0.00)
);

CREATE INDEX IF NOT EXISTS idx_payments_sales_inv ON payments(sales_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_purchase_inv ON payments(purchase_invoice_id);


-- 6. Create Product Templates & Variants
CREATE TABLE IF NOT EXISTS product_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    uom VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_template_product_type CHECK (type IN ('RAW_MATERIAL', 'FINISHED_GOOD'))
);

CREATE OR REPLACE TRIGGER trigger_update_product_templates_updated_at
    BEFORE UPDATE ON product_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add template link, barcode, and variant attributes to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS parent_template_id UUID REFERENCES product_templates(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_attributes JSONB DEFAULT '{}'::jsonb;

-- Populate templates for existing products
INSERT INTO product_templates (name, description, type, category, uom)
SELECT DISTINCT name, description, type, category, uom FROM products
ON CONFLICT DO NOTHING;

-- Link products to templates
UPDATE products p
SET parent_template_id = t.id
FROM product_templates t
WHERE p.name = t.name AND p.type = t.type AND p.parent_template_id IS NULL;

-- Generate default attributes and barcode based on SKU
UPDATE products 
SET variant_attributes = '{"Color": "Standard", "Size": "Standard"}'::jsonb,
    barcode = sku
WHERE barcode IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_parent_template_id ON products(parent_template_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);


-- 7. Add Manufacturing labor and overhead costs to BOM
ALTER TABLE bills_of_materials ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE bills_of_materials ADD COLUMN IF NOT EXISTS overhead_cost NUMERIC(12, 2) DEFAULT 0.00;

COMMIT;
