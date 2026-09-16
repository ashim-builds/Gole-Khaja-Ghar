// cPanel / Phusion Passenger entry point
process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || '1';
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '2';

const path = require('path');
const fs = require('fs');

// 1. Ensure working directory is always the application root
try {
  process.chdir(__dirname);
} catch (e) {
  // fallback
}

// 2. Load .env immediately from __dirname before any application module is loaded
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  } else {
    require('dotenv').config();
  }
} catch (e) {
  // continue
}

require('./dist/server.js');
