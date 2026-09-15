import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const deploymentDir = path.join(rootDir, 'deployment');
const stageDir = path.join(deploymentDir, 'backend-stage');
const tempProdDir = path.join(deploymentDir, 'temp_prod');

console.log('--- 1. Packaging Frontend (frontend-dist.zip) ---');
const frontendZip = path.join(deploymentDir, 'frontend-dist.zip');
if (fs.existsSync(frontendZip)) fs.unlinkSync(frontendZip);
execSync(`tar -a -cf "${frontendZip}" -C "${path.join(rootDir, 'web/dist')}" .`);
console.log(`Frontend packaged successfully: ${frontendZip} (${(fs.statSync(frontendZip).size / 1024 / 1024).toFixed(2)} MB)`);

console.log('--- 2. Preparing Backend Staging Directory ---');
if (fs.existsSync(stageDir)) {
  fs.rmSync(stageDir, { recursive: true, force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy essential backend files
console.log('Copying dist...');
copyDirSync(path.join(rootDir, 'services/dist'), path.join(stageDir, 'dist'));

console.log('Copying data...');
copyDirSync(path.join(rootDir, 'services/data'), path.join(stageDir, 'data'));

console.log('Copying prisma...');
copyDirSync(path.join(rootDir, 'services/prisma'), path.join(stageDir, 'prisma'));

console.log('Copying public...');
copyDirSync(path.join(rootDir, 'services/public'), path.join(stageDir, 'public'));

console.log('Copying config files...');
fs.copyFileSync(path.join(rootDir, 'services/app.js'), path.join(stageDir, 'app.js'));
fs.copyFileSync(path.join(rootDir, 'services/package.json'), path.join(stageDir, 'package.json'));
fs.copyFileSync(path.join(rootDir, 'services/.htaccess'), path.join(stageDir, '.htaccess'));
fs.copyFileSync(path.join(rootDir, 'services/.env.example'), path.join(stageDir, '.env.example'));

// Pre-configured .env template for user
const envTemplate = `# Database Configuration (cPanel MySQL)
DATABASE_URL="mysql://golekhaj_user:YOUR_DB_PASSWORD@localhost:3306/golekhaj_db?connection_limit=5&pool_timeout=10"

# Server Configuration
PORT=4000
NODE_ENV=production
CLIENT_URL=https://golekhajaghar.com,https://www.golekhajaghar.com

# Authentication & Security
ADMIN_PASSWORD=goleadmin
JWT_SECRET=44d83a87a84784474f62751905c637f1713b5a9f34b0070cbe71626bca16fe0f

# Push Notifications
VAPID_PUBLIC_KEY=BBnJsOM-lt98gGJfmjau9k0KaUqzUuvG2jVmaBMzk2_Gr-UnzAzpJ6ycAnF-7CUR84oFwd_t9HCe0NFDmw0PkDM
VAPID_PRIVATE_KEY=pLfsNdRPuk5SODgHA2YdwqrFsZSQ7SQIkv34degd42g
VAPID_EMAIL=mailto:admin@golekhajaghar.com
`;
fs.writeFileSync(path.join(stageDir, '.env'), envTemplate, 'utf8');

// Copy production node_modules from temp_prod
console.log('Copying production node_modules...');
copyDirSync(path.join(tempProdDir, 'node_modules'), path.join(stageDir, 'node_modules'));

// Copy prisma engine binaries into .prisma/client
console.log('Copying Prisma Linux engines...');
copyDirSync(
  path.join(rootDir, 'services/node_modules/.prisma'),
  path.join(stageDir, 'node_modules/.prisma')
);

console.log('--- 3. Packaging Backend (backend-deploy.zip) ---');
const backendZip = path.join(deploymentDir, 'backend-deploy.zip');
if (fs.existsSync(backendZip)) fs.unlinkSync(backendZip);
execSync(`tar -a -cf "${backendZip}" -C "${stageDir}" .`);
console.log(`Backend packaged successfully: ${backendZip} (${(fs.statSync(backendZip).size / 1024 / 1024).toFixed(2)} MB)`);

// Cleanup temporary directories
console.log('--- 4. Cleaning up temporary files ---');
fs.rmSync(stageDir, { recursive: true, force: true });
fs.rmSync(tempProdDir, { recursive: true, force: true });
console.log('Done! All packages are fresh and ready for 1-click deployment.');
