-- =============================================================================
-- INCREMENTAL MIGRATION: v1.1 → v1.2
-- Shiv Furniture Works ERP
-- Applied: 2026-06
--
-- Changes:
--   1. Alter Order Status Constraints (Sales, Purchase, Manufacturing)
--   2. Add columns to stock_ledger (qty_previous, qty_new, location, reference_number)
--   3. Create notifications table
-- =============================================================================

BEGIN;

-- 1. Drop Old Constraints
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS chk_sales_status;
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS chk_purchase_status;
ALTER TABLE manufacturing_orders DROP CONSTRAINT IF EXISTS chk_mo_status;

-- 2. Update Existing Rows to New Statuses
UPDATE sales_orders SET status = 'APPROVED' WHERE status = 'CONFIRMED';
UPDATE sales_orders SET status = 'COMPLETED' WHERE status = 'SHIPPED';

UPDATE purchase_orders SET status = 'APPROVED' WHERE status = 'SENT';

UPDATE manufacturing_orders SET status = 'DRAFT' WHERE status = 'PLANNED';
UPDATE manufacturing_orders SET status = 'APPROVED' WHERE status = 'STAGED';

-- 3. Add New Constraints
ALTER TABLE sales_orders ADD CONSTRAINT chk_sales_status CHECK (status IN ('DRAFT', 'APPROVED', 'COMPLETED', 'CANCELLED'));
ALTER TABLE purchase_orders ADD CONSTRAINT chk_purchase_status CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RECEIVED', 'CANCELLED'));
ALTER TABLE manufacturing_orders ADD CONSTRAINT chk_mo_status CHECK (status IN ('DRAFT', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED'));

-- 4. Stock Ledger Enhancements
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS qty_previous NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS qty_new NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'Main Warehouse';
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);

-- Update transaction type constraints on stock_ledger
ALTER TABLE stock_ledger DROP CONSTRAINT IF EXISTS chk_ledger_tx_type;
ALTER TABLE stock_ledger ADD CONSTRAINT chk_ledger_tx_type CHECK (transaction_type IN ('RECEIPT', 'ISSUE', 'ADJUSTMENT', 'ALLOCATION', 'DEALLOCATION', 'TRANSFER'));

ALTER TABLE stock_ledger DROP CONSTRAINT IF EXISTS chk_ledger_ref_type;
ALTER TABLE stock_ledger ADD CONSTRAINT chk_ledger_ref_type CHECK (reference_type IN ('SALES_ORDER', 'PURCHASE_ORDER', 'MANUFACTURING_ORDER', 'MANUAL', 'TRANSFER'));

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(role);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

COMMIT;
