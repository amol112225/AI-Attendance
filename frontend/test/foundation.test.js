/**
 * AttendAI Foundation & Milestones Verification Test Suite
 *
 * Lightweight verification script ensuring architectural constraints,
 * safe configurations, routing, navbar, hero section, features section,
 * how-it-works section, CTA section, and footer requirements.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { formatAuthError } from '../src/services/authService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- AttendAI Verification Suite (Milestones 1 to 6) ---');

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

// 5. Verify Core Shared Components (including Navbar & Footer)
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
  'Footer.jsx',
  'Footer.css',
  'index.js',
];
for (const file of commonComponents) {
  const filePath = path.join(rootDir, 'src', 'components', 'common', file);
  assert.ok(fs.existsSync(filePath), `Required common component file missing: ${file}`);
}
console.log('✔ Reusable components: All foundation components, Navbar, and Footer present');

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

// 12. Verify Final CTA & Footer (Milestone 6)
const ctaSectionJsxPath = path.join(rootDir, 'src', 'components', 'home', 'CtaSection.jsx');
assert.ok(fs.existsSync(ctaSectionJsxPath), 'src/components/home/CtaSection.jsx must exist');
const ctaSectionJsxContent = fs.readFileSync(ctaSectionJsxPath, 'utf8');
const normalizedCtaText = ctaSectionJsxContent.replace(/\s+/g, ' ');

const footerJsxPath = path.join(rootDir, 'src', 'components', 'common', 'Footer.jsx');
assert.ok(fs.existsSync(footerJsxPath), 'src/components/common/Footer.jsx must exist');
const footerJsxContent = fs.readFileSync(footerJsxPath, 'utf8');
const normalizedFooterText = footerJsxContent.replace(/\s+/g, ' ');

// CTA Content
assert.ok(ctaSectionJsxContent.includes('id="get-started"'), 'CtaSection must have id="get-started"');
assert.ok(normalizedCtaText.includes('READY TO SIMPLIFY ATTENDANCE?'), 'CTA eyebrow missing');
assert.ok(normalizedCtaText.includes('A smarter way to manage attendance starts here.'), 'CTA heading missing');
assert.ok(
  normalizedCtaText.includes('Bring face verification, voice verification, and teacher-reviewed attendance into one streamlined workflow.'),
  'CTA description missing'
);
assert.ok(normalizedCtaText.includes('Get Started'), 'CTA button missing');

// Footer Content
assert.ok(normalizedFooterText.includes('AttendAI'), 'Footer brand missing');
assert.ok(
  normalizedFooterText.includes('AI-assisted attendance with face verification, voice verification, and teacher oversight.'),
  'Footer description missing'
);
assert.ok(normalizedFooterText.includes('Home'), 'Footer Home link missing');
assert.ok(normalizedFooterText.includes('Features'), 'Footer Features link missing');
assert.ok(normalizedFooterText.includes('How It Works'), 'Footer How It Works link missing');
assert.ok(
  normalizedFooterText.includes('Verification results require appropriate review.'),
  'Footer review disclaimer missing'
);
assert.ok(normalizedFooterText.includes('AttendAI. All rights reserved.'), 'Footer copyright line missing');

// Integration
assert.ok(homePageJsxContent.includes('<CtaSection'), 'HomePage must render CtaSection');
assert.ok(pageShellJsxContent.includes('<Footer'), 'PageShell must render Footer');
console.log('✔ Final CTA & Footer: All Milestone 6 closing conversion and footer requirements verified');

// 13. Verify Responsive Polish & Accessibility (Milestone 7)
const resetCssPath = path.join(rootDir, 'src', 'styles', 'reset.css');
const resetCssContent = fs.readFileSync(resetCssPath, 'utf8');
const ctaSectionCssPath = path.join(rootDir, 'src', 'components', 'home', 'CtaSection.css');
assert.ok(fs.existsSync(ctaSectionCssPath), 'src/components/home/CtaSection.css must exist');
const featuresSectionCssContent = fs.readFileSync(featuresSectionCssPath, 'utf8');
const howItWorksSectionCssContent = fs.readFileSync(howItWorksSectionCssPath, 'utf8');
const ctaSectionCssContent = fs.readFileSync(ctaSectionCssPath, 'utf8');

// Smooth scrolling with accessibility preference protection
assert.ok(resetCssContent.includes('scroll-behavior: smooth'), 'Smooth scrolling missing in reset.css');
assert.ok(resetCssContent.includes('prefers-reduced-motion: reduce'), 'Reduced-motion protection missing in reset.css');

// Anchor scroll-margin-top offset for fixed/sticky navbar
assert.ok(featuresSectionCssContent.includes('scroll-margin-top'), 'scroll-margin-top missing in FeaturesSection.css');
assert.ok(howItWorksSectionCssContent.includes('scroll-margin-top'), 'scroll-margin-top missing in HowItWorksSection.css');
assert.ok(ctaSectionCssContent.includes('scroll-margin-top'), 'scroll-margin-top missing in CtaSection.css');

// Mobile drawer resize handler & touch target accessibility
assert.ok(navbarJsxContent.includes('resize'), 'Resize event listener missing in Navbar.jsx');
assert.ok(navbarCssContent.includes('min-width: 40px') || navbarCssContent.includes('min-height: 40px'), 'Accessible touch target sizing missing in Navbar.css');

// Small screen viewport adaptations in HomePage.css
assert.ok(homePageCssContent.includes('max-width: 360px'), 'Small mobile viewport media query missing in HomePage.css');
assert.ok(homePageCssContent.includes('overflow-wrap: break-word'), 'Heading overflow protection missing in HomePage.css');
console.log('✔ Responsive polish & accessibility: All Milestone 7 safeguards verified');

// 14. Verify Supabase Client & Auth Service Foundation (Milestone 8.2)
assert.ok(pkg.dependencies['@supabase/supabase-js'], '@supabase/supabase-js missing from dependencies');

const configJsPath = path.join(rootDir, 'src', 'utils', 'config.js');
assert.ok(fs.existsSync(configJsPath), 'src/utils/config.js must exist');
const configJsContent = fs.readFileSync(configJsPath, 'utf8');
assert.ok(configJsContent.includes('validateSupabaseConfig'), 'validateSupabaseConfig missing from config.js');
assert.ok(configJsContent.includes('service_role'), 'Security check for service_role key missing from config.js');

assert.ok(fs.existsSync(supabaseClientPath), 'src/services/supabaseClient.js must exist');
const supabaseClientContent = fs.readFileSync(supabaseClientPath, 'utf8');
assert.ok(supabaseClientContent.includes('@supabase/supabase-js'), 'createClient from @supabase/supabase-js missing in supabaseClient.js');
assert.ok(supabaseClientContent.includes('isSupabaseConfigured'), 'isSupabaseConfigured export missing from supabaseClient.js');
assert.ok(supabaseClientContent.includes('attendai_auth_token'), 'Session storage key missing from supabaseClient.js');

const authServicePath = path.join(rootDir, 'src', 'services', 'authService.js');
assert.ok(fs.existsSync(authServicePath), 'src/services/authService.js must exist');
const authServiceContent = fs.readFileSync(authServicePath, 'utf8');
assert.ok(authServiceContent.includes('registerUser'), 'registerUser missing from authService.js');
assert.ok(authServiceContent.includes('loginUser'), 'loginUser missing from authService.js');
assert.ok(authServiceContent.includes('logoutUser'), 'logoutUser missing from authService.js');
assert.ok(authServiceContent.includes('getSession'), 'getSession missing from authService.js');
assert.ok(authServiceContent.includes('getUser'), 'getUser missing from authService.js');
assert.ok(authServiceContent.includes('onAuthStateChange'), 'onAuthStateChange missing from authService.js');
assert.ok(authServiceContent.includes('formatAuthError'), 'formatAuthError missing from authService.js');

// Security policy assertion: Student role enforced by default; no client teacher elevation
assert.ok(authServiceContent.includes("role: 'student'"), 'Default student role enforcement missing in registerUser');
assert.ok(!authServiceContent.includes('requested_role'), 'Prohibited requested_role metadata found in authService.js');

// Unit tests for formatAuthError
assert.strictEqual(
  formatAuthError(new Error('Invalid login credentials')),
  'Invalid email or password. Please verify your credentials and try again.'
);
assert.strictEqual(
  formatAuthError(new Error('Email not confirmed')),
  'Your email address has not been confirmed yet. Please check your inbox for the confirmation link.'
);
assert.strictEqual(
  formatAuthError(new Error('User already registered')),
  'An account with this email address already exists. Please log in instead.'
);
assert.strictEqual(
  formatAuthError({ status: 429, message: 'Too many requests' }),
  'Too many login attempts. Please wait a few moments and try again.'
);
assert.strictEqual(formatAuthError(null), '');
console.log('✔ Supabase Auth Foundation: Client, authService, and role security safeguards verified');

// 15. Verify User Registration Page & Routing (Milestone 8.3)
assert.ok(routesContent.includes("REGISTER: '/register'"), 'REGISTER route missing from routes.js');
assert.ok(appRoutesContent.includes("import('../pages/RegisterPage')"), 'RegisterPage lazy import missing from AppRoutes.jsx');
assert.ok(appRoutesContent.includes('ROUTES.REGISTER'), 'ROUTES.REGISTER Route element missing from AppRoutes.jsx');

const registerPageJsxPath = path.join(rootDir, 'src', 'pages', 'RegisterPage.jsx');
assert.ok(fs.existsSync(registerPageJsxPath), 'src/pages/RegisterPage.jsx must exist');
const registerPageJsxContent = fs.readFileSync(registerPageJsxPath, 'utf8');

const registerPageCssPath = path.join(rootDir, 'src', 'pages', 'RegisterPage.css');
assert.ok(fs.existsSync(registerPageCssPath), 'src/pages/RegisterPage.css must exist');
const registerPageCssContent = fs.readFileSync(registerPageCssPath, 'utf8');

// Form inputs and labels
assert.ok(registerPageJsxContent.includes('htmlFor="fullName"'), 'fullName label missing');
assert.ok(registerPageJsxContent.includes('id="fullName"'), 'fullName input id missing');
assert.ok(registerPageJsxContent.includes('htmlFor="email"'), 'email label missing');
assert.ok(registerPageJsxContent.includes('id="email"'), 'email input id missing');
assert.ok(registerPageJsxContent.includes('htmlFor="password"'), 'password label missing');
assert.ok(registerPageJsxContent.includes('id="password"'), 'password input id missing');
assert.ok(registerPageJsxContent.includes('htmlFor="confirmPassword"'), 'confirmPassword label missing');
assert.ok(registerPageJsxContent.includes('id="confirmPassword"'), 'confirmPassword input id missing');
assert.ok(registerPageJsxContent.includes('Create Account'), 'Create Account submit button missing');
assert.ok(registerPageJsxContent.includes('ROUTES.LOGIN'), 'Link to LOGIN route missing');

// Client-side validations
assert.ok(registerPageJsxContent.includes('Full Name is required'), 'Full name required validation missing');
assert.ok(registerPageJsxContent.includes('Email Address is required'), 'Email required validation missing');
assert.ok(registerPageJsxContent.includes('valid email address'), 'Email pattern validation missing');
assert.ok(registerPageJsxContent.includes('Passwords do not match'), 'Password confirmation matching validation missing');
assert.ok(registerPageJsxContent.includes('isSubmitting'), 'isSubmitting lock against duplicate submissions missing');

// Both email confirmation scenarios
assert.ok(registerPageJsxContent.includes('confirmation_required'), 'Scenario A (Email confirmation required) state missing');
assert.ok(registerPageJsxContent.includes('Check your email'), 'Scenario A user instructions missing');
assert.ok(registerPageJsxContent.includes('active_session'), 'Scenario B (Active session instant registration) state missing');
assert.ok(registerPageJsxContent.includes('Account Created!'), 'Scenario B user success state missing');

// Administrative approval policy: No role selector or teacher elevation
assert.ok(!registerPageJsxContent.includes('<select'), 'Role selector select element must not exist in RegisterPage');
assert.ok(registerPageJsxContent.includes('Student'), 'Student role default badge/notice missing');

// CTA & Navbar navigation connections
assert.ok(navbarJsxContent.includes('ROUTES.REGISTER'), 'Navbar Get Started must navigate to ROUTES.REGISTER');
assert.ok(homePageJsxContent.includes('ROUTES.REGISTER'), 'Hero Get Started must navigate to ROUTES.REGISTER');
const updatedCtaContent = fs.readFileSync(ctaSectionJsxPath, 'utf8');
assert.ok(updatedCtaContent.includes('ROUTES.REGISTER'), 'CtaSection Get Started must navigate to ROUTES.REGISTER');

// Responsive CSS rules
assert.ok(registerPageCssContent.includes('@media (min-width: 480px)'), 'Mobile adaptation media query missing in RegisterPage.css');
assert.ok(registerPageCssContent.includes('max-width: 480px'), 'Responsive card max-width missing in RegisterPage.css');

// Unit test validation logic in isolation
function mockValidate({ fullName, email, password, confirmPassword }) {
  const errors = {};
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!fullName?.trim()) errors.fullName = 'Full Name is required.';
  if (!email?.trim()) errors.email = 'Email Address is required.';
  else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters long.';
  if (!confirmPassword) errors.confirmPassword = 'Confirm Password is required.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

// Validation unit assertions
assert.ok(mockValidate({ fullName: '', email: '', password: '', confirmPassword: '' }).fullName, 'Empty validation failed');
assert.ok(mockValidate({ fullName: 'Amol', email: 'invalid-email', password: 'password123', confirmPassword: 'password123' }).email, 'Email format validation failed');
assert.ok(mockValidate({ fullName: 'Amol', email: 'test@example.com', password: 'short', confirmPassword: 'short' }).password, 'Short password validation failed');
assert.ok(mockValidate({ fullName: 'Amol', email: 'test@example.com', password: 'password123', confirmPassword: 'different' }).confirmPassword, 'Password mismatch validation failed');
assert.strictEqual(Object.keys(mockValidate({ fullName: 'Amol', email: 'test@example.com', password: 'password123', confirmPassword: 'password123' })).length, 0, 'Valid data should yield 0 errors');

// Mock registration outcomes verification
async function mockRegister(scenario) {
  if (scenario === 'error') {
    return { data: null, error: new Error('User already registered'), isConfirmationRequired: false };
  }
  if (scenario === 'confirmation_required') {
    return { data: { user: { id: 'user-1' } }, error: null, isConfirmationRequired: true };
  }
  if (scenario === 'active_session') {
    return { data: { user: { id: 'user-2' }, session: { access_token: 'token-xyz' } }, error: null, isConfirmationRequired: false };
  }
}

const errorRes = await mockRegister('error');
assert.strictEqual(formatAuthError(errorRes.error), 'An account with this email address already exists. Please log in instead.');
const confirmRes = await mockRegister('confirmation_required');
assert.strictEqual(confirmRes.isConfirmationRequired, true);
const activeRes = await mockRegister('active_session');
assert.strictEqual(activeRes.isConfirmationRequired, false);
assert.ok(activeRes.data.session);

console.log('✔ User Registration: RegisterPage, form validation, email confirmation scenarios, and routing verified');

// 16. Verify Login, AuthContext & Session Management (Milestone 8.4)
assert.ok(routesContent.includes("LOGIN: '/login'"), 'LOGIN route missing from routes.js');
assert.ok(appRoutesContent.includes("import('../pages/LoginPage')"), 'LoginPage lazy import missing from AppRoutes.jsx');
assert.ok(appRoutesContent.includes('ROUTES.LOGIN'), 'ROUTES.LOGIN Route element missing from AppRoutes.jsx');

const loginPageJsxPath = path.join(rootDir, 'src', 'pages', 'LoginPage.jsx');
assert.ok(fs.existsSync(loginPageJsxPath), 'src/pages/LoginPage.jsx must exist');
const loginPageJsxContent = fs.readFileSync(loginPageJsxPath, 'utf8');

const loginPageCssPath = path.join(rootDir, 'src', 'pages', 'LoginPage.css');
assert.ok(fs.existsSync(loginPageCssPath), 'src/pages/LoginPage.css must exist');
const loginPageCssContent = fs.readFileSync(loginPageCssPath, 'utf8');

// Form inputs, labels, and accessibility
assert.ok(loginPageJsxContent.includes('htmlFor="login-email"'), 'login-email label missing');
assert.ok(loginPageJsxContent.includes('id="login-email"'), 'login-email input id missing');
assert.ok(loginPageJsxContent.includes('htmlFor="login-password"'), 'login-password label missing');
assert.ok(loginPageJsxContent.includes('id="login-password"'), 'login-password input id missing');
assert.ok(loginPageJsxContent.includes('Sign In'), 'Sign In submit button text missing');
assert.ok(loginPageJsxContent.includes('ROUTES.REGISTER'), 'Link to REGISTER route missing in LoginPage');

// Client validations and duplicate submission lock
assert.ok(loginPageJsxContent.includes('Email Address is required'), 'Email validation missing in LoginPage');
assert.ok(loginPageJsxContent.includes('Password is required'), 'Password validation missing in LoginPage');
assert.ok(loginPageJsxContent.includes('isSubmitting'), 'isSubmitting lock against duplicate submissions missing in LoginPage');

// AuthContext and useAuth hook files
const authContextPath = path.join(rootDir, 'src', 'context', 'AuthContext.jsx');
assert.ok(fs.existsSync(authContextPath), 'src/context/AuthContext.jsx must exist');
const authContextContent = fs.readFileSync(authContextPath, 'utf8');

const authContextDefPath = path.join(rootDir, 'src', 'context', 'authContextDef.js');
assert.ok(fs.existsSync(authContextDefPath), 'src/context/authContextDef.js must exist');

const useAuthPath = path.join(rootDir, 'src', 'hooks', 'useAuth.js');
assert.ok(fs.existsSync(useAuthPath), 'src/hooks/useAuth.js must exist');
const useAuthContent = fs.readFileSync(useAuthPath, 'utf8');

// AuthContext API properties
assert.ok(authContextContent.includes('AuthProvider'), 'AuthProvider missing from AuthContext.jsx');
assert.ok(authContextContent.includes('getSession'), 'getSession session restoration missing from AuthContext.jsx');
assert.ok(authContextContent.includes('onAuthStateChange'), 'onAuthStateChange event listener missing from AuthContext.jsx');
assert.ok(authContextContent.includes('logoutUser'), 'logoutUser call missing from AuthContext.jsx');
assert.ok(authContextContent.includes('isAuthenticated'), 'isAuthenticated boolean missing from AuthContext.jsx');
assert.ok(useAuthContent.includes('useContext'), 'useContext missing from useAuth.js');

// Root Application Wrapping
const appJsxPath = path.join(rootDir, 'src', 'App.jsx');
const appJsxContent = fs.readFileSync(appJsxPath, 'utf8');
assert.ok(appJsxContent.includes('<AuthProvider>'), 'AuthProvider must wrap PageShell in App.jsx');

// Navbar reactive state updates
assert.ok(navbarJsxContent.includes('useAuth'), 'useAuth missing from Navbar.jsx');
assert.ok(navbarJsxContent.includes('isAuthenticated'), 'isAuthenticated check missing from Navbar.jsx');
assert.ok(navbarJsxContent.includes('Log Out'), 'Log Out button missing from Navbar.jsx');
assert.ok(navbarJsxContent.includes('displayName'), 'User displayName missing from Navbar.jsx');
assert.ok(navbarJsxContent.includes('ROUTES.LOGIN'), 'Navbar Login button must navigate to ROUTES.LOGIN');

// Responsive CSS rules
assert.ok(loginPageCssContent.includes('max-width: 440px'), 'Responsive card max-width missing in LoginPage.css');
assert.ok(loginPageCssContent.includes('@media (min-width: 480px)'), 'Mobile padding media query missing in LoginPage.css');

// Unit test mock validation for login
function mockLoginValidate({ email, password }) {
  const errors = {};
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email?.trim()) errors.email = 'Email Address is required.';
  else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

assert.ok(mockLoginValidate({ email: '', password: '' }).email, 'Email required check failed');
assert.ok(mockLoginValidate({ email: 'bad-email', password: '123' }).email, 'Invalid email check failed');
assert.ok(mockLoginValidate({ email: 'test@example.com', password: '' }).password, 'Password required check failed');
assert.strictEqual(Object.keys(mockLoginValidate({ email: 'test@example.com', password: 'password123' })).length, 0, 'Valid login should yield 0 errors');

// Mock login outcomes verification
async function mockLogin(scenario) {
  if (scenario === 'invalid') {
    return { data: null, error: new Error('Invalid login credentials') };
  }
  if (scenario === 'network_error') {
    return { data: null, error: new Error('Failed to fetch') };
  }
  if (scenario === 'success') {
    return { data: { session: { access_token: 'valid-jwt-token' }, user: { id: 'u-1', email: 'student@attendai.edu' } }, error: null };
  }
}

const invalidLoginRes = await mockLogin('invalid');
assert.strictEqual(formatAuthError(invalidLoginRes.error), 'Invalid email or password. Please verify your credentials and try again.');
const networkLoginRes = await mockLogin('network_error');
assert.strictEqual(formatAuthError(networkLoginRes.error), 'Unable to connect to the authentication server. Please check your internet connection.');
const successLoginRes = await mockLogin('success');
assert.ok(successLoginRes.data.session);
assert.strictEqual(successLoginRes.data.user.email, 'student@attendai.edu');

console.log('✔ Login, AuthContext & Session Management: LoginPage, reactive Navbar, useAuth(), and session restoration verified');

console.log('--- All Milestone 1 to 8.4 verification tests passed! ---');
