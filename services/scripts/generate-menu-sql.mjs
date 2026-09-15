import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const menuPath = path.join(__dirname, '../src/data/menu.json');
const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

let sql = `-- =============================================================================
-- Gole Khaja Ghar: Menu Data Import (Categories, Products, Variants)
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Insert Categories
-- -----------------------------------------------------------------------------
`;

// Build category ID map
const categoryMap = new Map();
menu.categories.forEach((cat, index) => {
  categoryMap.set(cat.name, cat.id);
  const desc = cat.nepaliName ? `${cat.nepaliName}` : '';
  const escapedName = cat.name.replace(/'/g, "\\'");
  const escapedSlug = cat.id.replace(/'/g, "\\'");
  const escapedDesc = desc.replace(/'/g, "\\'");
  const sortOrder = cat.menuPage || (index + 1);

  sql += `INSERT INTO \`categories\` (\`id\`, \`name\`, \`slug\`, \`description\`, \`sortOrder\`, \`isActive\`, \`createdAt\`, \`updatedAt\`)
VALUES ('${escapedSlug}', '${escapedName}', '${escapedSlug}', '${escapedDesc}', ${sortOrder}, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`description\` = VALUES(\`description\`), \`sortOrder\` = VALUES(\`sortOrder\`);\n`;
});

sql += `\n-- -----------------------------------------------------------------------------
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
  const isFeatured = pIdx < 6 ? 1 : 0; // First few can be featured

  sql += `INSERT INTO \`products\` (\`id\`, \`categoryId\`, \`name\`, \`slug\`, \`description\`, \`image\`, \`priceType\`, \`allowCustomWeight\`, \`trackStock\`, \`stockQuantity\`, \`lowStockAlert\`, \`isAvailable\`, \`isFeatured\`, \`createdAt\`, \`updatedAt\`)
VALUES ('${prodId}', '${catId}', '${escapedName}', '${prodSlug}', '${escapedDesc}', '${image}', 'VARIANT', 0, 0, 0, 5, 1, ${isFeatured}, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`categoryId\` = VALUES(\`categoryId\`), \`description\` = VALUES(\`description\`), \`image\` = VALUES(\`image\`), \`isAvailable\` = VALUES(\`isAvailable\`);\n`;
});

sql += `\n-- -----------------------------------------------------------------------------
-- 3. Insert Product Variants
-- -----------------------------------------------------------------------------
`;

menu.products.forEach((prod) => {
  const prodId = prod.id;
  (prod.variants || []).forEach((v, vIdx) => {
    const varId = `${prodId}-v${vIdx + 1}`.slice(0, 36);
    const escapedVarName = v.name.replace(/'/g, "\\'");
    const price = Number(v.price).toFixed(2);

    sql += `INSERT INTO \`product_variants\` (\`id\`, \`productId\`, \`name\`, \`price\`, \`isAvailable\`, \`createdAt\`, \`updatedAt\`)
VALUES ('${varId}', '${prodId}', '${escapedVarName}', ${price}, 1, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`price\` = VALUES(\`price\`), \`isAvailable\` = VALUES(\`isAvailable\`);\n`;
  });
});

sql += `\nSET FOREIGN_KEY_CHECKS = 1;
`;

const outputPath = path.join(__dirname, '../../deployment/import_menu.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Successfully generated import_menu.sql at ${outputPath} (${sql.length} bytes)`);

// Also create full_database_setup.sql combining schema + menu data
const schemaPath = path.join(__dirname, '../../deployment/schema.sql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const fullSetupPath = path.join(__dirname, '../../deployment/full_database_setup.sql');
fs.writeFileSync(fullSetupPath, `${schemaContent}\n\n${sql}`, 'utf8');
console.log(`Successfully generated full_database_setup.sql at ${fullSetupPath}`);
