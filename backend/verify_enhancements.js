const { pool } = require('./config/db');
const notificationService = require('./services/notificationService');
const inventoryService = require('./services/inventoryService');

async function runTests() {
  console.log('=== STARTING ENTERPRISE ENHANCEMENTS VERIFICATION ===');
  const client = await pool.connect();
  let testsFailed = 0;

  async function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
    } else {
      console.error(`❌ FAIL: ${message}`);
      testsFailed++;
    }
  }

  try {
    // ----------------------------------------------------
    // Test 1: Verify Schema Columns & Tables
    // ----------------------------------------------------
    console.log('\n--- Test 1: Database Schema Verification ---');
    
    // Check Stock Ledger columns
    const stockLedgerColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'stock_ledger' AND column_name IN ('qty_previous', 'qty_new', 'location', 'reference_number');
    `);
    assert(
      stockLedgerColumns.rows.length === 4,
      `Expected 4 new columns in stock_ledger, found ${stockLedgerColumns.rows.length}`
    );

    // Check Notifications Table
    const notificationsTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'notifications';
    `);
    assert(
      notificationsTable.rows.length === 1,
      'Notifications table exists in database schema'
    );

    // Check Purchase Orders Columns
    const poColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'purchase_orders' AND column_name = 'attachment_url';
    `);
    assert(
      poColumns.rows.length === 1,
      'Purchase Orders table contains attachment_url column'
    );

    // Check Manufacturing Orders Columns
    const moColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'manufacturing_orders' AND column_name = 'document_url';
    `);
    assert(
      moColumns.rows.length === 1,
      'Manufacturing Orders table contains document_url column'
    );

    // ----------------------------------------------------
    // Test 2: Notification Service Logic
    // ----------------------------------------------------
    console.log('\n--- Test 2: Notification Service Integration ---');
    
    // Create a mock user
    const userRes = await client.query('SELECT id, role FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.warn('⚠️ No users found in database to execute notification service tests.');
    } else {
      const mockUser = userRes.rows[0];

      // Create a test notification
      const testNotif = await notificationService.createNotification({
        user_id: mockUser.id,
        title: 'Integration Test Notification',
        message: 'This is a test message to assert persistence.',
        type: 'TEST'
      });

      assert(
        testNotif && testNotif.title === 'Integration Test Notification',
        'Successfully persisted a notification in database'
      );

      // Verify unread count is >= 1
      const unreadCount = await notificationService.getUnreadCount(mockUser);
      assert(
        unreadCount >= 1,
        `Unread count is correctly tracked (count: ${unreadCount})`
      );

      // Mark notification as read
      const readNotif = await notificationService.markAsRead(testNotif.id, mockUser);
      assert(
        readNotif && readNotif.is_read === true,
        'Successfully marked notification as read in database'
      );

      // Clean up test notification
      await client.query('DELETE FROM notifications WHERE id = $1', [testNotif.id]);
      console.log('Cleaned up test notification record.');
    }

    // ----------------------------------------------------
    // Test 3: Low Stock Trigger Verification
    // ----------------------------------------------------
    console.log('\n--- Test 3: Low Stock Notification Triggers ---');

    // Fetch a raw material to trigger shortage on
    const rawMaterial = await client.query(`
      SELECT p.id, p.name, p.sku, i.qty_on_hand, p.reorder_point
      FROM products p
      JOIN inventory i ON p.id = i.product_id
      WHERE p.type = 'RAW_MATERIAL' AND p.reorder_point > 0
      LIMIT 1;
    `);

    if (rawMaterial.rows.length === 0) {
      console.warn('⚠️ No raw materials with positive reorder_point found to test low stock triggers.');
    } else {
      const targetProduct = rawMaterial.rows[0];
      const adminUser = await client.query("SELECT id FROM users WHERE role = 'Admin' LIMIT 1");
      const adminId = adminUser.rows[0]?.id;

      if (!adminId) {
        console.warn('⚠️ Admin user account not found. Cannot proceed with inventory adjustment test.');
      } else {
        // Adjust stock below reorder point (e.g. set it to reorder_point - 1)
        const diffToTrigger = parseFloat(targetProduct.qty_on_hand) - parseFloat(targetProduct.reorder_point) + 1.0;
        
        console.log(`Product: ${targetProduct.name} (${targetProduct.sku})`);
        console.log(`Current hand: ${parseFloat(targetProduct.qty_on_hand)}, Reorder point: ${parseFloat(targetProduct.reorder_point)}`);
        console.log(`Adjusting stock by: -${diffToTrigger}`);

        // Decrease stock
        await inventoryService.removeStock(
          targetProduct.id,
          diffToTrigger,
          'MANUAL',
          null,
          adminId,
          'Verification Testing Stock Reduction'
        );

        // Verify notification is created
        const existingWarning = await client.query(`
          SELECT id, title, message 
          FROM notifications 
          WHERE type = 'LOW_STOCK' AND is_read = FALSE AND message LIKE $1;
        `, [`%(${targetProduct.sku})%`]);

        assert(
          existingWarning.rows.length > 0,
          `Successfully triggered a persistent LOW_STOCK notification: "${existingWarning.rows[0]?.message}"`
        );

        // Clean up: Add stock back and delete warning
        console.log('Restoring inventory level...');
        await inventoryService.addStock(
          targetProduct.id,
          diffToTrigger,
          'MANUAL',
          null,
          adminId,
          'Verification Testing Stock Restoration'
        );

        if (existingWarning.rows[0]) {
          await client.query('DELETE FROM notifications WHERE id = $1', [existingWarning.rows[0].id]);
        }
        console.log('Cleaned up test low-stock notification.');
      }
    }

  } catch (err) {
    console.error('Critical verification script error:', err);
    testsFailed++;
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n======================================================');
  if (testsFailed === 0) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.error(`🚨 VERIFICATION FAILED: ${testsFailed} tests failed. 🚨`);
    process.exit(1);
  }
}

runTests();
