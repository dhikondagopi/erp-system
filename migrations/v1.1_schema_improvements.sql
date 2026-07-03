-- =============================================================================
-- INCREMENTAL MIGRATION: v1.0 → v1.1
-- Shiv Furniture Works ERP
-- Applied: 2026-06
--
-- Changes:
--   1. users            — Add is_active column
--   2. bills_of_materials — Drop UNIQUE(finished_good_id), add is_active,
--                           add UNIQUE(finished_good_id, version)
--   3. vendor_products   — New table (vendor-product mapping, pricing, lead time)
--   4. inventory         — Add qty_on_hand >= qty_reserved DB constraint
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. USERS — Add is_active column
-- ---------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

COMMENT ON COLUMN users.is_active IS
    'When FALSE the user account is deactivated. Authentication middleware must '
    'reject tokens for inactive users even if the JWT is still valid.';

-- ---------------------------------------------------------------------------
-- 2. BILLS OF MATERIALS — Support versioned BoMs
--
-- Steps:
--   a. Drop the old single-BoM-per-product unique constraint.
--   b. Add is_active to track the currently effective version.
--   c. Add composite unique constraint (finished_good_id, version).
-- ---------------------------------------------------------------------------

-- a. Drop old constraint (name from original schema)
ALTER TABLE bills_of_materials
    DROP CONSTRAINT IF EXISTS bills_of_materials_finished_good_id_key;

-- b. Add is_active with safe default (existing rows become the active version)
ALTER TABLE bills_of_materials
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- c. Add versioned unique constraint
ALTER TABLE bills_of_materials
    ADD CONSTRAINT uq_bom_finished_good_version
        UNIQUE (finished_good_id, version);

COMMENT ON COLUMN bills_of_materials.is_active IS
    'Only one BoM per finished_good_id should have is_active = TRUE at any time. '
    'Enforced at the application layer. Allows archiving old revisions without deletion.';

-- ---------------------------------------------------------------------------
-- 3. VENDOR_PRODUCTS — New table
--
-- Maps products to supplying vendors with per-vendor pricing and lead times.
-- Fixes the procurement engine "first vendor alphabetically" critical bug.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_products (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id      UUID           NOT NULL,
    product_id     UUID           NOT NULL,
    vendor_price   NUMERIC(12, 2) NOT NULL,
    lead_time_days INTEGER        NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),

    -- Foreign keys
    CONSTRAINT fk_vp_vendor
        FOREIGN KEY (vendor_id)  REFERENCES vendors(id)  ON DELETE CASCADE,
    CONSTRAINT fk_vp_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

    -- Business rules
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

CREATE INDEX IF NOT EXISTS idx_vp_vendor_id  ON vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vp_product_id ON vendor_products(product_id);

COMMENT ON TABLE vendor_products IS
    'Product-to-vendor supply mapping. vendor_price stores the negotiated unit '
    'cost for this specific vendor. lead_time_days is the expected delivery SLA. '
    'The procurement engine uses this table to route auto-generated POs.';

-- ---------------------------------------------------------------------------
-- 4. INVENTORY — Enforce qty_on_hand >= qty_reserved at DB level
--
-- The application service layer already validates this, but adding a CHECK
-- constraint provides a hard safety net against direct SQL edits or bugs.
--
-- Note: Drop any existing rows that violate this before applying in production:
--   UPDATE inventory SET qty_reserved = qty_on_hand WHERE qty_reserved > qty_on_hand;
-- ---------------------------------------------------------------------------
ALTER TABLE inventory
    ADD CONSTRAINT chk_qty_reserved_not_exceed_on_hand
        CHECK (qty_on_hand >= qty_reserved);

COMMENT ON CONSTRAINT chk_qty_reserved_not_exceed_on_hand ON inventory IS
    'Prevents the reserved quantity from exceeding physical on-hand stock. '
    'Guards against race conditions and application-layer bugs that could '
    'create phantom inventory availability.';

COMMIT;
