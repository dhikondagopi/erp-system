-- Enable UUID Extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigger function to automatically maintain updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 1. USERS TABLE
-- =========================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_user_role CHECK (role IN (
        'Admin', 'Sales User', 'Purchase User', 'Manufacturing User', 'Inventory Manager', 'Business Owner'
    ))
);

CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =========================================================================
-- 2. CUSTOMERS TABLE
-- =========================================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers(name);

-- =========================================================================
-- 3. VENDORS TABLE
-- =========================================================================
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trigger_update_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_vendors_email ON vendors(email);
CREATE INDEX idx_vendors_name ON vendors(name);

-- =========================================================================
-- 4. PRODUCTS TABLE
-- =========================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    procurement_type VARCHAR(50) NOT NULL,
    replenishment_strategy VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    uom VARCHAR(50) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reorder_point NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_product_type CHECK (type IN ('RAW_MATERIAL', 'FINISHED_GOOD')),
    CONSTRAINT chk_procurement_type CHECK (procurement_type IN ('PURCHASE', 'MANUFACTURE')),
    CONSTRAINT chk_replenishment_strategy CHECK (replenishment_strategy IN ('MAKE_TO_STOCK', 'MAKE_TO_ORDER')),
    CONSTRAINT chk_unit_cost_positive CHECK (unit_cost >= 0.00),
    CONSTRAINT chk_unit_price_positive CHECK (unit_price >= 0.00),
    CONSTRAINT chk_reorder_point_positive CHECK (reorder_point >= 0.00)
);

CREATE TRIGGER trigger_update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_procurement_type ON products(procurement_type);
CREATE INDEX idx_products_replenishment_strategy ON products(replenishment_strategy);

-- =========================================================================
-- 5. INVENTORY TABLE
-- =========================================================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID UNIQUE NOT NULL,
    qty_on_hand NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    qty_reserved NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    qty_incoming NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    location VARCHAR(255) NOT NULL DEFAULT 'Main Warehouse',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_qty_on_hand_positive CHECK (qty_on_hand >= 0.00),
    CONSTRAINT chk_qty_reserved_positive CHECK (qty_reserved >= 0.00),
    CONSTRAINT chk_qty_incoming_positive CHECK (qty_incoming >= 0.00),
    CONSTRAINT chk_qty_reserved_not_exceed_on_hand CHECK (qty_on_hand >= qty_reserved)
);

CREATE TRIGGER trigger_update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_inventory_product_id ON inventory(product_id);

-- =========================================================================
-- 6. SALES ORDERS TABLE
-- =========================================================================
CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_sales_status CHECK (status IN ('DRAFT', 'CONFIRMED', 'SHIPPED', 'CANCELLED')),
    CONSTRAINT chk_sales_total_positive CHECK (total_amount >= 0.00)
);

CREATE TRIGGER trigger_update_sales_orders_updated_at
    BEFORE UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_sales_order_number ON sales_orders(order_number);
CREATE INDEX idx_sales_customer_id ON sales_orders(customer_id);
CREATE INDEX idx_sales_status ON sales_orders(status);

-- =========================================================================
-- 7. SALES ORDER ITEMS TABLE
-- =========================================================================
CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    CONSTRAINT fk_so_items_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_so_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT chk_so_item_qty_positive CHECK (quantity > 0.00),
    CONSTRAINT chk_so_item_price_positive CHECK (unit_price >= 0.00)
);

CREATE INDEX idx_so_items_order_id ON sales_order_items(sales_order_id);
CREATE INDEX idx_so_items_product_id ON sales_order_items(product_id);

-- =========================================================================
-- 8. PURCHASE ORDERS TABLE
-- =========================================================================
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    vendor_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_purchase_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_purchase_status CHECK (status IN ('DRAFT', 'SENT', 'RECEIVED', 'CANCELLED')),
    CONSTRAINT chk_purchase_total_positive CHECK (total_amount >= 0.00)
);

CREATE TRIGGER trigger_update_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_purchase_order_number ON purchase_orders(order_number);
CREATE INDEX idx_purchase_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX idx_purchase_status ON purchase_orders(status);

-- =========================================================================
-- 9. PURCHASE ORDER ITEMS TABLE
-- =========================================================================
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    CONSTRAINT fk_po_items_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_po_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT chk_po_item_qty_positive CHECK (quantity > 0.00),
    CONSTRAINT chk_po_item_cost_positive CHECK (unit_cost >= 0.00)
);

CREATE INDEX idx_po_items_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product_id ON purchase_order_items(product_id);

-- =========================================================================
-- 10. BILLS OF MATERIALS (BOM) TABLE
-- =========================================================================
CREATE TABLE bills_of_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finished_good_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_bom_product FOREIGN KEY (finished_good_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_bom_finished_good_version UNIQUE (finished_good_id, version)
);

CREATE TRIGGER trigger_update_bills_of_materials_updated_at
    BEFORE UPDATE ON bills_of_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_bom_finished_good ON bills_of_materials(finished_good_id);

