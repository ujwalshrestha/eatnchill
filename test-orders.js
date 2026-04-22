#!/usr/bin/env node
/**
 * Test script to verify orders are being created and retrieved properly
 */

const API_BASE = 'http://localhost:3001/api';

async function test() {
  try {
    console.log('🧪 Testing Orders API...\n');

    // 1. Get categories
    console.log('1️⃣  Fetching categories...');
    const categoriesRes = await fetch(`${API_BASE}/categories`);
    const categoriesData = await categoriesRes.json();
    const categories = categoriesData.data || [];
    console.log(`✅ Found ${categories.length} categories\n`);

    if (categories.length === 0) {
      console.log('❌ No categories found. Creating a test category...');
      const createCatRes = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Category', description: 'For testing' }),
      });
      const newCat = await createCatRes.json();
      categories.push(newCat.data);
      console.log(`✅ Created category: ${newCat.data.name}\n`);
    }

    // 2. Get food items
    console.log('2️⃣  Fetching food items...');
    const itemsRes = await fetch(`${API_BASE}/food-items`);
    const itemsData = await itemsRes.json();
    const foodItems = itemsData.data || [];
    console.log(`✅ Found ${foodItems.length} food items\n`);

    if (foodItems.length === 0) {
      console.log('❌ No food items found. Creating a test item...');
      const createItemRes = await fetch(`${API_BASE}/food-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categories[0].id,
          name: 'Test Burger',
          description: 'A delicious test burger',
          price: 12.99,
        }),
      });
      const newItem = await createItemRes.json();
      foodItems.push(newItem.data);
      console.log(`✅ Created food item: ${newItem.data.name}\n`);
    }

    // 3. Get tables
    console.log('3️⃣  Fetching tables...');
    const tablesRes = await fetch(`${API_BASE}/tables`);
    const tablesData = await tablesRes.json();
    const tables = tablesData.data || [];
    console.log(`✅ Found ${tables.length} tables\n`);

    if (tables.length === 0) {
      console.log('❌ No tables found. Creating a test table...');
      const createTableRes = await fetch(`${API_BASE}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_number: 'Test-1', seats: 4 }),
      });
      const newTable = await createTableRes.json();
      tables.push(newTable.data);
      console.log(`✅ Created table: ${newTable.data.table_number}\n`);
    }

    // 4. Create an order
    console.log('4️⃣  Creating a test order...');
    const createOrderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: tables[0].id,
        customer_name: 'Test Customer',
        notes: 'Test notes',
        items: [
          {
            food_item_id: foodItems[0].id,
            quantity: 2,
            options: [],
            special_instructions: 'No onions',
          },
        ],
      }),
    });

    if (!createOrderRes.ok) {
      const errorData = await createOrderRes.json();
      console.log('❌ Failed to create order:', errorData);
      return;
    }

    const orderData = await createOrderRes.json();
    const order = orderData.data;
    console.log(`✅ Created order #${order.id}\n`);
    console.log(`   Table: ${order.table_number}`);
    console.log(`   Customer: ${order.customer_name}`);
    console.log(`   Total: $${order.total_amount}`);
    console.log(`   Status: ${order.status}\n`);

    // 5. Get today's orders
    console.log('5️⃣  Fetching today\'s orders...');
    const today = new Date().toISOString().split('T')[0];
    const ordersRes = await fetch(`${API_BASE}/orders?date=${today}&limit=10`);
    const ordersData = await ordersRes.json();
    const todayOrders = ordersData.data || [];
    console.log(`✅ Found ${todayOrders.length} orders for ${today}\n`);

    if (todayOrders.length > 0) {
      console.log('📋 Recent Orders:');
      todayOrders.forEach((o, i) => {
        console.log(`   ${i + 1}. Order #${o.id} - Table ${o.table_number} - $${o.total_amount} - ${o.status}`);
      });
      console.log();
    }

    // 6. Update order status
    console.log('6️⃣  Updating order status to "preparing"...');
    const updateRes = await fetch(`${API_BASE}/orders/${order.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'preparing' }),
    });

    const updatedData = await updateRes.json();
    const updated = updatedData.data;
    console.log(`✅ Order #${updated.id} status: ${updated.status}\n`);

    // 7. Get daily transactions
    console.log('7️⃣  Fetching daily transactions...');
    const txRes = await fetch(`${API_BASE}/transactions/daily?date=${today}`);
    const txData = await txRes.json();
    const summary = txData.data.summary;
    console.log(`✅ Daily Summary for ${today}:`);
    console.log(`   Total Orders: ${summary.total_orders}`);
    console.log(`   Total Revenue: $${summary.total_revenue}`);
    console.log(`   Pending Orders: ${summary.pending_orders}`);
    console.log(`   Preparing: ${summary.preparing_orders}\n`);

    console.log('✅ All tests passed!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

test();
