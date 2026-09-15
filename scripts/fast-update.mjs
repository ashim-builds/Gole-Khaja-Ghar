import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const deploymentDir = path.join(rootDir, 'deployment');

const updateZip = path.join(deploymentDir, 'backend-update.zip');
const stage = path.join(deploymentDir, 'update-stage');

if (fs.existsSync(stage)) fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

copyDir(path.join(rootDir, 'services/dist'), path.join(stage, 'dist'));
fs.copyFileSync(path.join(rootDir, 'services/app.js'), path.join(stage, 'app.js'));
fs.copyFileSync(path.join(rootDir, 'services/package.json'), path.join(stage, 'package.json'));

const ht = `# CloudLinux Passenger Configuration for cPanel
PassengerAppType node
PassengerStartupFile app.js
PassengerAppLogFile stderr.log
Options -Indexes
`;
fs.writeFileSync(path.join(stage, '.htaccess'), ht, 'utf8');

if (fs.existsSync(updateZip)) fs.unlinkSync(updateZip);
execSync(`tar -a -cf "${updateZip}" -C "${stage}" .`);
fs.rmSync(stage, { recursive: true, force: true });

console.log(`✓ Created backend-update.zip: ${(fs.statSync(updateZip).size / 1024).toFixed(1)} KB`);
