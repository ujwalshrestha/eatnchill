#!/usr/bin/env node
/**
 * Test script to simulate the full customer ordering flow
 */

const API_BASE = 'http://localhost:3001/api';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  try {
    console.log('🛒 Testing Full Customer Ordering Flow...\n');

    // Step 1: Get a table
    console.log('1️⃣  Customer scans QR code and loads table page...');
    const tablesRes = await fetch(`${API_BASE}/tables`);
    const tablesData = await tablesRes.json();
    const table = tablesData.data[0];
    console.log(`✅ Table loaded: ${table.table_number} (ID: ${table.id})\n`);

    // Step 2: Start session (like CustomerLayout does)
    console.log('2️⃣  Starting table session...');
    const sessionRes = await fetch(`${API_BASE}/tables/${table.id}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    let session = (await sessionRes.json()).data;
    console.log(`✅ Session started`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Expires at: ${new Date(session.expires_at).toLocaleTimeString()}\n`);

    // Step 3: Get menu
    console.log('3️⃣  Loading menu...');
    const itemsRes = await fetch(`${API_BASE}/food-items?available_only=true`);
    const items = (await itemsRes.json()).data;
    console.log(`✅ Menu loaded (${items.length} items)\n`);

    // Step 4: Simulate browsing (wait a bit)
    console.log('4️⃣  Customer browses menu for a bit...');
    await wait(2000);
    console.log(`✅ Browsing complete\n`);

    // Step 5: Refresh session (like the periodic refresh)
    console.log('5️⃣  Refreshing session (periodic refresh)...');
    const refreshRes = await fetch(`${API_BASE}/tables/${table.id}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    session = (await refreshRes.json()).data;
    console.log(`✅ Session refreshed`);
    console.log(`   New expiry: ${new Date(session.expires_at).toLocaleTimeString()}\n`);

    // Step 6: Place order
    console.log('6️⃣  Customer places order...');
    console.log(`   Using session ID: ${session.id}`);
    const orderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: table.id,
        session_id: session.id,
        customer_name: 'John Doe',
        items: [
          {
            food_item_id: items[0].id,
            quantity: 2,
            options: [],
            special_instructions: 'No extra salt',
          },
        ],
      }),
    });

    if (!orderRes.ok) {
      const errorData = await orderRes.json();
      console.log(`❌ Order failed: ${errorData.error || JSON.stringify(errorData)}`);
      process.exit(1);
    }

    const order = (await orderRes.json()).data;
    console.log(`✅ Order placed successfully!`);
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Items: ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`);
    console.log(`   Total: $${order.total_amount}\n`);

    console.log('✅ Full customer flow working perfectly!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

test();
