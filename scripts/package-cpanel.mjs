import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const deploymentDir = path.join(rootDir, 'deployment');
const servicesDir = path.join(rootDir, 'services');
const webDir = path.join(rootDir, 'web');

console.log('====================================================');
console.log('  Gole Khaja Ghar: cPanel Deployment Packager');
console.log('====================================================\n');

if (!fs.existsSync(deploymentDir)) {
  fs.mkdirSync(deploymentDir, { recursive: true });
}

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

// =============================================================================
// STEP 1: GENERATE DATABASE SQL (SCHEMA + MENU + RESTAURANT TABLES)
// =============================================================================
console.log('--- Step 1: Generating Database SQL Migrations & Seeds ---');

// 1.1 Extract clean MySQL schema from Prisma
console.log('Generating base schema SQL using Prisma...');
const schemaSql = execSync(
  'npx prisma migrate diff --from-empty --to-schema-datamodel services/prisma/schema.prisma --script',
  { cwd: rootDir, encoding: 'utf8' }
);
const schemaFilePath = path.join(deploymentDir, 'schema.sql');
fs.writeFileSync(schemaFilePath, schemaSql, 'utf8');
console.log(`✓ Generated schema.sql (${(schemaSql.length / 1024).toFixed(1)} KB)`);

// 1.2 Generate Menu & Tables Seed SQL
console.log('Generating seed SQL from menu.json and default restaurant tables...');
const menuPath = path.join(servicesDir, 'src/data/menu.json');
const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

let seedSql = `-- =============================================================================
-- Gole Khaja Ghar: Seed Data (Categories, Products, Variants, Tables)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Insert Categories
-- -----------------------------------------------------------------------------
`;