-- =========================================================================
-- 11. BOM ITEMS TABLE
-- =========================================================================
CREATE TABLE bom_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_id UUID NOT NULL,
    raw_material_id UUID NOT NULL,
    quantity_required NUMERIC(12, 2) NOT NULL,
    CONSTRAINT fk_bom_items_bom FOREIGN KEY (bom_id) REFERENCES bills_of_materials(id) ON DELETE CASCADE,
    CONSTRAINT fk_bom_items_material FOREIGN KEY (raw_material_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT chk_bom_item_qty_positive CHECK (quantity_required > 0.00)
);

CREATE INDEX idx_bom_items_bom_id ON bom_items(bom_id);
CREATE INDEX idx_bom_items_material_id ON bom_items(raw_material_id);

-- =========================================================================
-- 12. MANUFACTURING ORDERS TABLE
-- =========================================================================
CREATE TABLE manufacturing_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mo_number VARCHAR(100) UNIQUE NOT NULL,
    finished_good_id UUID NOT NULL,
    bom_id UUID NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    source_type VARCHAR(50),
    source_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_mo_product FOREIGN KEY (finished_good_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mo_bom FOREIGN KEY (bom_id) REFERENCES bills_of_materials(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mo_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_mo_status CHECK (status IN ('PLANNED', 'STAGED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_mo_qty_positive CHECK (quantity > 0.00)
);

CREATE TRIGGER trigger_update_manufacturing_orders_updated_at
    BEFORE UPDATE ON manufacturing_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_mo_number ON manufacturing_orders(mo_number);
CREATE INDEX idx_mo_finished_good ON manufacturing_orders(finished_good_id);
CREATE INDEX idx_mo_status ON manufacturing_orders(status);
CREATE INDEX idx_mo_source ON manufacturing_orders(source_type, source_id);

-- =========================================================================
-- 13. WORK ORDERS TABLE
-- =========================================================================
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturing_order_id UUID NOT NULL,
    operation_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    assigned_to UUID,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_wo_mo FOREIGN KEY (manufacturing_order_id) REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_wo_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_wo_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'PAUSED')),
    CONSTRAINT chk_wo_dates CHECK (start_time IS NULL OR end_time IS NULL OR start_time <= end_time)
);

CREATE TRIGGER trigger_update_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_wo_mo_id ON work_orders(manufacturing_order_id);
CREATE INDEX idx_wo_status ON work_orders(status);
CREATE INDEX idx_wo_assigned ON work_orders(assigned_to);

-- =========================================================================
-- 14. STOCK LEDGER TABLE
-- =========================================================================
CREATE TABLE stock_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    qty_change NUMERIC(12, 2) NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL,
    user_id UUID,
    reason VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_ledger_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_ledger_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_ledger_tx_type CHECK (transaction_type IN ('RECEIPT', 'ISSUE', 'ADJUSTMENT', 'ALLOCATION', 'DEALLOCATION')),
    CONSTRAINT chk_ledger_ref_type CHECK (reference_type IN ('SALES_ORDER', 'PURCHASE_ORDER', 'MANUFACTURING_ORDER', 'MANUAL')),
    CONSTRAINT chk_ledger_cost_positive CHECK (unit_cost >= 0.00)
);

CREATE INDEX idx_ledger_product ON stock_ledger(product_id);
CREATE INDEX idx_ledger_tx_type ON stock_ledger(transaction_type);
CREATE INDEX idx_ledger_created_at ON stock_ledger(created_at);

-- =========================================================================
-- 15. AUDIT LOGS TABLE
-- =========================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =========================================================================
-- 16. VENDOR PRODUCTS TABLE
-- Maps products to their supplying vendors with per-vendor pricing and lead
-- times. Used by the procurement engine to route auto-generated Purchase
-- Orders to the correct vendor and cost.
-- =========================================================================
CREATE TABLE vendor_products (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id      UUID         NOT NULL,
    product_id     UUID         NOT NULL,
    vendor_price   NUMERIC(12, 2) NOT NULL,
    lead_time_days INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT fk_vp_vendor
        FOREIGN KEY (vendor_id)  REFERENCES vendors(id)   ON DELETE CASCADE,
    CONSTRAINT fk_vp_product
        FOREIGN KEY (product_id) REFERENCES products(id)  ON DELETE CASCADE,
    CONSTRAINT uq_vp_vendor_product
        UNIQUE (vendor_id, product_id),
    CONSTRAINT chk_vp_price_positive
        CHECK (vendor_price >= 0.00),
    CONSTRAINT chk_vp_lead_time_positive
        CHECK (lead_time_days >= 0)
);

CREATE TRIGGER trigger_update_vendor_products_updated_at
    BEFORE UPDATE ON vendor_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_vp_vendor_id   ON vendor_products(vendor_id);
CREATE INDEX idx_vp_product_id  ON vendor_products(product_id);

