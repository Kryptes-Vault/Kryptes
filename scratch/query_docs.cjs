const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yhnonhusmdqeiefherbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlobm9uaHVzbWRxZWllZmhlcmJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ4MDcyMywiZXhwIjoyMDkxMDU2NzIzfQ.AbuA907WJDFKY3ykJHF0oLNSM2TK8ENkoZQlAmYAkhk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Querying all profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log(`Found ${data.length} total profiles:`);
  data.forEach((profile, index) => {
    console.log(`${index + 1}. ID: ${profile.id}, Email: ${profile.email || 'N/A'}, Username: ${profile.username || 'N/A'}`);
  });
}

run();
