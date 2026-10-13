const { createClient } = require('@supabase/supabase-js');
const logger = require('../services/logger');

let client;

function getClient() {
  if (client) return client;

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey) {
    logger.error('supabase_configuration_missing', {
      module: 'database',
      stage: 'create_client',
      code: 'SUPABASE_API_CONFIGURATION_MISSING',
    });
    const error = new Error(
      'Supabase API is not configured. Set SUPABASE_URL and a server-side Supabase secret key.'
    );
    error.code = 'SUPABASE_API_CONFIGURATION_MISSING';
    throw error;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    const error = new Error('SUPABASE_URL must be a valid HTTPS URL.');
    error.code = 'SUPABASE_URL_INVALID';
    throw error;
  }
  if (parsedUrl.protocol !== 'https:') {
    const error = new Error('SUPABASE_URL must be a valid HTTPS URL.');
    error.code = 'SUPABASE_URL_INVALID';
    throw error;
  }

  client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  logger.info('supabase_api_client_initialized', {
    module: 'database',
    stage: 'create_client',
    supabaseHost: parsedUrl.hostname.replace(/\./g, '[.]'),
    supabasePort: parsedUrl.port ? Number(parsedUrl.port) : 443,
  });
  return client;
}

module.exports = { getClient };
