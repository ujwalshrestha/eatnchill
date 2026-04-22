#!/usr/bin/env node
/**
 * Test script to debug session and order creation issues
 */

const API_BASE = 'http://localhost:3001/api';

async function test() {
  try {
    console.log('🧪 Testing Session & Order Flow...\n');

    // Get a table
    console.log('1️⃣  Getting a table...');
    const tablesRes = await fetch(`${API_BASE}/tables`);
    const tablesData = await tablesRes.json();
    const table = tablesData.data[0];
    if (!table) {
      console.log('❌ No tables found');
      return;
    }
    console.log(`✅ Using Table: ${table.table_number} (ID: ${table.id})\n`);

    // Start a session
    console.log('2️⃣  Starting a table session...');
    const sessionRes = await fetch(`${API_BASE}/tables/${table.id}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const sessionData = await sessionRes.json();
    const session = sessionData.data;
    console.log(`✅ Session created`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Status: ${session.status}`);
    console.log(`   Expires at: ${session.expires_at}\n`);

    // Get food items
    console.log('3️⃣  Getting food items...');
    const itemsRes = await fetch(`${API_BASE}/food-items?available_only=true`);
    const itemsData = await itemsRes.json();
    const items = itemsData.data || [];
    if (items.length === 0) {
      console.log('❌ No food items found');
      return;
    }
    console.log(`✅ Found ${items.length} items\n`);

    // Create an order with the session
    console.log('4️⃣  Creating order with session...');
    console.log(`   Table ID: ${table.id}`);
    console.log(`   Session ID: ${session.id}`);
    const createOrderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: table.id,
        session_id: session.id,
        customer_name: 'Test Customer',
        items: [
          {
            food_item_id: items[0].id,
            quantity: 1,
            options: [],
            special_instructions: 'Test',
          },
        ],
      }),
    });

    if (!createOrderRes.ok) {
      const errorData = await createOrderRes.json();
      console.log('❌ Failed to create order:');
      console.log(`   Status: ${createOrderRes.status}`);
      console.log(`   Error: ${errorData.error || JSON.stringify(errorData)}`);
      return;
    }

    const orderData = await createOrderRes.json();
    const order = orderData.data;
    console.log(`✅ Order created successfully!`);
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Total: $${order.total_amount}\n`);

    console.log('✅ Session and order flow working correctly!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

test();
