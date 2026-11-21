const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yhnonhusmdqeiefherbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlobm9uaHVzbWRxZWllZmhlcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ4MDcyMywiZXhwIjoyMDkxMDU2NzIzfQ.AbuA907WJDFKY3ykJHF0oLNSM2TK8ENkoZQlAmYAkhk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Querying vault_items table for item_type = "zk_document"...');
  const { data, error } = await supabase
    .from('vault_items')
    .select('*')
    .eq('item_type', 'zk_document');

  if (error) {
    console.error('Error fetching vault items:', error);
    return;
  }

  console.log(`Found ${data.length} ZK document items:`);
  data.forEach((item, index) => {
    console.log(`\n--- Item ${index + 1} ---`);
    console.log(`ID: ${item.id}`);
    console.log(`User ID: ${item.user_id}`);
    console.log(`Title: ${item.title}`);
    console.log(`Item Type: ${item.item_type}`);
    console.log(`Metadata:`, JSON.stringify(item.metadata, null, 2));
    console.log(`Created At: ${item.created_at}`);
  });
}

run();
