const bcrypt = require('bcryptjs');
const { pool } = require('./config/db');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Starting database seeding...');
    await client.query('BEGIN');

    // 1. Clean existing records using TRUNCATE CASCADE
    console.log('Truncating existing tables...');
    await client.query(`
      TRUNCATE TABLE 
        users, customers, vendors, products, inventory, 
        sales_orders, sales_order_items, purchase_orders, purchase_order_items, 
        bills_of_materials, bom_items, manufacturing_orders, work_orders, 
        stock_ledger, audit_logs, vendor_products 
      CASCADE;
    `);

    // 2. Hash default passwords
    const passwordHash = bcrypt.hashSync('password123', 10);

    // 3. Insert Users
    console.log('Seeding users...');
    const userInsertSql = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, role;
    `;
    const users = [
      ['admin@shivfurniture.com', passwordHash, 'Shiv', 'Kumar', 'Admin', true],
      ['sales@shivfurniture.com', passwordHash, 'Rajesh', 'Sharma', 'Sales User', true],
      ['purchase@shivfurniture.com', passwordHash, 'Amit', 'Patel', 'Purchase User', true],
      ['mfg@shivfurniture.com', passwordHash, 'Vikram', 'Singh', 'Manufacturing User', true],
      ['inventory@shivfurniture.com', passwordHash, 'Suresh', 'Verma', 'Inventory Manager', true],
      ['owner@shivfurniture.com', passwordHash, 'Gopal', 'Naidu', 'Business Owner', true]
    ];
    const seededUsers = [];
    for (const u of users) {
      const res = await client.query(userInsertSql, u);
      seededUsers.push(res.rows[0]);
    }
    console.log(`Seeded ${seededUsers.length} users.`);

    // 4. Insert Customers
    console.log('Seeding customers...');
    const customerInsertSql = `
      INSERT INTO customers (name, email, phone, address)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name;
    `;
    const customers = [
      ['Gopal Furniture House', 'gopal.furn@gmail.com', '+91 98765 43210', '12, MG Road, Bangalore'],
      ['Krishna Decorators', 'krishna.dec@outlook.com', '+91 98765 11223', '45, Residency Road, Hyderabad'],
      ['Sri Sai Agencies', 'saisales@agencies.in', '+91 91234 56789', '88, Ring Road, Chennai']
    ];
    const seededCustomers = [];
    for (const c of customers) {
      const res = await client.query(customerInsertSql, c);
      seededCustomers.push(res.rows[0]);
    }

    // 5. Insert Vendors
    console.log('Seeding vendors...');
    const vendorInsertSql = `
      INSERT INTO vendors (name, email, phone, address)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name;
    `;
    const vendors = [
      ['Timber & Logs Co.', 'orders@timberlogs.com', '+91 99988 87766', 'Timber Yard Area, Mysore'],
      ['Fasteners Unlimited', 'sales@fasteners.com', '+91 88877 76655', 'Industrial Estate, Peenya, Bangalore'],
      ['Paints & Coatings Ltd.', 'contact@paintscoat.co.in', '+91 77766 65544', 'Chemical Zone, Chennai']
    ];
    const seededVendors = [];
    for (const v of vendors) {
      const res = await client.query(vendorInsertSql, v);
      seededVendors.push(res.rows[0]);
    }

    // 6. Insert Products (Finished Goods and Raw Materials)
    console.log('Seeding products...');
    const productInsertSql = `
      INSERT INTO products (sku, name, description, type, procurement_type, replenishment_strategy, category, uom, unit_cost, unit_price, reorder_point)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, sku, name, type;
    `;
    const products = [
      // Finished Goods
      ['FG-TABLE-OAK', 'Dining Table (Oak Wood)', 'Premium solid oak wood dining table (6-seater)', 'FINISHED_GOOD', 'MANUFACTURE', 'MAKE_TO_STOCK', 'Tables', 'PCS', 8000.00, 15000.00, 5.00],
      ['FG-CHAIR-ERG', 'Office Chair (Ergonomic)', 'High-back mesh ergonomic office chair with lumbar support', 'FINISHED_GOOD', 'MANUFACTURE', 'MAKE_TO_STOCK', 'Chairs', 'PCS', 2500.00, 5000.00, 10.00],
      
      // Raw Materials
      ['RM-OAK-PLANK', 'Oak Wood Planks', 'Kiln-dried solid white oak planks 2"x6"x8\'', 'RAW_MATERIAL', 'PURCHASE', 'MAKE_TO_STOCK', 'Wood', 'CUM', 1500.00, 0.00, 20.00],
      ['RM-STL-BASE', 'Steel Frame Base', 'Pre-fabricated powder-coated black steel frame base for chairs', 'RAW_MATERIAL', 'PURCHASE', 'MAKE_TO_STOCK', 'Metal Parts', 'PCS', 800.00, 0.00, 30.00],
      ['RM-SCR-BOX', 'Screws Box (100pcs)', 'Heavy-duty wood screws box', 'RAW_MATERIAL', 'PURCHASE', 'MAKE_TO_STOCK', 'Hardware', 'BOX', 100.00, 0.00, 50.00],
      ['RM-FAB-BLUE', 'Upholstery Fabric (Blue)', 'Premium commercial-grade blue polyester fabric', 'RAW_MATERIAL', 'PURCHASE', 'MAKE_TO_STOCK', 'Textiles', 'METERS', 400.00, 0.00, 15.00]
    ];
    const seededProducts = [];
    for (const p of products) {
      const res = await client.query(productInsertSql, p);
      seededProducts.push(res.rows[0]);
    }

    // 7. Seed Inventory records and set initial quantities
    console.log('Seeding inventory records...');
    const inventoryInsertSql = `
      INSERT INTO inventory (product_id, qty_on_hand, qty_reserved, qty_incoming, location)
      VALUES ($1, $2, $3, $4, $5);
    `;
    const initialInventory = [
      ['FG-TABLE-OAK', 8.00, 0.00, 0.00, 'Main Warehouse'],
      ['FG-CHAIR-ERG', 12.00, 0.00, 0.00, 'Main Warehouse'],
      ['RM-OAK-PLANK', 25.00, 0.00, 0.00, 'Raw Material Yard'],
      ['RM-STL-BASE', 35.00, 0.00, 0.00, 'Hardware Rack A'],
      ['RM-SCR-BOX', 60.00, 0.00, 0.00, 'Hardware Rack B'],
      ['RM-FAB-BLUE', 20.00, 0.00, 0.00, 'Textile Roll Rack']
    ];
    for (const inv of initialInventory) {
      const prod = seededProducts.find(p => p.sku === inv[0]);
      await client.query(inventoryInsertSql, [prod.id, inv[1], inv[2], inv[3], inv[4]]);
    }

    // 8. Seed Vendor Product Mapping (vendor_products)
    console.log('Seeding vendor-product maps...');
    const vpInsertSql = `
      INSERT INTO vendor_products (vendor_id, product_id, vendor_price, lead_time_days)
      VALUES ($1, $2, $3, $4);
    `;
    const vendorWood = seededVendors.find(v => v.name === 'Timber & Logs Co.');
    const vendorMetal = seededVendors.find(v => v.name === 'Fasteners Unlimited');
    const vendorPaint = seededVendors.find(v => v.name === 'Paints & Coatings Ltd.');

    const prodOak = seededProducts.find(p => p.sku === 'RM-OAK-PLANK');
    const prodSteel = seededProducts.find(p => p.sku === 'RM-STL-BASE');
    const prodScrew = seededProducts.find(p => p.sku === 'RM-SCR-BOX');
    const prodFabric = seededProducts.find(p => p.sku === 'RM-FAB-BLUE');

    await client.query(vpInsertSql, [vendorWood.id, prodOak.id, 1500.00, 3]);
    await client.query(vpInsertSql, [vendorMetal.id, prodSteel.id, 800.00, 5]);
    await client.query(vpInsertSql, [vendorMetal.id, prodScrew.id, 100.00, 2]);
    await client.query(vpInsertSql, [vendorPaint.id, prodFabric.id, 400.00, 4]);

    // 9. Seed Bills of Materials (BOM)
    console.log('Seeding Bills of Materials (BOM)...');
    const bomInsertSql = `
      INSERT INTO bills_of_materials (finished_good_id, name, version, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id, finished_good_id;
    `;
    const bomItemInsertSql = `
      INSERT INTO bom_items (bom_id, raw_material_id, quantity_required)
      VALUES ($1, $2, $3);
    `;

    const productTable = seededProducts.find(p => p.sku === 'FG-TABLE-OAK');
    const productChair = seededProducts.find(p => p.sku === 'FG-CHAIR-ERG');

    // BOM for Oak Dining Table
    const tableBomRes = await client.query(bomInsertSql, [productTable.id, 'Standard Oak Table BOM', '1.0', true]);
    const tableBomId = tableBomRes.rows[0].id;
    await client.query(bomItemInsertSql, [tableBomId, prodOak.id, 4.00]);
    await client.query(bomItemInsertSql, [tableBomId, prodScrew.id, 1.00]); // 1 box screws

    // BOM for Ergonomic Chair
    const chairBomRes = await client.query(bomInsertSql, [productChair.id, 'Standard Erg Chair BOM', '1.0', true]);
    const chairBomId = chairBomRes.rows[0].id;
    await client.query(bomItemInsertSql, [chairBomId, prodSteel.id, 1.00]);
    await client.query(bomItemInsertSql, [chairBomId, prodFabric.id, 2.00]); // 2 meters
    await client.query(bomItemInsertSql, [chairBomId, prodScrew.id, 0.20]); // 0.2 box screws (20 screws)

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database seeding failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
