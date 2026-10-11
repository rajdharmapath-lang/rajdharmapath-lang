const { Pool } = require('pg');
const logger = require('../services/logger');

let pool;

function getPool() {
  const connectionString = process.env.SUPABASE_DATABASE_URL;
  if (!connectionString) {
    logger.error('database_configuration_missing', {
      module: 'database',
      stage: 'create_pool',
      code: 'SUPABASE_DATABASE_URL_MISSING',
    });
    throw new Error('Supabase database is not configured. Set SUPABASE_DATABASE_URL.');
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    pool.on('error', (error) => {
      logger.error('database_idle_client_error', {
        module: 'database',
        stage: 'pool_idle_client',
        error,
      });
    });
    logger.info('database_pool_initialized', { module: 'database', stage: 'create_pool' });
  }
  return pool;
}

module.exports = { getPool };