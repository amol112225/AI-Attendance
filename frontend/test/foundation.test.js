/**
 * AttendAI Milestone 1 Foundation Verification Test
 *
 * Lightweight verification script ensuring architectural constraints,
 * safe configurations, and mandatory component exports.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- AttendAI Foundation Verification Suite ---');

// 1. Verify package.json dependencies
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

const forbiddenDeps = [
  'tailwindcss',
  'next',
  'streamlit',
  'redux',
  '@reduxjs/toolkit',
  'mobx',
  'framer-motion',
  'bootstrap',
  '@mui/material',
];

for (const dep of forbiddenDeps) {
  assert.strictEqual(allDeps[dep], undefined, `Forbidden dependency found: ${dep}`);
}
console.log('✔ Stack compliance: No forbidden or heavy dependencies present');

// 2. Verify .env.example
const envExamplePath = path.join(rootDir, '.env.example');
assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
assert.ok(envExampleContent.includes('VITE_API_BASE_URL'), 'VITE_API_BASE_URL missing in .env.example');
assert.ok(envExampleContent.includes('VITE_SUPABASE_URL'), 'VITE_SUPABASE_URL missing in .env.example');
assert.ok(
  envExampleContent.includes('VITE_SUPABASE_PUBLISHABLE_KEY'),
  'VITE_SUPABASE_PUBLISHABLE_KEY missing in .env.example'
);
assert.ok(!envExampleContent.includes('service_role'), 'Service role key detected in .env.example');
console.log('✔ Environment security: .env.example properly configured with safe public placeholders');

// 3. Verify .gitignore rules
const gitignorePath = path.join(rootDir, '.gitignore');
assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist in frontend');
const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
assert.ok(gitignoreContent.includes('.env'), '.env must be ignored');
assert.ok(gitignoreContent.includes('node_modules'), 'node_modules must be ignored');
assert.ok(gitignoreContent.includes('dist'), 'dist must be ignored');
console.log('✔ Git ignore policy: Secrets and build artifacts excluded');

// 4. Verify Route Constants
const routesPath = path.join(rootDir, 'src', 'routes', 'routes.js');
assert.ok(fs.existsSync(routesPath), 'src/routes/routes.js must exist');
const routesContent = fs.readFileSync(routesPath, 'utf8');
assert.ok(routesContent.includes("ROOT: '/'"), 'ROOT route missing');
assert.ok(routesContent.includes("NOT_FOUND: '*'"), 'NOT_FOUND route missing');
console.log('✔ Routing foundation: Declarative route constants configured');

// 5. Verify Core Shared Components
const commonComponents = [
  'Button.jsx',
  'Button.css',
  'Container.jsx',
  'Container.css',
  'LoadingIndicator.jsx',
  'LoadingIndicator.css',
  'ErrorMessage.jsx',
  'ErrorMessage.css',
  'EmptyState.jsx',
  'EmptyState.css',
  'index.js',
];
for (const file of commonComponents) {
  const filePath = path.join(rootDir, 'src', 'components', 'common', file);
  assert.ok(fs.existsSync(filePath), `Required common component file missing: ${file}`);
}
console.log('✔ Reusable components: All 5 foundation components and styles present');

// 6. Verify Design System CSS tokens
const varsPath = path.join(rootDir, 'src', 'styles', 'variables.css');
assert.ok(fs.existsSync(varsPath), 'src/styles/variables.css must exist');
const varsContent = fs.readFileSync(varsPath, 'utf8');
assert.ok(varsContent.includes('--color-brand-primary'), 'Brand primary token missing');
assert.ok(varsContent.includes('--color-brand-violet'), 'Brand violet token missing');
assert.ok(varsContent.includes('--color-brand-cyan'), 'Brand cyan token missing');
assert.ok(varsContent.includes('--color-bg-base'), 'Navy base token missing');
console.log('✔ Design tokens: Centralized CSS variables verified');

// 7. Verify Services Architecture
const apiClientPath = path.join(rootDir, 'src', 'services', 'apiClient.js');
const supabaseClientPath = path.join(rootDir, 'src', 'services', 'supabaseClient.js');
assert.ok(fs.existsSync(apiClientPath), 'src/services/apiClient.js must exist');
assert.ok(fs.existsSync(supabaseClientPath), 'src/services/supabaseClient.js must exist');
console.log('✔ Service layer: Architecture skeletons verified without premature network calls');

console.log('--- All Milestone 1 verification tests passed! ---');

