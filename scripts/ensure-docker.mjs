import { execSync, spawn } from 'child_process';
import os from 'os';
import fs from 'fs';

function run(cmd, silent = false) {
  try {
    return execSync(cmd, { stdio: silent ? 'pipe' : 'inherit', encoding: 'utf-8' });
  } catch (err) {
    if (silent) return null;
    throw err;
  }
}

function isDockerRunning() {
  const result = run('docker info', true);
  return result !== null;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('[Docker] Checking Docker & MySQL status...');

  // 1. Check if docker CLI is available
  try {
    execSync('docker --version', { stdio: 'pipe' });
  } catch (err) {
    console.warn('[Docker] Docker CLI is not installed or not in PATH. Skipping auto-start.');
    return;
  }

  // 2. Check if Docker daemon is running
  if (!isDockerRunning()) {
    console.log('[Docker] Docker daemon is not running. Attempting to launch Docker Desktop...');
    
    if (os.platform() === 'win32') {
      const standardDockerPaths = [
        'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
        `${process.env.LOCALAPPDATA}\\Programs\\Docker\\Docker\\Docker Desktop.exe`,
      ];
      const dockerExe = standardDockerPaths.find((p) => fs.existsSync(p));
      if (dockerExe) {
        spawn(dockerExe, { detached: true, stdio: 'ignore' }).unref();
      } else {
        spawn('start', ['""', 'docker-desktop'], { shell: true, detached: true, stdio: 'ignore' }).unref();
      }
    } else if (os.platform() === 'darwin') {
      spawn('open', ['-a', 'Docker'], { detached: true, stdio: 'ignore' }).unref();
    }

    console.log('[Docker] Waiting for Docker daemon to initialize (up to 30s)...');
    let attempts = 0;
    while (!isDockerRunning() && attempts < 30) {
      await sleep(1000);
      attempts++;
    }

    if (!isDockerRunning()) {
      console.warn('⚠️ [Docker] Could not connect to Docker daemon in time. Please make sure Docker Desktop is running.');
      return;
    }
  }

  // 3. Start MySQL container
  console.log('[Docker] Starting MySQL database container (golu_mysql)...');
  try {
    execSync('docker compose up -d mysql', { stdio: 'inherit' });
  } catch (err) {
    try {
      execSync('docker-compose up -d mysql', { stdio: 'inherit' });
    } catch (e) {
      console.warn('[Docker] Failed to start mysql container via docker compose. If you are using a local MySQL service, you can ignore this.');
      return;
    }
  }

  // 4. Wait for MySQL to be ready to accept connections
  console.log('⏳ [Docker] Ensuring MySQL is healthy and ready on port 3307...');
  let healthy = false;
  for (let i = 0; i < 20; i++) {
    try {
      const inspect = execSync('docker inspect --format="{{json .State.Health.Status}}" golu_mysql', {
        stdio: 'pipe',
        encoding: 'utf-8',
      }).trim().replace(/"/g, '');

      if (inspect === 'healthy' || inspect === '') {
        healthy = true;
        break;
      }
    } catch {
      // container might be still starting
    }
    await sleep(1000);
  }

  if (healthy) {
    console.log('[Docker] MySQL container is healthy and ready on port 3307!\n');
  } else {
    console.log('[Docker] MySQL container started. Continuing...\n');
  }
}

main().catch((err) => {
  console.warn('⚠️ [Docker] Auto-start script notice:', err.message);
});
