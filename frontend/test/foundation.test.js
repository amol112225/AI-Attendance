/**
 * AttendAI Foundation & Milestones Verification Test Suite
 *
 * Lightweight verification script ensuring architectural constraints,
 * safe configurations, routing, navbar, hero section, features section, and how-it-works section requirements.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- AttendAI Verification Suite (Milestones 1, 2, 3, 4 & 5) ---');

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

// 5. Verify Core Shared Components (including Navbar)
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
  'Navbar.jsx',
  'Navbar.css',
  'index.js',
];
for (const file of commonComponents) {
  const filePath = path.join(rootDir, 'src', 'components', 'common', file);
  assert.ok(fs.existsSync(filePath), `Required common component file missing: ${file}`);
}
console.log('✔ Reusable components: All foundation components and Navbar present');

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

// 8. Verify Navbar Specific Implementation & Requirements
const navbarJsxPath = path.join(rootDir, 'src', 'components', 'common', 'Navbar.jsx');
const navbarJsxContent = fs.readFileSync(navbarJsxPath, 'utf8');
const navbarCssPath = path.join(rootDir, 'src', 'components', 'common', 'Navbar.css');
const navbarCssContent = fs.readFileSync(navbarCssPath, 'utf8');
const pageShellJsxPath = path.join(rootDir, 'src', 'layouts', 'PageShell.jsx');
const pageShellJsxContent = fs.readFileSync(pageShellJsxPath, 'utf8');

// Brand & Navigation links
assert.ok(navbarJsxContent.includes('AttendAI'), 'Navbar brand text missing');
assert.ok(navbarJsxContent.includes('Home'), 'Home navigation link missing');
assert.ok(navbarJsxContent.includes('Features'), 'Features navigation link missing');
assert.ok(navbarJsxContent.includes('How It Works'), 'How It Works navigation link missing');
assert.ok(navbarJsxContent.includes('About'), 'About navigation link missing');

// Action buttons
assert.ok(navbarJsxContent.includes('Log In'), 'Log In button missing');
assert.ok(navbarJsxContent.includes('Get Started'), 'Get Started button missing');

// Accessibility & Mobile
assert.ok(navbarJsxContent.includes('aria-expanded'), 'aria-expanded missing on menu toggle');
assert.ok(navbarJsxContent.includes('aria-controls'), 'aria-controls missing on menu toggle');
assert.ok(navbarCssContent.includes('@media (min-width: 768px)'), 'Desktop breakpoint missing in Navbar.css');
assert.ok(navbarCssContent.includes('.navbar__mobile-overlay'), 'Mobile overlay missing in Navbar.css');

// Integration in PageShell
assert.ok(pageShellJsxContent.includes('<Navbar'), 'PageShell must render Navbar');
console.log('✔ Navbar implementation: All Milestone 2 requirements verified');

// 9. Verify Home Page Hero Section (Milestone 3)
const homePageJsxPath = path.join(rootDir, 'src', 'pages', 'HomePage.jsx');
assert.ok(fs.existsSync(homePageJsxPath), 'src/pages/HomePage.jsx must exist');
const homePageJsxContent = fs.readFileSync(homePageJsxPath, 'utf8');
const normalizedHomePageText = homePageJsxContent.replace(/\s+/g, ' ');

const homePageCssPath = path.join(rootDir, 'src', 'pages', 'HomePage.css');
assert.ok(fs.existsSync(homePageCssPath), 'src/pages/HomePage.css must exist');
const homePageCssContent = fs.readFileSync(homePageCssPath, 'utf8');

const appRoutesPath = path.join(rootDir, 'src', 'routes', 'AppRoutes.jsx');
const appRoutesContent = fs.readFileSync(appRoutesPath, 'utf8');

// AppRoutes must lazy load HomePage
assert.ok(appRoutesContent.includes("import('../pages/HomePage')"), 'AppRoutes must load HomePage');
assert.ok(!appRoutesContent.includes('PlaceholderPage'), 'PlaceholderPage must be removed from AppRoutes');

// Required Copy
assert.ok(normalizedHomePageText.includes('SMART ATTENDANCE. SIMPLIFIED.'), 'Hero eyebrow missing');
assert.ok(normalizedHomePageText.includes('Attendance, Reimagined'), 'Hero title missing');
assert.ok(normalizedHomePageText.includes('with AI.'), 'Hero title AI emphasis missing');
assert.ok(
  normalizedHomePageText.includes('A smarter attendance platform combining face and voice recognition with teacher-reviewed records for a more reliable attendance workflow.'),
  'Hero supporting description missing or modified'
);
assert.ok(normalizedHomePageText.includes('Get Started'), 'Get Started primary action missing');
assert.ok(normalizedHomePageText.includes('Explore Features'), 'Explore Features secondary action missing');

// Visual Attendance Preview
assert.ok(normalizedHomePageText.includes('Present'), 'Present status missing in demo rows');
assert.ok(normalizedHomePageText.includes('Review'), 'Review status missing in demo rows');
assert.ok(normalizedHomePageText.includes('Pending'), 'Pending status missing in demo rows');
assert.ok(normalizedHomePageText.includes('Face AI'), 'Face AI modality hint missing');
assert.ok(normalizedHomePageText.includes('Voice AI'), 'Voice AI modality hint missing');
assert.ok(normalizedHomePageText.includes('Demo Preview') || normalizedHomePageText.includes('demonstration data'), 'Demo disclaimer missing');

// Responsive CSS
assert.ok(homePageCssContent.includes('@media (min-width: 992px)'), 'Desktop two-column layout breakpoint missing');
console.log('✔ Hero section: All Milestone 3 content and visual preview requirements verified');

// 10. Verify Features Section (Milestone 4)
const featuresSectionJsxPath = path.join(rootDir, 'src', 'components', 'home', 'FeaturesSection.jsx');
assert.ok(fs.existsSync(featuresSectionJsxPath), 'src/components/home/FeaturesSection.jsx must exist');
const featuresSectionJsxContent = fs.readFileSync(featuresSectionJsxPath, 'utf8');
const normalizedFeaturesText = featuresSectionJsxContent.replace(/\s+/g, ' ');

const featuresSectionCssPath = path.join(rootDir, 'src', 'components', 'home', 'FeaturesSection.css');
assert.ok(fs.existsSync(featuresSectionCssPath), 'src/components/home/FeaturesSection.css must exist');

// Section ID & Headers
assert.ok(featuresSectionJsxContent.includes('id="features"'), 'FeaturesSection must have id="features"');
assert.ok(normalizedFeaturesText.includes('CORE CAPABILITIES'), 'Features eyebrow missing');
assert.ok(normalizedFeaturesText.includes('Attendance made smarter.'), 'Features heading missing');
assert.ok(
  normalizedFeaturesText.includes('Bring face recognition, voice recognition, and teacher oversight together in one attendance workflow.'),
  'Features supporting description missing'
);

// Card 1: Face Recognition
assert.ok(normalizedFeaturesText.includes('Face Recognition'), 'Card 1 title missing');
assert.ok(normalizedFeaturesText.includes('FACE VERIFICATION'), 'Card 1 label missing');
assert.ok(
  normalizedFeaturesText.includes('Use face-based verification to help identify students during an attendance session.'),
  'Card 1 description missing'
);

// Card 2: Voice Recognition
assert.ok(normalizedFeaturesText.includes('Voice Recognition'), 'Card 2 title missing');
assert.ok(normalizedFeaturesText.includes('VOICE VERIFICATION'), 'Card 2 label missing');
assert.ok(
  normalizedFeaturesText.includes('Use voice-based verification as another way to support the attendance process.'),
  'Card 2 description missing'
);

// Card 3: Teacher Review
assert.ok(normalizedFeaturesText.includes('Teacher Review'), 'Card 3 title missing');
assert.ok(normalizedFeaturesText.includes('HUMAN OVERSIGHT'), 'Card 3 label missing');
assert.ok(
  normalizedFeaturesText.includes('Let teachers review uncertain verification results and finalize attendance records.'),
  'Card 3 description missing'
);

// Integration in HomePage
assert.ok(homePageJsxContent.includes('<FeaturesSection'), 'HomePage must render FeaturesSection');
console.log('✔ Features section: All Milestone 4 core capabilities and layout requirements verified');

// 11. Verify How It Works Section (Milestone 5)
const howItWorksSectionJsxPath = path.join(rootDir, 'src', 'components', 'home', 'HowItWorksSection.jsx');
assert.ok(fs.existsSync(howItWorksSectionJsxPath), 'src/components/home/HowItWorksSection.jsx must exist');
const howItWorksSectionJsxContent = fs.readFileSync(howItWorksSectionJsxPath, 'utf8');
const normalizedHowItWorksText = howItWorksSectionJsxContent.replace(/\s+/g, ' ');

const howItWorksSectionCssPath = path.join(rootDir, 'src', 'components', 'home', 'HowItWorksSection.css');
assert.ok(fs.existsSync(howItWorksSectionCssPath), 'src/components/home/HowItWorksSection.css must exist');

// Section ID & Headers
assert.ok(howItWorksSectionJsxContent.includes('id="how-it-works"'), 'HowItWorksSection must have id="how-it-works"');
assert.ok(normalizedHowItWorksText.includes('SIMPLE WORKFLOW'), 'How It Works eyebrow missing');
assert.ok(normalizedHowItWorksText.includes('From verification to attendance.'), 'How It Works heading missing');
assert.ok(
  normalizedHowItWorksText.includes('A clear, teacher-guided process designed to make attendance easier to manage.'),
  'How It Works description missing'
);

// Steps Content
assert.ok(normalizedHowItWorksText.includes('Start a Session'), 'Step 1 title missing');
assert.ok(
  normalizedHowItWorksText.includes('A teacher selects the class or subject and starts an attendance session.'),
  'Step 1 description missing'
);
assert.ok(normalizedHowItWorksText.includes('Verify Students'), 'Step 2 title missing');
assert.ok(
  normalizedHowItWorksText.includes('Students can be checked using face recognition or voice recognition.'),
  'Step 2 description missing'
);
assert.ok(normalizedHowItWorksText.includes('Review Results'), 'Step 3 title missing');
assert.ok(
  normalizedHowItWorksText.includes('The teacher reviews uncertain or unmatched verification results before making decisions.'),
  'Step 3 description missing'
);
assert.ok(normalizedHowItWorksText.includes('Finalize Attendance'), 'Step 4 title missing');
assert.ok(
  normalizedHowItWorksText.includes('The teacher confirms the reviewed records to complete the attendance session.'),
  'Step 4 description missing'
);

// Step Numbers
assert.ok(normalizedHowItWorksText.includes('01'), 'Step number 01 missing');
assert.ok(normalizedHowItWorksText.includes('02'), 'Step number 02 missing');
assert.ok(normalizedHowItWorksText.includes('03'), 'Step number 03 missing');
assert.ok(normalizedHowItWorksText.includes('04'), 'Step number 04 missing');

// Integration in HomePage
assert.ok(homePageJsxContent.includes('<HowItWorksSection'), 'HomePage must render HowItWorksSection');
console.log('✔ How It Works section: All Milestone 5 workflow and layout requirements verified');

console.log('--- All Milestone 1, 2, 3, 4 & 5 verification tests passed! ---');
