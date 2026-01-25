import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

console.log('=== Supabase Connection Test ===\n');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Environment Check:');
console.log(`  Node.js version: ${process.version}`);
console.log(`  SUPABASE_URL: ${supabaseUrl ? 'Present' : 'Missing'}`);
console.log(`  SUPABASE_ANON_KEY: ${supabaseKey ? 'Present (length: ' + supabaseKey.length + ')' : 'Missing'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('Testing basic connectivity...');

try {
  const testUrl = new URL(supabaseUrl);
  console.log(`  Protocol: ${testUrl.protocol}`);
  console.log(`  Hostname: ${testUrl.hostname}`);
  console.log('');
} catch (error) {
  console.error('ERROR: Invalid Supabase URL format:', error.message);
  process.exit(1);
}

console.log('Creating Supabase client...');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'User-Agent': 'Sambad-Connection-Test',
    },
  },
});

console.log('Client created successfully\n');
console.log('Testing database connection...');

async function testConnection() {
  try {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('contacts')
      .select('id')
      .limit(1);

    const duration = Date.now() - startTime;

    if (error) {
      console.error('\nERROR: Database query failed');
      console.error('  Message:', error.message);
      console.error('  Details:', error.details);
      console.error('  Hint:', error.hint);
      console.error('  Code:', error.code);
      process.exit(1);
    }

    console.log(`\nSUCCESS! Connection test passed in ${duration}ms`);
    console.log('  Database is accessible and responsive');
    console.log('  Your Supabase connection is working correctly\n');
    process.exit(0);
  } catch (error) {
    console.error('\nERROR: Unexpected error during connection test');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Cause:', error.cause);
    console.error('\nTroubleshooting:');
    console.error('  1. Check your internet connection');
    console.error('  2. Verify the Supabase URL is correct');
    console.error('  3. Ensure your Supabase project is active');
    console.error('  4. Check if a firewall is blocking the connection');
    console.error('  5. Try accessing your Supabase URL in a browser\n');
    process.exit(1);
  }
}

testConnection();