const categoryMap = new Map();
menu.categories.forEach((cat, index) => {
  categoryMap.set(cat.name, cat.id);
  const desc = cat.nepaliName ? `${cat.nepaliName}` : '';
  const escapedName = cat.name.replace(/'/g, "\\'");
  const escapedSlug = cat.id.replace(/'/g, "\\'");
  const escapedDesc = desc.replace(/'/g, "\\'");
  const sortOrder = cat.menuPage || (index + 1);

  seedSql += `INSERT INTO \`categories\` (\`id\`, \`name\`, \`slug\`, \`description\`, \`sortOrder\`, \`isActive\`, \`createdAt\`, \`updatedAt\`)
VALUES ('${escapedSlug}', '${escapedName}', '${escapedSlug}', '${escapedDesc}', ${sortOrder}, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`description\` = VALUES(\`description\`), \`sortOrder\` = VALUES(\`sortOrder\`);\n`;
});

seedSql += `\n-- -----------------------------------------------------------------------------
-- 2. Insert Products
-- -----------------------------------------------------------------------------
`;

menu.products.forEach((prod, pIdx) => {
  const catId = categoryMap.get(prod.category) || 'morning-breakfast';
  const prodId = prod.id;
  const prodSlug = prod.id;
  const escapedName = prod.name.replace(/'/g, "\\'");
  const nepali = prod.nepaliName ? prod.nepaliName.replace(/'/g, "\\'") : '';
  const escapedDesc = nepali;
  const image = prod.image || '/images/food/breakfast.jpg';
  const isFeatured = pIdx < 6 ? 1 : 0;

  seedSql += `INSERT INTO \`products\` (\`id\`, \`categoryId\`, \`name\`, \`slug\`, \`description\`, \`image\`, \`priceType\`, \`allowCustomWeight\`, \`trackStock\`, \`stockQuantity\`, \`lowStockAlert\`, \`isAvailable\`, \`isFeatured\`, \`createdAt\`, \`updatedAt\`)
VALUES ('${prodId}', '${catId}', '${escapedName}', '${prodSlug}', '${escapedDesc}', '${image}', 'VARIANT', 0, 0, 0, 5, 1, ${isFeatured}, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`categoryId\` = VALUES(\`categoryId\`), \`description\` = VALUES(\`description\`), \`image\` = VALUES(\`image\`), \`isAvailable\` = VALUES(\`isAvailable\`);\n`;
});

seedSql += `\n-- -----------------------------------------------------------------------------
-- 3. Insert Product Variants
-- -----------------------------------------------------------------------------
`;

menu.products.forEach((prod) => {
  const prodId = prod.id;
  (prod.variants || []).forEach((v, vIdx) => {
    const varId = `${prodId}-v${vIdx + 1}`.slice(0, 36);
    const escapedVarName = v.name.replace(/'/g, "\\'");
    const price = Number(v.price).toFixed(2);

    seedSql += `INSERT INTO \`product_variants\` (\`id\`, \`productId\`, \`name\`, \`price\`, \`isAvailable\`, \`createdAt\`, \`updatedAt\`)
VALUES ('${varId}', '${prodId}', '${escapedVarName}', ${price}, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`price\` = VALUES(\`price\`), \`isAvailable\` = VALUES(\`isAvailable\`);\n`;
  });
});

seedSql += `\n-- -----------------------------------------------------------------------------
-- 4. Insert Default Restaurant Tables (For POS & Dine-in)
-- -----------------------------------------------------------------------------
`;

for (let i = 1; i <= 10; i++) {
  const tableId = `tbl-${String(i).padStart(2, '0')}`;
  const tableNum = `T-${String(i).padStart(2, '0')}`;
  seedSql += `INSERT INTO \`restaurant_tables\` (\`id\`, \`tableNumber\`, \`capacity\`, \`status\`, \`isActive\`, \`createdAt\`, \`updatedAt\`)
VALUES ('${tableId}', '${tableNum}', 4, 'AVAILABLE', 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE \`capacity\` = VALUES(\`capacity\`), \`status\` = VALUES(\`status\`);\n`;
}

seedSql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;

const menuFilePath = path.join(deploymentDir, 'import_menu.sql');
fs.writeFileSync(menuFilePath, seedSql, 'utf8');
console.log(`✓ Generated import_menu.sql (${(seedSql.length / 1024).toFixed(1)} KB)`);

// 1.3 Combine into single complete setup file
const fullSetupSql = `${schemaSql}\n\n${seedSql}`;
const fullSetupPath = path.join(deploymentDir, 'full_database_setup.sql');
fs.writeFileSync(fullSetupPath, fullSetupSql, 'utf8');
console.log(`✓ Generated full_database_setup.sql (${(fullSetupSql.length / 1024).toFixed(1)} KB)`);

// =============================================================================
// STEP 2: BUILD & PACKAGE FRONTEND
// =============================================================================
console.log('\n--- Step 2: Building & Packaging Frontend (web/dist) ---');
execSync('npm run build', { cwd: webDir, stdio: 'inherit', shell: true });

// Ensure .htaccess for React SPA routing is in dist
const webHtaccess = path.join(webDir, 'public/.htaccess');
const distHtaccess = path.join(webDir, 'dist/.htaccess');
if (fs.existsSync(webHtaccess)) {
  fs.copyFileSync(webHtaccess, distHtaccess);
  console.log('✓ Copied .htaccess for React Router to web/dist/.htaccess');
}

const frontendZip = path.join(deploymentDir, 'frontend-dist.zip');
if (fs.existsSync(frontendZip)) fs.unlinkSync(frontendZip);
execSync(`tar -a -cf "${frontendZip}" -C "${path.join(webDir, 'dist')}" .`, { shell: true });
console.log(`✓ Frontend packaged: frontend-dist.zip (${(fs.statSync(frontendZip).size / 1024 / 1024).toFixed(2)} MB)`);

// =============================================================================
// STEP 3: BUILD & PACKAGE BACKEND
// =============================================================================
console.log('\n--- Step 3: Building & Packaging Backend (services) ---');
execSync('npm run build', { cwd: servicesDir, stdio: 'inherit', shell: true });

const stageDir = path.join(deploymentDir, 'backend-stage');
const tempProdDir = path.join(deploymentDir, 'temp_prod');

if (fs.existsSync(stageDir)) fs.rmSync(stageDir, { recursive: true, force: true });
if (fs.existsSync(tempProdDir)) fs.rmSync(tempProdDir, { recursive: true, force: true });

fs.mkdirSync(stageDir, { recursive: true });
fs.mkdirSync(tempProdDir, { recursive: true });

console.log('Copying backend compiled dist and assets...');
copyDirSync(path.join(servicesDir, 'dist'), path.join(stageDir, 'dist'));
copyDirSync(path.join(servicesDir, 'src/data'), path.join(stageDir, 'data'));
copyDirSync(path.join(servicesDir, 'prisma'), path.join(stageDir, 'prisma'));
copyDirSync(path.join(servicesDir, 'public'), path.join(stageDir, 'public'));

fs.copyFileSync(path.join(servicesDir, 'app.js'), path.join(stageDir, 'app.js'));
fs.copyFileSync(path.join(servicesDir, 'package.json'), path.join(stageDir, 'package.json'));
fs.copyFileSync(path.join(servicesDir, '.env.example'), path.join(stageDir, '.env.example'));

// Clean .htaccess for cPanel Passenger
const backendHtaccessContent = `# CloudLinux Passenger Configuration for cPanel
PassengerAppType node
PassengerStartupFile app.js
PassengerAppLogFile stderr.log
Options -Indexes
`;
fs.writeFileSync(path.join(stageDir, '.htaccess'), backendHtaccessContent, 'utf8');

// Production .env template
const prodEnvContent = `# ==============================================================================
# Gole Khaja Ghar - Production Environment Configuration
# ==============================================================================

# Database Configuration (cPanel MySQL)
# Replace golekhaj_user, YOUR_DB_PASSWORD, and golekhaj_db with your cPanel values:
DATABASE_URL="mysql://golekhaj_user:YOUR_DB_PASSWORD@localhost:3306/golekhaj_db?connection_limit=5&pool_timeout=10"

# Server Configuration
PORT=4000
NODE_ENV=production
TOKIO_WORKER_THREADS=1
UV_THREADPOOL_SIZE=2
CLIENT_URL=https://golekhajaghar.com,https://www.golekhajaghar.com

# Authentication & Security
ADMIN_PASSWORD=goleadmin
JWT_SECRET=44d83a87a84784474f62751905c637f1713b5a9f34b0070cbe71626bca16fe0f

# Web Push Notifications (VAPID)
VAPID_PUBLIC_KEY=BBnJsOM-lt98gGJfmjau9k0KaUqzUuvG2jVmaBMzk2_Gr-UnzAzpJ6ycAnF-7CUR84oFwd_t9HCe0NFDmw0PkDM
VAPID_PRIVATE_KEY=pLfsNdRPuk5SODgHA2YdwqrFsZSQ7SQIkv34degd42g
VAPID_EMAIL=mailto:admin@golekhajaghar.com

# SMTP Email Configuration (for OTP verification during registration)
# OPTION 1: Gmail SMTP (Requires 16-character Google App Password, NOT your regular password)
# NOTE: When using Gmail, SMTP_FROM email address MUST match SMTP_USER to avoid spam filtering
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
SMTP_FROM="Gole Khaja Ghar <your_gmail@gmail.com>"

# OPTION 2: cPanel Built-in Webmail (RECOMMENDED on shared hosting if Gmail port 465 is blocked by firewall)
# Create email account in cPanel -> Email Accounts (e.g. noreply@golekhajaghar.com)
# SMTP_HOST=mail.golekhajaghar.com
# SMTP_PORT=465
# SMTP_SECURE=true
# SMTP_USER=noreply@golekhajaghar.com
# SMTP_PASS=YourCPanelEmailPassword
# SMTP_FROM="Gole Khaja Ghar <noreply@golekhajaghar.com>"

# OPTION 3: cPanel Localhost Relay (Never blocked by hosting firewall)
# SMTP_HOST=localhost
# SMTP_PORT=25
# SMTP_SECURE=false
# SMTP_USER=
# SMTP_PASS=
# SMTP_FROM="Gole Khaja Ghar <noreply@golekhajaghar.com>"
`;
fs.writeFileSync(path.join(stageDir, '.env'), prodEnvContent, 'utf8');

// Production dependencies preparation
console.log('Installing production-only dependencies for bundle...');
fs.copyFileSync(path.join(servicesDir, 'package.json'), path.join(tempProdDir, 'package.json'));
execSync('npm install --omit=dev --no-audit --no-fund --ignore-scripts', { cwd: tempProdDir, stdio: 'inherit', shell: true });

console.log('Copying production node_modules to bundle...');
copyDirSync(path.join(tempProdDir, 'node_modules'), path.join(stageDir, 'node_modules'));

console.log('Injecting Prisma client with Linux binary engines...');
copyDirSync(
  path.join(servicesDir, 'node_modules/.prisma'),
  path.join(stageDir, 'node_modules/.prisma')
);

// Package backend into zip
const backendZip = path.join(deploymentDir, 'backend-deploy.zip');
if (fs.existsSync(backendZip)) fs.unlinkSync(backendZip);
console.log('Compressing backend-deploy.zip...');
execSync(`tar -a -cf "${backendZip}" -C "${stageDir}" .`, { shell: true });
console.log(`✓ Backend packaged: backend-deploy.zip (${(fs.statSync(backendZip).size / 1024 / 1024).toFixed(2)} MB)`);

// Cleanup temporary build directories
console.log('Cleaning up temporary staging directories...');
fs.rmSync(stageDir, { recursive: true, force: true });
fs.rmSync(tempProdDir, { recursive: true, force: true });

console.log('\n====================================================');
console.log('✓ DEPLOYMENT PACKAGES GENERATED SUCCESSFULLY!');
console.log('====================================================');
console.log(`Files located in: ${deploymentDir}`);
console.log('1. full_database_setup.sql -> Import into cPanel phpMyAdmin');
console.log('2. backend-deploy.zip      -> Extract into cPanel Node.js App folder');
console.log('3. frontend-dist.zip       -> Extract into cPanel public_html');
console.log('====================================================\n');
