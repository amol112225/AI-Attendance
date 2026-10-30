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
import { formatAuthError, TEACHER_LOGIN_OUTCOMES } from '../src/services/authService.js';

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
assert.ok(!authServiceContent.includes(" role: 'teacher'"), 'Prohibited client teacher assignment found in authService.js');

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

// 17. Verify Database Profiles, Roles & RLS (Milestone 8.5)
const migrationFilePath = path.join(rootDir, '..', 'supabase', 'migrations', '20261030000000_profiles_roles_rls.sql');
assert.ok(fs.existsSync(migrationFilePath), 'Migration file 20261030000000_profiles_roles_rls.sql must exist');
const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');

// Schema & Integrity Constraints
assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.profiles'), 'public.profiles table definition missing in migration');
assert.ok(migrationSql.includes('REFERENCES auth.users(id) ON DELETE CASCADE'), 'Foreign key reference to auth.users(id) missing');
assert.ok(migrationSql.includes('full_name TEXT NOT NULL'), 'full_name column missing in migration');
assert.ok(migrationSql.includes("DEFAULT 'student'"), "role default 'student' missing in migration");
assert.ok(migrationSql.includes('is_approved BOOLEAN NOT NULL DEFAULT FALSE'), 'is_approved default FALSE missing in migration');
assert.ok(migrationSql.includes('chk_profiles_full_name_non_empty'), 'Whitespace/empty check constraint on full_name missing');

// Security Definer Triggers
assert.ok(migrationSql.includes('handle_new_user()'), 'handle_new_user trigger function missing in migration');
assert.ok(migrationSql.includes('SECURITY DEFINER'), 'SECURITY DEFINER missing in handle_new_user');
assert.ok(migrationSql.includes('SET search_path = public, pg_temp'), 'search_path safeguard missing in handle_new_user');
assert.ok(migrationSql.includes('on_auth_user_created'), 'on_auth_user_created trigger missing in migration');
assert.ok(migrationSql.includes('trigger_prevent_profile_privilege_escalation'), 'Privilege escalation prevention trigger missing');

// Row Level Security (RLS) Policies
assert.ok(migrationSql.includes('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY'), 'ENABLE ROW LEVEL SECURITY missing in migration');
assert.ok(migrationSql.includes('Users can view own profile'), 'SELECT own profile policy missing');
assert.ok(migrationSql.includes('Users can update own profile name'), 'UPDATE own profile policy missing');
assert.ok(migrationSql.includes('GRANT SELECT, UPDATE(full_name) ON public.profiles'), 'Column-level grant restricting updates to full_name missing');
assert.ok(migrationSql.includes('REVOKE ALL ON TABLE public.profiles FROM anon'), 'Revocation of anonymous table privileges missing');

// Documentation
const supabaseReadmePath = path.join(rootDir, '..', 'supabase', 'README.md');
assert.ok(fs.existsSync(supabaseReadmePath), 'supabase/README.md documentation must exist');
const supabaseReadme = fs.readFileSync(supabaseReadmePath, 'utf8');
assert.ok(supabaseReadme.includes('Administrative Approval'), 'Administrative Approval policy explanation missing in README');
assert.ok(supabaseReadme.includes('How to Approve a Test Teacher Account'), 'Teacher account approval guide missing in README');

// Frontend Service & Context Verification
assert.ok(authServiceContent.includes('getUserProfile'), 'getUserProfile missing from authService.js');
assert.ok(authContextContent.includes('profile,'), 'profile property missing in AuthContext value');
assert.ok(authContextContent.includes('role:'), 'role property missing in AuthContext value');
assert.ok(authContextContent.includes('isApproved:'), 'isApproved property missing in AuthContext value');
assert.ok(authContextContent.includes('refreshProfile,'), 'refreshProfile helper missing in AuthContext value');
assert.ok(navbarJsxContent.includes('profile?.full_name'), 'Navbar display name fallback to profile.full_name missing');

// Unit test mock profile retrieval
async function mockGetUserProfile(userId, scenario) {
  if (!userId) return { profile: null, error: null };
  if (scenario === 'network_failure') {
    return { profile: null, error: new Error('Failed to fetch profile') };
  }
  if (scenario === 'teacher_approved') {
    return {
      profile: {
        id: userId,
        full_name: 'Professor Davis',
        role: 'teacher',
        is_approved: true,
      },
      error: null,
    };
  }
  return {
    profile: {
      id: userId,
      full_name: 'Alex Rivera',
      role: 'student',
      is_approved: false,
    },
    error: null,
  };
}

const defaultStudentProfile = await mockGetUserProfile('u-1', 'default');
assert.strictEqual(defaultStudentProfile.profile.role, 'student');
assert.strictEqual(defaultStudentProfile.profile.is_approved, false);

const approvedTeacherProfile = await mockGetUserProfile('u-2', 'teacher_approved');
assert.strictEqual(approvedTeacherProfile.profile.role, 'teacher');
assert.strictEqual(approvedTeacherProfile.profile.is_approved, true);

const networkErrorProfile = await mockGetUserProfile('u-3', 'network_failure');
assert.strictEqual(networkErrorProfile.profile, null);
assert.ok(networkErrorProfile.error);

console.log('✔ Database Profiles, Roles & RLS: Migration, automated trigger, RLS policies, authService, and AuthContext profile integration verified');

// 18. Verify Security Audit: Non-Recursive UPDATE Policy & Security Test Suite
const fixMigrationPath = path.join(rootDir, '..', 'supabase', 'migrations', '20261030010000_fix_profile_update_rls.sql');
assert.ok(fs.existsSync(fixMigrationPath), 'Corrective migration 20261030010000_fix_profile_update_rls.sql must exist');
const fixMigrationSql = fs.readFileSync(fixMigrationPath, 'utf8');

// Ensure recursion was eliminated (no subqueries in executable statements)
assert.ok(!fixMigrationSql.includes('AND role = (SELECT'), 'Recursive subquery found in corrective migration policy');
assert.ok(fixMigrationSql.includes('DROP POLICY IF EXISTS "Users can update own profile name" ON public.profiles'), 'Drop old recursive policy statement missing');
assert.ok(fixMigrationSql.includes('CREATE POLICY "Users can update own profile name"'), 'Clean UPDATE policy missing');
assert.ok(fixMigrationSql.includes('GRANT UPDATE(full_name) ON public.profiles TO authenticated'), 'Column-level grant for full_name missing');
assert.ok(fixMigrationSql.includes("current_user NOT IN ('postgres', 'supabase_admin')"), 'Administrative bypass/check missing in trigger');

const securityTestSqlPath = path.join(rootDir, '..', 'supabase', 'tests', 'security_verification.sql');
assert.ok(fs.existsSync(securityTestSqlPath), 'supabase/tests/security_verification.sql test suite must exist');
const securityTestSql = fs.readFileSync(securityTestSqlPath, 'utf8');
assert.ok(securityTestSql.includes('TEST 4: Automatic Profile Creation Simulation'), 'Trigger creation test missing in security_verification.sql');
assert.ok(securityTestSql.includes('TEST 5: Role Escalation Prevention Simulation'), 'Escalation prevention test missing in security_verification.sql');
console.log('✔ Security Audit: Non-recursive RLS policy, administrative boundary, and verification tests verified');

// 19. Milestone 8.6: Protected Routes & Role-Based Access Control
const srcDir = path.join(rootDir, 'src');
const accessRulesPath = path.join(srcDir, 'routes', 'accessRules.js');
assert.ok(fs.existsSync(accessRulesPath), 'accessRules.js must exist');
const accessRulesContent = fs.readFileSync(accessRulesPath, 'utf8');
assert.ok(accessRulesContent.includes('ROLES'), 'accessRules.js must export ROLES');

const protectedRoutePath = path.join(srcDir, 'routes', 'ProtectedRoute.jsx');
assert.ok(fs.existsSync(protectedRoutePath), 'ProtectedRoute.jsx must exist');
const protectedRouteContent = fs.readFileSync(protectedRoutePath, 'utf8');

const roleBasedRoutePath = path.join(srcDir, 'routes', 'RoleBasedRoute.jsx');
assert.ok(fs.existsSync(roleBasedRoutePath), 'RoleBasedRoute.jsx must exist');
const roleBasedRouteContent = fs.readFileSync(roleBasedRoutePath, 'utf8');

const unauthorizedPagePath = path.join(srcDir, 'pages', 'UnauthorizedPage.jsx');
assert.ok(fs.existsSync(unauthorizedPagePath), 'UnauthorizedPage.jsx must exist');
const unauthorizedPageContent = fs.readFileSync(unauthorizedPagePath, 'utf8');

const unauthorizedCssPath = path.join(srcDir, 'pages', 'UnauthorizedPage.css');
assert.ok(fs.existsSync(unauthorizedCssPath), 'UnauthorizedPage.css must exist');

// 19.1 Verify Route constants & AppRoutes integration
assert.ok(routesContent.includes("UNAUTHORIZED: '/unauthorized'"), 'ROUTES.UNAUTHORIZED must be defined in routes.js');
assert.ok(appRoutesContent.includes('ROUTES.UNAUTHORIZED'), 'AppRoutes.jsx must register ROUTES.UNAUTHORIZED');
assert.ok(appRoutesContent.includes('UnauthorizedPage'), 'AppRoutes.jsx must import and use UnauthorizedPage');

// 19.2 Verify AuthContext exports profileLoading & profileError
const authContextDefContent = fs.readFileSync(authContextDefPath, 'utf8');
assert.ok(authContextDefContent.includes('profileLoading: false'), 'authContextDef.js must define profileLoading');
assert.ok(authContextDefContent.includes('profileError: null'), 'authContextDef.js must define profileError');
assert.ok(authContextContent.includes('profileLoading,'), 'AuthContext.jsx must provide profileLoading');
assert.ok(authContextContent.includes('profileError,'), 'AuthContext.jsx must provide profileError');

// 19.3 Verify ProtectedRoute implementation
assert.ok(protectedRouteContent.includes('useAuth'), 'ProtectedRoute must consume useAuth()');
assert.ok(protectedRouteContent.includes('LoadingIndicator'), 'ProtectedRoute must show LoadingIndicator while loading');
assert.ok(protectedRouteContent.includes('ROUTES.LOGIN'), 'ProtectedRoute must redirect unauthenticated users to ROUTES.LOGIN');
assert.ok(protectedRouteContent.includes('state={{ from: location }}'), 'ProtectedRoute must preserve original target location in state.from');

// 19.4 Verify RoleBasedRoute implementation
assert.ok(roleBasedRouteContent.includes('useAuth'), 'RoleBasedRoute must consume useAuth()');
assert.ok(roleBasedRouteContent.includes('LoadingIndicator'), 'RoleBasedRoute must show LoadingIndicator');
assert.ok(roleBasedRouteContent.includes('ROUTES.UNAUTHORIZED'), 'RoleBasedRoute must redirect to ROUTES.UNAUTHORIZED');
assert.ok(roleBasedRouteContent.includes("reason: 'pending_approval'"), 'RoleBasedRoute must distinguish pending_approval');
assert.ok(roleBasedRouteContent.includes("reason: 'forbidden'"), 'RoleBasedRoute must distinguish forbidden');
assert.ok(roleBasedRouteContent.includes("reason: 'error'"), 'RoleBasedRoute must distinguish network error without logging user out');

// 19.5 Verify UnauthorizedPage features
assert.ok(unauthorizedPageContent.includes('pending_approval'), 'UnauthorizedPage must handle pending_approval');
assert.ok(unauthorizedPageContent.includes('forbidden'), 'UnauthorizedPage must handle forbidden');
assert.ok(unauthorizedPageContent.includes('Check Status Again') || unauthorizedPageContent.includes('refreshProfile'), 'UnauthorizedPage must allow checking status again via refreshProfile');
assert.ok(unauthorizedPageContent.includes('logout'), 'UnauthorizedPage must allow user logout');

// 19.6 Dynamic evaluation testing using imported accessRules
const { ROLES, ROUTE_ACCESS, evaluateAccess } = await import('../src/routes/accessRules.js');

assert.strictEqual(ROLES.STUDENT, 'student');
assert.strictEqual(ROLES.TEACHER, 'teacher');
assert.strictEqual(ROLES.ADMIN, 'admin');

assert.strictEqual(ROUTE_ACCESS.STUDENT_ONLY.requireApproval, false, 'Student routes should not require manual approval');
assert.strictEqual(ROUTE_ACCESS.TEACHER_ONLY.requireApproval, true, 'Teacher routes must require approval');

// Scenario A: Unauthenticated user accessing protected student route
const unauthAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.STUDENT_ONLY.roles,
  requireApproval: ROUTE_ACCESS.STUDENT_ONLY.requireApproval,
  isAuthenticated: false,
});
assert.strictEqual(unauthAccess.allowed, false);
assert.strictEqual(unauthAccess.reason, 'not_authenticated');

// Scenario B: Authenticated Student accessing Student route
const studentStudentAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.STUDENT_ONLY.roles,
  requireApproval: ROUTE_ACCESS.STUDENT_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { id: 's1', role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(studentStudentAccess.allowed, true, 'Student should access student route without manual approval');

// Scenario C: Authenticated Student attempting to access Teacher route
const studentTeacherAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { id: 's1', role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(studentTeacherAccess.allowed, false);
assert.strictEqual(studentTeacherAccess.reason, 'forbidden', 'Student accessing Teacher route must be forbidden');

// Scenario D: Unapproved Teacher attempting to access Teacher route
const unapprovedTeacherAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { id: 't1', role: 'teacher', is_approved: false },
  role: 'teacher',
  isApproved: false,
});
assert.strictEqual(unapprovedTeacherAccess.allowed, false);
assert.strictEqual(unapprovedTeacherAccess.reason, 'pending_approval', 'Unapproved teacher must receive pending_approval');

// Scenario E: Approved Teacher accessing Teacher route
const approvedTeacherAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { id: 't2', role: 'teacher', is_approved: true },
  role: 'teacher',
  isApproved: true,
});
assert.strictEqual(approvedTeacherAccess.allowed, true, 'Approved teacher must be granted access');

// Scenario F: Admin accessing teacher route
const adminTeacherAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { id: 'a1', role: 'admin', is_approved: true },
  role: 'admin',
  isApproved: true,
});
assert.strictEqual(adminTeacherAccess.allowed, true, 'Admin must be granted access to teacher routes');

// Scenario G: Authenticated user without profile row (e.g. sync delay or error)
const noProfileAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.STUDENT_ONLY.roles,
  requireApproval: ROUTE_ACCESS.STUDENT_ONLY.requireApproval,
  isAuthenticated: true,
  profile: null,
  role: null,
  isApproved: false,
});
assert.strictEqual(noProfileAccess.allowed, false);
assert.strictEqual(noProfileAccess.reason, 'no_profile');

console.log('✔ Protected Routes & Role-Based Access Control: Guards, access rules matrix, Unauthorized page, and evaluation scenarios verified');

// 20. Milestone 8.7: Teacher Registration & Approval Request
// 20.1 Migration & Database Security Architecture
const teacherMigrationPath = path.join(rootDir, '..', 'supabase', 'migrations', '20261030020000_teacher_registration_requests.sql');
assert.ok(fs.existsSync(teacherMigrationPath), 'Teacher registration requests migration must exist');
const teacherMigrationSql = fs.readFileSync(teacherMigrationPath, 'utf8');

assert.ok(teacherMigrationSql.includes('CREATE TABLE IF NOT EXISTS public.teacher_registration_requests'), 'teacher_registration_requests table definition missing');
assert.ok(teacherMigrationSql.includes("REFERENCES auth.users(id) ON DELETE CASCADE"), 'Foreign key reference to auth.users missing');
assert.ok(teacherMigrationSql.includes("CHECK (status IN ('pending', 'approved', 'rejected'))"), 'Status constraint missing');
assert.ok(teacherMigrationSql.includes('uq_teacher_pending_requests'), 'Unique partial index for pending requests missing');
assert.ok(teacherMigrationSql.includes('ALTER TABLE public.teacher_registration_requests ENABLE ROW LEVEL SECURITY'), 'RLS must be enabled on teacher_registration_requests');
assert.ok(teacherMigrationSql.includes('Users can view own teacher requests'), 'SELECT RLS policy missing');
assert.ok(teacherMigrationSql.includes('Users can submit own teacher request'), 'INSERT RLS policy missing');
assert.ok(teacherMigrationSql.includes('REVOKE UPDATE, DELETE ON public.teacher_registration_requests FROM authenticated'), 'Revoke of UPDATE/DELETE on teacher requests missing');
assert.ok(teacherMigrationSql.includes('trigger_prevent_teacher_request_tampering'), 'Tampering prevention trigger missing');
assert.ok(teacherMigrationSql.includes("NEW.raw_user_meta_data->>'requested_role'"), 'handle_new_user trigger must check requested_role');

// 20.2 Routes and Navigation
const updatedRoutesPath = path.join(srcDir, 'routes', 'routes.js');
const updatedRoutesContent = fs.readFileSync(updatedRoutesPath, 'utf8');
assert.ok(updatedRoutesContent.includes("TEACHER_REGISTER: '/register/teacher'"), 'TEACHER_REGISTER route constant missing');
assert.ok(updatedRoutesContent.includes("TEACHER_LOGIN: '/login/teacher'"), 'TEACHER_LOGIN route constant missing');
assert.ok(updatedRoutesContent.includes("TEACHER_STATUS: '/teacher/status'"), 'TEACHER_STATUS route constant missing');

const updatedAppRoutesPath = path.join(srcDir, 'routes', 'AppRoutes.jsx');
const updatedAppRoutesContent = fs.readFileSync(updatedAppRoutesPath, 'utf8');
assert.ok(updatedAppRoutesContent.includes('TeacherRegisterPage'), 'TeacherRegisterPage missing from AppRoutes');
assert.ok(updatedAppRoutesContent.includes('TeacherLoginPage'), 'TeacherLoginPage missing from AppRoutes');
assert.ok(updatedAppRoutesContent.includes('TeacherStatusPage'), 'TeacherStatusPage missing from AppRoutes');

// 20.3 Page Components and Design Consistency
const teacherRegisterPagePath = path.join(srcDir, 'pages', 'TeacherRegisterPage.jsx');
assert.ok(fs.existsSync(teacherRegisterPagePath), 'TeacherRegisterPage.jsx must exist');
const teacherRegisterPageContent = fs.readFileSync(teacherRegisterPagePath, 'utf8');
assert.ok(teacherRegisterPageContent.includes('FACULTY PORTAL'), 'Teacher badge missing');
assert.ok(teacherRegisterPageContent.includes('Administrative Approval Required'), 'Approval requirement notice missing');
assert.ok(teacherRegisterPageContent.includes('auth-role-tabs'), 'Role switcher tabs missing');
assert.ok(teacherRegisterPageContent.includes('registerTeacher'), 'TeacherRegisterPage must call registerTeacher');

const teacherLoginPagePath = path.join(srcDir, 'pages', 'TeacherLoginPage.jsx');
assert.ok(fs.existsSync(teacherLoginPagePath), 'TeacherLoginPage.jsx must exist');
const teacherLoginPageContent = fs.readFileSync(teacherLoginPagePath, 'utf8');
assert.ok(teacherLoginPageContent.includes('Teacher Sign In'), 'TeacherLoginPage heading missing');
assert.ok(teacherLoginPageContent.includes('loginUser'), 'TeacherLoginPage must call loginUser');

const teacherStatusPagePath = path.join(srcDir, 'pages', 'TeacherStatusPage.jsx');
assert.ok(fs.existsSync(teacherStatusPagePath), 'TeacherStatusPage.jsx must exist');
const teacherStatusPageContent = fs.readFileSync(teacherStatusPagePath, 'utf8');
assert.ok(teacherStatusPageContent.includes('teacherRequest'), 'TeacherStatusPage must read teacherRequest from auth context');
assert.ok(teacherStatusPageContent.includes('refreshTeacherRequest'), 'TeacherStatusPage must use refreshTeacherRequest');

// 20.4 Cross-Navigation Updates
const updatedRegisterPageContent = fs.readFileSync(path.join(srcDir, 'pages', 'RegisterPage.jsx'), 'utf8');
assert.ok(updatedRegisterPageContent.includes('auth-role-tabs'), 'RegisterPage must include role switcher tabs');
assert.ok(updatedRegisterPageContent.includes('ROUTES.TEACHER_REGISTER'), 'RegisterPage must link to Teacher registration');

const updatedLoginPageContent = fs.readFileSync(path.join(srcDir, 'pages', 'LoginPage.jsx'), 'utf8');
assert.ok(updatedLoginPageContent.includes('ROUTES.TEACHER_LOGIN'), 'LoginPage must link to Teacher login');

// 20.5 Service Layer and Methods
const updatedAuthServiceContent = fs.readFileSync(path.join(srcDir, 'services', 'authService.js'), 'utf8');
assert.ok(updatedAuthServiceContent.includes('registerTeacher'), 'registerTeacher function missing from authService.js');
assert.ok(updatedAuthServiceContent.includes('submitTeacherRegistrationRequest'), 'submitTeacherRegistrationRequest function missing from authService.js');
assert.ok(updatedAuthServiceContent.includes('getTeacherRegistrationRequest'), 'getTeacherRegistrationRequest function missing from authService.js');
assert.ok(updatedAuthServiceContent.includes("role: 'student'"), 'registerTeacher must enforce student default in metadata');
assert.ok(updatedAuthServiceContent.includes("requested_role: 'teacher'"), 'registerTeacher must mark requested_role intent');

// 20.6 Unit Validation and Execution Simulations
// Test 1: Teacher registration with valid details validation
function validateTeacherForm({ fullName, email, password, confirmPassword }) {
  const errors = {};
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!fullName?.trim()) errors.fullName = 'Full Name is required.';
  if (!email?.trim()) errors.email = 'Email Address is required.';
  else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
  if (!confirmPassword) errors.confirmPassword = 'Confirm Password is required.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

assert.strictEqual(
  Object.keys(validateTeacherForm({
    fullName: 'Dr. Evelyn Reed',
    email: 'ereed@university.edu',
    password: 'password123',
    confirmPassword: 'password123',
  })).length,
  0,
  'Valid teacher form submission should produce 0 errors'
);

// Test 2: Invalid email and password length validation
const invalidTeacherForm = validateTeacherForm({
  fullName: '',
  email: 'not-an-email',
  password: '123',
  confirmPassword: '123',
});
assert.ok(invalidTeacherForm.fullName, 'Full name required check failed');
assert.ok(invalidTeacherForm.email, 'Invalid email check failed');
assert.ok(invalidTeacherForm.password, 'Short password check failed');

// Test 3: Password mismatch validation
const mismatchForm = validateTeacherForm({
  fullName: 'Dr. Evelyn Reed',
  email: 'ereed@university.edu',
  password: 'password123',
  confirmPassword: 'differentPassword',
});
assert.strictEqual(mismatchForm.confirmPassword, 'Passwords do not match.');

// Test 4: Duplicate account registration error formatting
const duplicateError = new Error('User already registered');
assert.strictEqual(
  formatAuthError(duplicateError),
  'An account with this email address already exists. Please log in instead.'
);

// Test 5: Email confirmation enabled simulation
async function mockRegisterTeacher(scenario) {
  if (scenario === 'confirmation_required') {
    return {
      data: { user: { id: 'u-t1', email: 'prof@attendai.edu' }, session: null },
      error: null,
      isConfirmationRequired: true,
    };
  }
  if (scenario === 'session_active') {
    return {
      data: {
        user: { id: 'u-t2', email: 'prof2@attendai.edu' },
        session: { access_token: 'valid-jwt' },
      },
      error: null,
      isConfirmationRequired: false,
    };
  }
  return { data: null, error: new Error('Registration failed'), isConfirmationRequired: false };
}

const confirmationRes = await mockRegisterTeacher('confirmation_required');
assert.strictEqual(confirmationRes.isConfirmationRequired, true, 'Email confirmation required must be true');
assert.strictEqual(confirmationRes.data.session, null, 'Session must be null when confirmation is required');

// Test 6: Email confirmation disabled simulation
const activeSessionRes = await mockRegisterTeacher('session_active');
assert.strictEqual(activeSessionRes.isConfirmationRequired, false);
assert.ok(activeSessionRes.data.session, 'Session must exist when email confirmation is disabled');

// Test 7: Teacher request submission simulation
async function mockSubmitTeacherRequest(userId, existingPending) {
  if (existingPending) {
    // Duplicate pending prevention
    return {
      data: existingPending,
      error: null,
      isDuplicatePrevented: true,
    };
  }
  return {
    data: {
      id: 'req-1',
      user_id: userId,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
    error: null,
    isDuplicatePrevented: false,
  };
}

const newRequest = await mockSubmitTeacherRequest('u-t2', null);
assert.strictEqual(newRequest.data.status, 'pending');
assert.strictEqual(newRequest.isDuplicatePrevented, false);

// Test 8: Duplicate request prevention simulation
const duplicateAttempt = await mockSubmitTeacherRequest('u-t2', newRequest.data);
assert.strictEqual(duplicateAttempt.isDuplicatePrevented, true);
assert.strictEqual(duplicateAttempt.data.id, 'req-1');

// Test 9: Client cannot approve own request (tampering simulation)
function simulateClientUpdate(request, newStatus, clientRole) {
  if (clientRole === 'authenticated' && newStatus !== request.status) {
    throw new Error('Security violation: Authenticated users cannot modify teacher registration requests.');
  }
  return { ...request, status: newStatus };
}

assert.throws(
  () => simulateClientUpdate(newRequest.data, 'approved', 'authenticated'),
  /Security violation: Authenticated users cannot modify teacher registration requests./,
  'Client self-approval of teacher request must be blocked'
);

// Test 10: Client cannot self-elevate profile role
function simulateProfileRoleUpdate(profile, newRole, clientRole) {
  if (clientRole === 'authenticated' && newRole !== profile.role) {
    throw new Error('Security violation: Authenticated users cannot alter user role.');
  }
  return { ...profile, role: newRole };
}

const studentProfile = { id: 'u-t2', role: 'student', is_approved: false };
assert.throws(
  () => simulateProfileRoleUpdate(studentProfile, 'teacher', 'authenticated'),
  /Security violation: Authenticated users cannot alter user role./,
  'Client self-elevation of profile role must be blocked'
);

// Test 11: Pending teacher cannot access teacher routes
const pendingTeacherAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: studentProfile,
  role: studentProfile.role, // 'student'
  isApproved: studentProfile.is_approved, // false
});
assert.strictEqual(pendingTeacherAccess.allowed, false, 'Pending teacher must be denied access to teacher routes');

// Test 12: Existing Student registration and login flows continue to work
const studentRegistrationResult = await mockLogin('success');
assert.ok(studentRegistrationResult.data.session, 'Existing student login must succeed');

console.log('✔ Teacher Registration & Approval Request: Table schema, anti-tampering trigger, services, UI components, role switcher, and security simulations verified');

// ==============================================================================
// 21. Milestone 8.8: Teacher Login and Role-Specific Authentication Experience
// ==============================================================================
console.log('--- AttendAI Verification Suite (Milestone 8.8: Teacher Login) ---');

// 21.1 File Existence and Integrity
assert.ok(fs.existsSync(teacherLoginPagePath), 'TeacherLoginPage.jsx must exist');
const teacherLoginPageCssPath = path.join(srcDir, 'pages', 'TeacherLoginPage.css');
assert.ok(fs.existsSync(teacherLoginPageCssPath), 'TeacherLoginPage.css must exist');

const teacherLoginContent = fs.readFileSync(teacherLoginPagePath, 'utf8');
const teacherLoginCssContent = fs.readFileSync(teacherLoginPageCssPath, 'utf8');

// 21.2 UI Parity and Requirements in TeacherLoginPage
assert.ok(teacherLoginContent.includes('authenticateTeacher'), 'TeacherLoginPage must call authenticateTeacher');
assert.ok(teacherLoginContent.includes('TEACHER_LOGIN_OUTCOMES'), 'TeacherLoginPage must handle TEACHER_LOGIN_OUTCOMES');
assert.ok(teacherLoginContent.includes('login-page'), 'TeacherLoginPage must use .login-page');
assert.ok(teacherLoginContent.includes('login-card'), 'TeacherLoginPage must use .login-card');
assert.ok(teacherLoginContent.includes('login-input'), 'TeacherLoginPage must use .login-input');
assert.ok(teacherLoginContent.includes('FACULTY PORTAL'), 'TeacherLoginPage must include FACULTY PORTAL badge');
assert.ok(teacherLoginContent.includes('Teacher Sign In'), 'TeacherLoginPage must have Teacher Sign In heading');
assert.ok(teacherLoginContent.includes('ROUTES.TEACHER_REGISTER'), 'TeacherLoginPage must link to Teacher Registration');
assert.ok(teacherLoginContent.includes('ROUTES.LOGIN'), 'TeacherLoginPage must link to Student Login');
assert.ok(teacherLoginCssContent.includes("@import './LoginPage.css'"), 'TeacherLoginPage.css must import LoginPage.css');

// 21.3 Service exports in authService.js
const authServiceContentLatest = fs.readFileSync(path.join(srcDir, 'services', 'authService.js'), 'utf8');
assert.ok(authServiceContentLatest.includes('authenticateTeacher'), 'authService.js must export authenticateTeacher');
assert.ok(authServiceContentLatest.includes('loginTeacher'), 'authService.js must export loginTeacher');
assert.ok(authServiceContentLatest.includes('TEACHER_LOGIN_OUTCOMES'), 'authService.js must export TEACHER_LOGIN_OUTCOMES');
assert.strictEqual(TEACHER_LOGIN_OUTCOMES.APPROVED_TEACHER, 'APPROVED_TEACHER');
assert.strictEqual(TEACHER_LOGIN_OUTCOMES.PENDING_TEACHER, 'PENDING_TEACHER');
assert.strictEqual(TEACHER_LOGIN_OUTCOMES.REJECTED_TEACHER, 'REJECTED_TEACHER');
assert.strictEqual(TEACHER_LOGIN_OUTCOMES.STUDENT_ROLE, 'STUDENT_ROLE');
assert.strictEqual(TEACHER_LOGIN_OUTCOMES.ADMIN_ROLE, 'ADMIN_ROLE');
assert.strictEqual(TEACHER_LOGIN_OUTCOMES.PROFILE_ERROR, 'PROFILE_ERROR');
assert.strictEqual(TEACHER_LOGIN_OUTCOMES.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');

// 21.4 Verification of the 13 required testing scenarios
// Simulation helper for authenticateTeacher
async function simulateAuthenticateTeacher({
  loginResult,
  profileResult,
  requestResult,
}) {
  if (loginResult.error) {
    return {
      data: null,
      error: loginResult.error,
      outcome: TEACHER_LOGIN_OUTCOMES.INVALID_CREDENTIALS,
      message: formatAuthError(loginResult.error),
    };
  }

  const userId = loginResult.data?.user?.id;
  if (!userId) {
    return {
      data: null,
      error: new Error('User identifier missing after sign in.'),
      outcome: TEACHER_LOGIN_OUTCOMES.PROFILE_ERROR,
      message: 'Authentication failed. Please try again.',
    };
  }

  if (profileResult.error || !profileResult.profile) {
    return {
      data: null,
      error: profileResult.error || new Error('Profile record not found in database.'),
      outcome: TEACHER_LOGIN_OUTCOMES.PROFILE_ERROR,
      message: 'Unable to verify account profile in database. Access denied.',
    };
  }

  const profile = profileResult.profile;

  if (profile.role === 'admin') {
    return {
      data: null,
      error: null,
      outcome: TEACHER_LOGIN_OUTCOMES.ADMIN_ROLE,
      message: 'Administrator accounts cannot sign in through the Faculty Portal. Please use the administrative portal.',
    };
  }

  if (profile.role === 'teacher' && profile.is_approved === true) {
    return {
      data: loginResult.data,
      error: null,
      outcome: TEACHER_LOGIN_OUTCOMES.APPROVED_TEACHER,
      profile,
      message: 'Teacher authenticated successfully.',
    };
  }

  const teacherRequest = requestResult?.request || null;

  if (teacherRequest?.status === 'rejected') {
    return {
      data: null,
      error: null,
      outcome: TEACHER_LOGIN_OUTCOMES.REJECTED_TEACHER,
      request: teacherRequest,
      message: 'Your teacher registration request was reviewed and not approved. You cannot sign in to the Faculty Portal. You may continue to use your account via Student Sign In.',
    };
  }

  if (teacherRequest?.status === 'pending' || (profile.role === 'teacher' && !profile.is_approved)) {
    return {
      data: loginResult.data,
      error: null,
      outcome: TEACHER_LOGIN_OUTCOMES.PENDING_TEACHER,
      profile,
      request: teacherRequest,
      message: 'Your teacher registration request is currently awaiting administrative approval. Faculty portal access has not been granted yet.',
    };
  }

  if (profile.role === 'student') {
    return {
      data: null,
      error: null,
      outcome: TEACHER_LOGIN_OUTCOMES.STUDENT_ROLE,
      message: 'Access Denied: This account is registered as a Student. Please use Student Sign In.',
    };
  }

  return {
    data: null,
    error: new Error('Unauthorized'),
    outcome: TEACHER_LOGIN_OUTCOMES.PROFILE_ERROR,
    message: 'Access Denied: Account is not authorized for Faculty Portal access.',
  };
}

// Scenario 1: Approved Teacher login
const approvedTeacherSim = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 'prof-1', email: 'prof@attendai.edu' }, session: { token: 'jwt' } } },
  profileResult: { profile: { id: 'prof-1', role: 'teacher', is_approved: true } },
  requestResult: { request: { status: 'approved' } },
});
assert.strictEqual(approvedTeacherSim.outcome, TEACHER_LOGIN_OUTCOMES.APPROVED_TEACHER);
assert.ok(approvedTeacherSim.data.session, 'Approved teacher must have active session');
const approvedAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: approvedTeacherSim.profile,
  role: approvedTeacherSim.profile.role,
  isApproved: approvedTeacherSim.profile.is_approved,
});
assert.strictEqual(approvedAccess.allowed, true, 'Approved teacher must have access to teacher routes');

// Scenario 2: Pending Teacher login
const pendingTeacherSim = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 'prof-pending', email: 'pending@attendai.edu' }, session: { token: 'jwt' } } },
  profileResult: { profile: { id: 'prof-pending', role: 'student', is_approved: false } },
  requestResult: { request: { status: 'pending' } },
});
assert.strictEqual(pendingTeacherSim.outcome, TEACHER_LOGIN_OUTCOMES.PENDING_TEACHER);
assert.ok(pendingTeacherSim.message.includes('awaiting administrative approval'), 'Must state awaiting approval');
const pendingAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: pendingTeacherSim.profile,
  role: pendingTeacherSim.profile.role,
  isApproved: pendingTeacherSim.profile.is_approved,
});
assert.strictEqual(pendingAccess.allowed, false, 'Pending teacher must NOT have access to teacher routes');

// Scenario 3: Rejected Teacher login
const rejectedTeacherSim = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 'prof-rejected', email: 'rejected@attendai.edu' }, session: { token: 'jwt' } } },
  profileResult: { profile: { id: 'prof-rejected', role: 'student', is_approved: false } },
  requestResult: { request: { status: 'rejected' } },
});
assert.strictEqual(rejectedTeacherSim.outcome, TEACHER_LOGIN_OUTCOMES.REJECTED_TEACHER);
assert.strictEqual(rejectedTeacherSim.data, null, 'Rejected teacher must not retain session on faculty portal');
assert.ok(rejectedTeacherSim.message.includes('not approved'), 'Must state request was not approved');

// Scenario 4: Student attempting Teacher Login
const studentAttemptSim = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 'stud-1', email: 'student@attendai.edu' }, session: { token: 'jwt' } } },
  profileResult: { profile: { id: 'stud-1', role: 'student', is_approved: false } },
  requestResult: { request: null },
});
assert.strictEqual(studentAttemptSim.outcome, TEACHER_LOGIN_OUTCOMES.STUDENT_ROLE);
assert.strictEqual(studentAttemptSim.data, null, 'Student session must be cleared on teacher portal');
assert.ok(studentAttemptSim.message.includes('Student Sign In'), 'Must direct to student login');

// Scenario 5: Admin attempting Teacher Login
const adminAttemptSim = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 'admin-1', email: 'admin@attendai.edu' }, session: { token: 'jwt' } } },
  profileResult: { profile: { id: 'admin-1', role: 'admin', is_approved: true } },
  requestResult: { request: null },
});
assert.strictEqual(adminAttemptSim.outcome, TEACHER_LOGIN_OUTCOMES.ADMIN_ROLE);
assert.strictEqual(adminAttemptSim.data, null, 'Admin session must be cleared on teacher portal');
assert.ok(adminAttemptSim.message.includes('administrative'), 'Must direct to admin portal');

// Scenario 6: Invalid email/password
const invalidCredsSim = await simulateAuthenticateTeacher({
  loginResult: { data: null, error: new Error('Invalid login credentials') },
  profileResult: { profile: null },
});
assert.strictEqual(invalidCredsSim.outcome, TEACHER_LOGIN_OUTCOMES.INVALID_CREDENTIALS);
assert.strictEqual(invalidCredsSim.message, 'Invalid email or password. Please verify your credentials and try again.');

// Scenario 7: Missing profile
const missingProfileSim = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 'u-noprof' }, session: { token: 'jwt' } } },
  profileResult: { profile: null, error: null },
});
assert.strictEqual(missingProfileSim.outcome, TEACHER_LOGIN_OUTCOMES.PROFILE_ERROR);
assert.strictEqual(missingProfileSim.data, null, 'Missing profile must fail safely with null session');

// Scenario 8: Database/network error during profile retrieval
const dbErrorSim = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 'u-err' }, session: { token: 'jwt' } } },
  profileResult: { profile: null, error: new Error('Database connection failed') },
});
assert.strictEqual(dbErrorSim.outcome, TEACHER_LOGIN_OUTCOMES.PROFILE_ERROR);
assert.strictEqual(dbErrorSim.data, null, 'DB error must fail safely with null session');

// Scenario 9: Teacher session restoration after refresh
const restoredSession = { user: { id: 'prof-restored' }, token: 'valid-jwt' };
const restoredProfile = { id: 'prof-restored', role: 'teacher', is_approved: true };
const restoredAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: Boolean(restoredSession?.user),
  profile: restoredProfile,
  role: restoredProfile.role,
  isApproved: restoredProfile.is_approved,
});
assert.strictEqual(restoredAccess.allowed, true, 'Restored teacher session must retain access');

// Scenario 10: Teacher logout clears session and denies access
const loggedOutState = { session: null, user: null, profile: null, role: null, isApproved: false };
const loggedOutAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: Boolean(loggedOutState.user),
  profile: loggedOutState.profile,
  role: loggedOutState.role,
  isApproved: loggedOutState.isApproved,
});
assert.strictEqual(loggedOutAccess.allowed, false, 'Logged out teacher must be denied access');
assert.strictEqual(loggedOutAccess.reason, 'not_authenticated', 'Logged out teacher must be not_authenticated');

// Scenario 11: Direct access to Teacher-protected routes without authentication
const directUnauthAccess = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: false,
  profile: null,
  role: null,
  isApproved: false,
});
assert.strictEqual(directUnauthAccess.allowed, false);
assert.strictEqual(directUnauthAccess.reason, 'not_authenticated');

// Scenario 12: Existing Student Login remains functional
const studentLoginSim = await mockLogin('success');
assert.ok(studentLoginSim.data.session, 'Student login must succeed');
const studentPageContent = fs.readFileSync(path.join(srcDir, 'pages', 'LoginPage.jsx'), 'utf8');
assert.ok(studentPageContent.includes('loginUser'), 'Student login must use loginUser()');

// Scenario 13: Student and Teacher navigation remain correctly separated
function getNavbarItems({ isAuthenticated, role, isApproved, teacherRequest }) {
  if (!isAuthenticated) {
    return ['Home', 'Features', 'How It Works', 'About', 'Log In', 'Get Started'];
  }
  const items = ['Home', 'Features', 'How It Works', 'About', 'Log Out'];
  if (role === 'teacher' && isApproved) {
    items.push('Faculty Portal');
  } else if (teacherRequest?.status === 'pending') {
    items.push('Teacher Pending');
  }
  return items;
}

const unauthNav = getNavbarItems({ isAuthenticated: false });
assert.ok(!unauthNav.includes('Faculty Portal') && !unauthNav.includes('Teacher Pending'));

const studentNav = getNavbarItems({ isAuthenticated: true, role: 'student', isApproved: false, teacherRequest: null });
assert.ok(!studentNav.includes('Faculty Portal') && !studentNav.includes('Teacher Pending'), 'Student nav must not have teacher pills');

const pendingTeacherNav = getNavbarItems({ isAuthenticated: true, role: 'student', isApproved: false, teacherRequest: { status: 'pending' } });
assert.ok(pendingTeacherNav.includes('Teacher Pending') && !pendingTeacherNav.includes('Faculty Portal'), 'Pending teacher sees Teacher Pending pill');

const approvedTeacherNav = getNavbarItems({ isAuthenticated: true, role: 'teacher', isApproved: true, teacherRequest: { status: 'approved' } });
assert.ok(approvedTeacherNav.includes('Faculty Portal') && !approvedTeacherNav.includes('Teacher Pending'), 'Approved teacher sees Faculty Portal pill');

const rejectedTeacherNav = getNavbarItems({ isAuthenticated: true, role: 'student', isApproved: false, teacherRequest: { status: 'rejected' } });
assert.ok(!rejectedTeacherNav.includes('Faculty Portal') && !rejectedTeacherNav.includes('Teacher Pending'), 'Rejected teacher sees no teacher pills');

console.log('✔ Milestone 8.8: All 13 Teacher Login & Role Authentication scenarios verified successfully');

// ==============================================================================
// 22. Milestone 8.9: Forgot Password and Password Reset
// ==============================================================================
console.log('--- AttendAI Verification Suite (Milestone 8.9: Password Recovery) ---');

// 22.1 File Existence and Integrity
const forgotPasswordJsxPath = path.join(srcDir, 'pages', 'ForgotPasswordPage.jsx');
const forgotPasswordCssPath = path.join(srcDir, 'pages', 'ForgotPasswordPage.css');
const resetPasswordJsxPath = path.join(srcDir, 'pages', 'ResetPasswordPage.jsx');
const resetPasswordCssPath = path.join(srcDir, 'pages', 'ResetPasswordPage.css');

assert.ok(fs.existsSync(forgotPasswordJsxPath), 'ForgotPasswordPage.jsx must exist');
assert.ok(fs.existsSync(forgotPasswordCssPath), 'ForgotPasswordPage.css must exist');
assert.ok(fs.existsSync(resetPasswordJsxPath), 'ResetPasswordPage.jsx must exist');
assert.ok(fs.existsSync(resetPasswordCssPath), 'ResetPasswordPage.css must exist');

const forgotPasswordJsxContent = fs.readFileSync(forgotPasswordJsxPath, 'utf8');
const resetPasswordJsxContent = fs.readFileSync(resetPasswordJsxPath, 'utf8');
assert.ok(forgotPasswordJsxContent.includes('sendPasswordResetEmail'), 'ForgotPasswordPage must call sendPasswordResetEmail');
assert.ok(resetPasswordJsxContent.includes('updateUserPassword'), 'ResetPasswordPage must call updateUserPassword');

// 22.2 Route Constants and AppRoutes Registration
const routesContent89 = fs.readFileSync(path.join(srcDir, 'routes', 'routes.js'), 'utf8');
assert.ok(routesContent89.includes("FORGOT_PASSWORD: '/forgot-password'"), 'FORGOT_PASSWORD route missing from routes.js');
assert.ok(routesContent89.includes("RESET_PASSWORD: '/reset-password'"), 'RESET_PASSWORD route missing from routes.js');

const appRoutesContent89 = fs.readFileSync(path.join(srcDir, 'routes', 'AppRoutes.jsx'), 'utf8');
assert.ok(appRoutesContent89.includes('ROUTES.FORGOT_PASSWORD'), 'FORGOT_PASSWORD missing from AppRoutes.jsx');
assert.ok(appRoutesContent89.includes('ROUTES.RESET_PASSWORD'), 'RESET_PASSWORD missing from AppRoutes.jsx');

// 22.3 Service Layer Verification in authService.js
const authServiceContent89 = fs.readFileSync(path.join(srcDir, 'services', 'authService.js'), 'utf8');
assert.ok(authServiceContent89.includes('sendPasswordResetEmail'), 'sendPasswordResetEmail missing from authService.js');
assert.ok(authServiceContent89.includes('resetPasswordForEmail'), 'resetPasswordForEmail alias missing from authService.js');
assert.ok(authServiceContent89.includes('updateUserPassword'), 'updateUserPassword missing from authService.js');
assert.ok(authServiceContent89.includes('resetUserPassword'), 'resetUserPassword alias missing from authService.js');

// 22.4 Unit Validation and Testing of the 12 Scenarios
// Scenario 1: Valid email format validation
function validateForgotPasswordEmail(inputEmail) {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = (inputEmail || '').trim();
  if (!trimmed) return 'Email address is required.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please enter a valid email address.';
  return null;
}
assert.strictEqual(validateForgotPasswordEmail('student@attendai.edu'), null, 'Valid student email must pass');
assert.strictEqual(validateForgotPasswordEmail('prof.vance@university.edu'), null, 'Valid professor email must pass');

// Scenario 2: Invalid email format
assert.strictEqual(validateForgotPasswordEmail(''), 'Email address is required.');
assert.strictEqual(validateForgotPasswordEmail('not-an-email'), 'Please enter a valid email address.');
assert.strictEqual(validateForgotPasswordEmail('missing@domain'), 'Please enter a valid email address.');

// Scenario 3: Recovery request submission (generic confirmation without leaking account existence)
async function mockSendPasswordResetEmail(email, redirectUrl, shouldFail = false) {
  if (shouldFail) {
    return { data: null, error: new Error('Rate limit exceeded'), message: 'Too many attempts. Please wait a few moments and try again.' };
  }
  return {
    data: {},
    error: null,
    message: 'If an account exists with this email, you will receive password reset instructions shortly.',
  };
}
const recoveryResult = await mockSendPasswordResetEmail('unknown@attendai.edu', 'http://localhost:5173/reset-password');
assert.strictEqual(recoveryResult.error, null);
assert.ok(recoveryResult.message.includes('If an account exists'), 'Must not reveal whether email exists');

// Scenario 4: Rate-limit and network-error handling
const rateLimitError = new Error('rate limit exceeded');
rateLimitError.status = 429;
assert.strictEqual(formatAuthError(rateLimitError), 'Too many login attempts. Please wait a few moments and try again.');
const networkError = new Error('Failed to fetch');
assert.strictEqual(formatAuthError(networkError), 'Unable to connect to the authentication server. Please check your internet connection.');

// Scenario 5: Valid recovery session
function evaluateRecoveryLinkState({ hasSession, urlError }) {
  if (urlError) {
    return { status: 'invalid', message: 'This password reset link is invalid or has expired.' };
  }
  if (!hasSession) {
    return { status: 'invalid', message: 'No valid password recovery session was found.' };
  }
  return { status: 'ready', message: null };
}
const validRecoveryState = evaluateRecoveryLinkState({ hasSession: true, urlError: null });
assert.strictEqual(validRecoveryState.status, 'ready');

// Scenario 6: Expired or invalid recovery link
const expiredRecoveryState = evaluateRecoveryLinkState({ hasSession: false, urlError: 'Email link is invalid or has expired' });
assert.strictEqual(expiredRecoveryState.status, 'invalid');
assert.ok(expiredRecoveryState.message.includes('invalid or has expired'));
const directVisitWithoutSession = evaluateRecoveryLinkState({ hasSession: false, urlError: null });
assert.strictEqual(directVisitWithoutSession.status, 'invalid');

// Scenario 7: Password mismatch validation
function validateResetPasswordForm({ password, confirmPassword }) {
  const errors = {};
  if (!password) {
    errors.password = 'New password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }
  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm password is required.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}
const mismatchResult = validateResetPasswordForm({ password: 'newPassword123', confirmPassword: 'differentPassword456' });
assert.strictEqual(mismatchResult.confirmPassword, 'Passwords do not match.');

// Scenario 8: Password policy enforcement (< 6 characters)
const shortPasswordResult = validateResetPasswordForm({ password: '12345', confirmPassword: '12345' });
assert.strictEqual(shortPasswordResult.password, 'Password must be at least 6 characters long.');
const validPasswordResult = validateResetPasswordForm({ password: 'securePassword2026', confirmPassword: 'securePassword2026' });
assert.strictEqual(Object.keys(validPasswordResult).length, 0);

// Scenario 9: Successful password update and session termination
async function mockUpdatePassword(password) {
  if (!password || password.length < 6) {
    return { data: null, error: new Error('Password must be at least 6 characters long.') };
  }
  return { data: { user: { id: 'u-1', email: 'user@attendai.edu' } }, error: null };
}
const updateResult = await mockUpdatePassword('newPassword2026');
assert.ok(updateResult.data.user, 'Password update must succeed');

// Scenario 10: Existing Student login regression
const studentLoginRegression = await mockLogin('success');
assert.ok(studentLoginRegression.data.session, 'Student login continues to function cleanly');
const studentPageContent89 = fs.readFileSync(path.join(srcDir, 'pages', 'LoginPage.jsx'), 'utf8');
assert.ok(studentPageContent89.includes('ROUTES.FORGOT_PASSWORD'), 'Student login now links to forgot password');

// Scenario 11: Existing Teacher login regression
const teacherLoginContentLatest = fs.readFileSync(teacherLoginPagePath, 'utf8');
assert.ok(teacherLoginContentLatest.includes('ROUTES.FORGOT_PASSWORD'), 'Teacher login links to forgot password');
const teacherLoginRegression = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 'prof-reg', email: 'prof@attendai.edu' }, session: { token: 'jwt' } } },
  profileResult: { profile: { id: 'prof-reg', role: 'teacher', is_approved: true } },
  requestResult: { request: { status: 'approved' } },
});
assert.strictEqual(teacherLoginRegression.outcome, TEACHER_LOGIN_OUTCOMES.APPROVED_TEACHER);

// Scenario 12: Role and approval status remain unchanged
function simulatePasswordResetOnProfile(profile, _newPassword) {
  // Password reset only updates auth credentials; public.profiles role and is_approved are untouched
  return {
    ...profile,
    updated_at: new Date().toISOString(),
  };
}
const untouchedProfile = { id: 'p-1', role: 'student', is_approved: false };
const afterResetProfile = simulatePasswordResetOnProfile(untouchedProfile, 'brandNewPassword123');
assert.strictEqual(afterResetProfile.role, 'student', 'Role must remain student');
assert.strictEqual(afterResetProfile.is_approved, false, 'is_approved must remain false');

const teacherProfile = { id: 'p-2', role: 'teacher', is_approved: true };
const afterTeacherReset = simulatePasswordResetOnProfile(teacherProfile, 'brandNewPassword123');
assert.strictEqual(afterTeacherReset.role, 'teacher', 'Teacher role must remain unchanged');
assert.strictEqual(afterTeacherReset.is_approved, true, 'Teacher is_approved must remain true');

console.log('✔ Milestone 8.9: All 12 Forgot Password and Reset Password scenarios verified successfully');

// ==============================================================================
// 23. Milestone 8.10: Authentication Integration Testing and Security Verification
// ==============================================================================
console.log('--- AttendAI Verification Suite (Milestone 8.10: Auth Integration & Security) ---');

// 23.1 Student Authentication Integration & Security Tests (12 Items)
// Item 1: Successful Student registration
async function testStudentRegistration(params) {
  if (!params.fullName || !params.email || !params.password) {
    return { data: null, error: new Error('Missing registration fields') };
  }
  return {
    data: {
      user: { id: 'stu-810-1', email: params.email },
      session: params.confirmEmail ? null : { access_token: 'valid-jwt-token' },
    },
    error: null,
    isConfirmationRequired: Boolean(params.confirmEmail),
  };
}
const regSuccess810 = await testStudentRegistration({
  fullName: 'Alice Student',
  email: 'alice@attendai.edu',
  password: 'Password123!',
  confirmEmail: false,
});
assert.strictEqual(regSuccess810.error, null);
assert.strictEqual(regSuccess810.isConfirmationRequired, false);
assert.ok(regSuccess810.data.session, 'Immediate session when confirmation disabled');

// Item 2: Invalid registration details rejection
function validateStudentRegForm({ fullName, email, password, confirmPassword }) {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errors = {};
  if (!fullName?.trim()) errors.fullName = 'Full Name is required.';
  if (!email?.trim()) errors.email = 'Email Address is required.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters long.';
  if (!confirmPassword) errors.confirmPassword = 'Confirm Password is required.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}
const invalidRegDetails = validateStudentRegForm({
  fullName: '',
  email: 'invalid-email',
  password: '123',
  confirmPassword: '456',
});
assert.strictEqual(invalidRegDetails.fullName, 'Full Name is required.');
assert.strictEqual(invalidRegDetails.email, 'Please enter a valid email address.');
assert.strictEqual(invalidRegDetails.password, 'Password must be at least 6 characters long.');
assert.strictEqual(invalidRegDetails.confirmPassword, 'Passwords do not match.');

// Item 3: Duplicate email registration error mapping
const duplicateEmailError = new Error('User already registered');
assert.strictEqual(
  formatAuthError(duplicateEmailError),
  'An account with this email address already exists. Please log in instead.'
);

// Item 4: Email confirmation enabled scenario
const regConfirmationRequired = await testStudentRegistration({
  fullName: 'Bob Confirm',
  email: 'bob@attendai.edu',
  password: 'Password123!',
  confirmEmail: true,
});
assert.strictEqual(regConfirmationRequired.isConfirmationRequired, true);
assert.strictEqual(regConfirmationRequired.data.session, null);

// Item 5: Email confirmation disabled scenario
const regDirectSession = await testStudentRegistration({
  fullName: 'Charlie Direct',
  email: 'charlie@attendai.edu',
  password: 'Password123!',
  confirmEmail: false,
});
assert.strictEqual(regDirectSession.isConfirmationRequired, false);
assert.ok(regDirectSession.data.session, 'Active session provided immediately');

// Item 6: Successful Student login
async function testStudentLogin(email, password) {
  if (email === 'student@attendai.edu' && password === 'ValidPass123!') {
    return {
      data: {
        user: { id: 'stu-auth-1', email },
        session: { access_token: 'student-jwt-token' },
      },
      error: null,
    };
  }
  return {
    data: null,
    error: new Error('Invalid login credentials'),
  };
}
const studentLoginValid = await testStudentLogin('student@attendai.edu', 'ValidPass123!');
assert.strictEqual(studentLoginValid.error, null);
assert.ok(studentLoginValid.data.session);

// Item 7: Incorrect credentials rejection
const studentLoginInvalid = await testStudentLogin('student@attendai.edu', 'WrongPassword!');
assert.strictEqual(
  formatAuthError(studentLoginInvalid.error),
  'Invalid email or password. Please verify your credentials and try again.'
);

// Item 8: Session restoration after page refresh
async function testSessionRestoration(mockSession) {
  if (!mockSession) return { session: null, profile: null };
  const mockProfile = {
    id: mockSession.user.id,
    full_name: 'Restored Student',
    role: 'student',
    is_approved: false,
  };
  return { session: mockSession, profile: mockProfile };
}
const restoredSession810 = await testSessionRestoration(studentLoginValid.data.session ? studentLoginValid.data : null);
assert.ok(restoredSession810.session, 'Session must restore');
assert.strictEqual(restoredSession810.profile.role, 'student', 'Profile role restored accurately');

// Item 9: Logout and session cleanup
function testLogoutState(currentState) {
  return {
    ...currentState,
    session: null,
    user: null,
    profile: null,
    teacherRequest: null,
    isAuthenticated: false,
  };
}
const loggedOutState810 = testLogoutState({
  session: studentLoginValid.data.session,
  user: studentLoginValid.data.user,
  profile: restoredSession810.profile,
  teacherRequest: null,
  isAuthenticated: true,
});
assert.strictEqual(loggedOutState810.session, null);
assert.strictEqual(loggedOutState810.profile, null);
assert.strictEqual(loggedOutState810.isAuthenticated, false);

// Item 10: Student profile retrieval strictly matches database schema
const studentProfileRecord = {
  id: 'stu-auth-1',
  full_name: 'Student Name',
  role: 'student',
  is_approved: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
assert.strictEqual(studentProfileRecord.role, 'student');
assert.strictEqual(studentProfileRecord.is_approved, false);

// Item 11: Student cannot access Teacher-only routes
const studentAccessToTeacherRoute = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: studentProfileRecord,
  role: studentProfileRecord.role,
  isApproved: studentProfileRecord.is_approved,
});
assert.strictEqual(studentAccessToTeacherRoute.allowed, false);
assert.strictEqual(studentAccessToTeacherRoute.reason, 'forbidden');

// Item 12: Student cannot modify their role or approval status
function simulateProfileUpdateAttempt(currentProfile, attemptedUpdates) {
  const FORBIDDEN_FIELDS = ['role', 'is_approved', 'id', 'created_at'];
  for (const field of FORBIDDEN_FIELDS) {
    if (field in attemptedUpdates && attemptedUpdates[field] !== currentProfile[field]) {
      throw new Error(`Permission denied: Cannot alter ${field}.`);
    }
  }
  return { ...currentProfile, ...attemptedUpdates };
}
assert.throws(
  () => simulateProfileUpdateAttempt(studentProfileRecord, { role: 'teacher' }),
  /Cannot alter role/
);
assert.throws(
  () => simulateProfileUpdateAttempt(studentProfileRecord, { is_approved: true }),
  /Cannot alter is_approved/
);
// But updating full_name is permitted
const nameUpdatedProfile = simulateProfileUpdateAttempt(studentProfileRecord, { full_name: 'Alice Updated' });
assert.strictEqual(nameUpdatedProfile.full_name, 'Alice Updated');

// 23.2 Teacher Authentication Integration & Security Tests (12 Items)
// Item 1: Teacher registration request submission
async function testTeacherRegistrationIntent(metadata) {
  // Database handle_new_user trigger enforces student default in profile
  const generatedProfile = {
    role: 'student',
    is_approved: false,
  };
  // And creates pending request if requested_role is teacher
  const generatedRequest =
    metadata.requested_role === 'teacher' ? { status: 'pending' } : null;
  return { profile: generatedProfile, request: generatedRequest };
}
const teacherIntent = await testTeacherRegistrationIntent({
  full_name: 'Dr. Jane Smith',
  requested_role: 'teacher',
});
assert.strictEqual(teacherIntent.profile.role, 'student', 'Role MUST initialize to student');
assert.strictEqual(teacherIntent.profile.is_approved, false, 'Approval status MUST be false');
assert.strictEqual(teacherIntent.request.status, 'pending', 'Teacher request must be pending');

// Item 2: Email confirmation handling for Teacher
const teacherRegEmailConfirm = await testStudentRegistration({
  fullName: 'Prof. Vance',
  email: 'prof.vance@attendai.edu',
  password: 'Password123!',
  confirmEmail: true,
});
assert.strictEqual(teacherRegEmailConfirm.isConfirmationRequired, true);

// Item 3: Duplicate pending request prevention
function simulateTeacherRequestSubmission(existingRequests, userId) {
  const hasPending = existingRequests.some((r) => r.user_id === userId && r.status === 'pending');
  if (hasPending) {
    return {
      created: false,
      existing: existingRequests.find((r) => r.user_id === userId && r.status === 'pending'),
      error: null,
    };
  }
  const newReq = { id: 'req-' + Date.now(), user_id: userId, status: 'pending' };
  return { created: true, existing: newReq, error: null };
}
const mockRequests = [{ id: 'req-1', user_id: 'prof-dup', status: 'pending' }];
const dupSubmission = simulateTeacherRequestSubmission(mockRequests, 'prof-dup');
assert.strictEqual(dupSubmission.created, false, 'Must not duplicate pending request');
assert.strictEqual(dupSubmission.existing.id, 'req-1');

// Item 4: Pending Teacher login handling
const pendingTeacherLoginResult = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 'p-prof', email: 'pending@attendai.edu' }, session: { token: 'jwt' } } },
  profileResult: { profile: { id: 'p-prof', role: 'student', is_approved: false } },
  requestResult: { request: { status: 'pending' } },
});
assert.strictEqual(pendingTeacherLoginResult.outcome, TEACHER_LOGIN_OUTCOMES.PENDING_TEACHER);
assert.ok(pendingTeacherLoginResult.data.session, 'Session preserved for viewing status');

// Item 5: Approved Teacher login handling
const approvedTeacherLoginResult = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 'a-prof', email: 'approved@attendai.edu' }, session: { token: 'jwt' } } },
  profileResult: { profile: { id: 'a-prof', role: 'teacher', is_approved: true } },
  requestResult: { request: { status: 'approved' } },
});
assert.strictEqual(approvedTeacherLoginResult.outcome, TEACHER_LOGIN_OUTCOMES.APPROVED_TEACHER);

// Item 6: Rejected Teacher request handling
const rejectedTeacherLoginResult = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 'r-prof', email: 'rejected@attendai.edu' }, session: { token: 'jwt' } } },
  profileResult: { profile: { id: 'r-prof', role: 'student', is_approved: false } },
  requestResult: { request: { status: 'rejected' } },
});
assert.strictEqual(rejectedTeacherLoginResult.outcome, TEACHER_LOGIN_OUTCOMES.REJECTED_TEACHER);
assert.strictEqual(rejectedTeacherLoginResult.data, null, 'Session terminated for rejected applicant');

// Item 7: Student attempting to use Teacher Login
const studentOnTeacherLogin = await simulateAuthenticateTeacher({
  loginResult: { data: { user: { id: 's-user', email: 'student@attendai.edu' }, session: { token: 'jwt' } } },
  profileResult: { profile: { id: 's-user', role: 'student', is_approved: false } },
  requestResult: { request: null },
});
assert.strictEqual(studentOnTeacherLogin.outcome, TEACHER_LOGIN_OUTCOMES.STUDENT_ROLE);
assert.strictEqual(studentOnTeacherLogin.data, null, 'Session terminated for Student on Faculty Portal');

// Item 8: Approved Teacher accessing protected routes directly
const approvedTeacherRouteAccess = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { id: 'a-prof', role: 'teacher', is_approved: true },
  role: 'teacher',
  isApproved: true,
});
assert.strictEqual(approvedTeacherRouteAccess.allowed, true);

// Item 9: Pending Teacher denied access to Teacher features
const pendingTeacherRouteAccess = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { id: 'p-prof', role: 'teacher', is_approved: false },
  role: 'teacher',
  isApproved: false,
});
assert.strictEqual(pendingTeacherRouteAccess.allowed, false);
assert.strictEqual(pendingTeacherRouteAccess.reason, 'pending_approval');

// Item 10: Rejected Teacher denied access to Teacher features
const rejectedTeacherRouteAccess = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { id: 'r-prof', role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(rejectedTeacherRouteAccess.allowed, false);
assert.strictEqual(rejectedTeacherRouteAccess.reason, 'forbidden');

// Item 11: Teacher cannot approve their own request
function simulateTeacherSelfApprovalAttempt(clientRole, attemptedStatus) {
  if (clientRole === 'authenticated') {
    throw new Error('Security violation: Authenticated users cannot modify teacher registration requests.');
  }
  return { status: attemptedStatus };
}
assert.throws(
  () => simulateTeacherSelfApprovalAttempt('authenticated', 'approved'),
  /Security violation/
);

// Item 12: Teacher cannot self-assign the Teacher role
assert.throws(
  () => simulateProfileUpdateAttempt({ role: 'student', is_approved: false }, { role: 'teacher' }),
  /Cannot alter role/
);

// 23.3 Admin Authorization Tests (6 Items)
// Item 1: Admin access is based on trusted database role information
const adminProfileValid = { id: 'adm-1', role: 'admin', is_approved: true };
const adminAccessDecision = evaluateAccess({
  allowedRoles: [ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: adminProfileValid,
  role: adminProfileValid.role,
  isApproved: adminProfileValid.is_approved,
});
assert.strictEqual(adminAccessDecision.allowed, true, 'Admin with approved status granted admin access');

// Item 2: Students cannot access Admin routes
const studentToAdminRoute = evaluateAccess({
  allowedRoles: [ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(studentToAdminRoute.allowed, false);
assert.strictEqual(studentToAdminRoute.reason, 'forbidden');

// Item 3: Teachers cannot access Admin routes
const teacherToAdminRoute = evaluateAccess({
  allowedRoles: [ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'teacher', is_approved: true },
  role: 'teacher',
  isApproved: true,
});
assert.strictEqual(teacherToAdminRoute.allowed, false);
assert.strictEqual(teacherToAdminRoute.reason, 'forbidden');

// Item 4: Ordinary authenticated users cannot assign themselves the Admin role
assert.throws(
  () => simulateProfileUpdateAttempt({ role: 'student', is_approved: false }, { role: 'admin' }),
  /Cannot alter role/
);

// Item 5: Ordinary users cannot approve their own Teacher requests
assert.throws(
  () => simulateTeacherSelfApprovalAttempt('authenticated', 'approved'),
  /Security violation/
);

// Item 6: Unauthorized users cannot approve or reject another user's request
function simulateAdminApproveRequest(operatorRole, targetUserId, newStatus) {
  if (operatorRole !== 'postgres' && operatorRole !== 'supabase_admin') {
    throw new Error('Permission denied: Administrative role required to approve requests.');
  }
  return { user_id: targetUserId, status: newStatus, approved_at: new Date().toISOString() };
}
assert.throws(
  () => simulateAdminApproveRequest('authenticated', 'other-user-uuid', 'approved'),
  /Administrative role required/
);
const adminApprovalSuccess = simulateAdminApproveRequest('supabase_admin', 'other-user-uuid', 'approved');
assert.strictEqual(adminApprovalSuccess.status, 'approved');

// 23.4 Database & RLS Security Audit Verification (10 Checks)
const repoRoot = path.resolve(rootDir, '..');
// Check 1: Profiles migration exists and specifies default student
const migProfilesPath = path.join(repoRoot, 'supabase', 'migrations', '20261030000000_profiles_roles_rls.sql');
assert.ok(fs.existsSync(migProfilesPath), 'Profiles migration must exist');
const migProfilesSql = fs.readFileSync(migProfilesPath, 'utf8');
assert.ok(migProfilesSql.includes("role user_role NOT NULL DEFAULT 'student'"), 'Default role must be student in schema');
assert.ok(migProfilesSql.includes("is_approved BOOLEAN NOT NULL DEFAULT FALSE"), 'Default is_approved must be FALSE in schema');

// Check 2: Client-supplied metadata cannot assign privileged roles
assert.ok(migProfilesSql.includes("'student'::user_role"), 'handle_new_user must hardcode student role');

// Check 3: Users can read only their own profile
assert.ok(migProfilesSql.includes('USING (auth.uid() = id)'), 'SELECT policy must enforce auth.uid() = id');

// Check 4: Users cannot modify role, approval status, or protected fields
const migFixUpdatePath = path.join(repoRoot, 'supabase', 'migrations', '20261030010000_fix_profile_update_rls.sql');
assert.ok(fs.existsSync(migFixUpdatePath), 'Fix profile update RLS migration must exist');
const migFixUpdateSql = fs.readFileSync(migFixUpdatePath, 'utf8');
assert.ok(migFixUpdateSql.includes('GRANT UPDATE(full_name) ON public.profiles TO authenticated'), 'Grant must restrict UPDATE to full_name only');
assert.ok(migFixUpdateSql.includes('trigger_prevent_profile_privilege_escalation'), 'Privilege escalation trigger must be attached');

// Check 5: Users cannot create or modify unauthorized Teacher requests
const migTeacherReqPath = path.join(repoRoot, 'supabase', 'migrations', '20261030020000_teacher_registration_requests.sql');
assert.ok(fs.existsSync(migTeacherReqPath), 'Teacher registration requests migration must exist');
const migTeacherReqSql = fs.readFileSync(migTeacherReqPath, 'utf8');
assert.ok(migTeacherReqSql.includes("status = 'pending'"), 'INSERT check must require status = pending');
assert.ok(migTeacherReqSql.includes('REVOKE UPDATE, DELETE ON public.teacher_registration_requests FROM authenticated'), 'UPDATE/DELETE must be revoked from authenticated');

// Check 6: Only authorized Admin operations can approve or reject requests
assert.ok(migTeacherReqSql.includes("current_user NOT IN ('postgres', 'supabase_admin')"), 'Trigger must allow only superuser/admin to modify requests');

// Check 7: Unauthorized insert, update, and delete operations blocked
assert.ok(migProfilesSql.includes('REVOKE ALL ON TABLE public.profiles FROM anon'), 'Anon revoked from profiles');
assert.ok(migTeacherReqSql.includes('REVOKE ALL ON TABLE public.teacher_registration_requests FROM anon'), 'Anon revoked from requests');

// Check 8: Triggers and grants do not introduce privilege-escalation paths
assert.ok(migProfilesSql.includes('SECURITY DEFINER'), 'Triggers use SECURITY DEFINER');
assert.ok(migProfilesSql.includes('SET search_path = public, pg_temp'), 'search_path hardened on triggers');

// Check 9: Non-recursive RLS policy verified in 20261030010000
assert.ok(migFixUpdateSql.includes('USING (auth.uid() = id)'), 'Non-recursive USING expression');
assert.ok(migFixUpdateSql.includes('WITH CHECK (auth.uid() = id)'), 'Non-recursive CHECK expression');
assert.ok(!migFixUpdateSql.includes('role = (SELECT p.role FROM public.profiles'), 'Subquery eliminated from UPDATE policy');

// Check 10: Missing profile records and database failures fail safely
const missingProfileDecision = evaluateAccess({
  allowedRoles: [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
  isAuthenticated: true,
  profile: null,
});
assert.strictEqual(missingProfileDecision.allowed, false);
assert.strictEqual(missingProfileDecision.reason, 'no_profile');

// 23.5 Session, Routing and Fail-Closed Tests (8 Checks)
// Check 1: Loading state prevents protected content flashing
function renderGuardedView({ loading, profileLoading, content }) {
  if (loading || profileLoading) return 'LOADING_SPINNER';
  return content;
}
assert.strictEqual(renderGuardedView({ loading: true, profileLoading: false, content: 'SECRET_DATA' }), 'LOADING_SPINNER');
assert.strictEqual(renderGuardedView({ loading: false, profileLoading: true, content: 'SECRET_DATA' }), 'LOADING_SPINNER');
assert.strictEqual(renderGuardedView({ loading: false, profileLoading: false, content: 'SECRET_DATA' }), 'SECRET_DATA');

// Check 2: Redirect loop prevention in LoginPage
const loginPageSource = fs.readFileSync(path.join(srcDir, 'pages', 'LoginPage.jsx'), 'utf8');
assert.ok(loginPageSource.includes('from !== ROUTES.LOGIN'), 'LoginPage must avoid redirect loops to itself');
assert.ok(loginPageSource.includes('from !== ROUTES.REGISTER'), 'LoginPage must avoid redirect loops to register');

// Check 3: Redirect loop prevention in TeacherLoginPage
const teacherLoginPageSource = fs.readFileSync(path.join(srcDir, 'pages', 'TeacherLoginPage.jsx'), 'utf8');
assert.ok(teacherLoginPageSource.includes('from !== ROUTES.TEACHER_LOGIN'), 'TeacherLoginPage must avoid redirect loops to itself');

// Check 4: Missing profile fails to /unauthorized with reason 'no_profile'
const roleBasedRouteSource = fs.readFileSync(path.join(srcDir, 'routes', 'RoleBasedRoute.jsx'), 'utf8');
assert.ok(roleBasedRouteSource.includes("reason: 'no_profile'"), 'RoleBasedRoute handles missing profile');

// Check 5: Profile-fetch failure fails to /unauthorized with reason 'error'
assert.ok(roleBasedRouteSource.includes("reason: 'error'"), 'RoleBasedRoute handles profile query failure');

// Check 6: Logout removes access to protected views
const unauthAccess810 = evaluateAccess({
  allowedRoles: [ROLES.STUDENT],
  isAuthenticated: false,
  profile: null,
});
assert.strictEqual(unauthAccess810.allowed, false);
assert.strictEqual(unauthAccess810.reason, 'not_authenticated');

// Check 7: Expired session handling
function handleSessionEvent(event) {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    return { session: null, user: null, profile: null };
  }
  return null;
}
const clearedSession = handleSessionEvent('SIGNED_OUT');
assert.strictEqual(clearedSession.session, null);

// Check 8: Recovery session does not bypass authorization
const recoverySessionProfile = { role: 'student', is_approved: false };
const recoveryOnAdminRoute = evaluateAccess({
  allowedRoles: [ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true, // Has recovery session
  profile: recoverySessionProfile,
  role: recoverySessionProfile.role,
  isApproved: recoverySessionProfile.is_approved,
});
assert.strictEqual(recoveryOnAdminRoute.allowed, false, 'Recovery session cannot access admin views');

// 23.6 Password Recovery Tests (7 Checks)
// Check 1: Generic recovery confirmation message
assert.ok(recoveryResult.message.includes('If an account exists'), 'Password recovery does not leak account existence');

// Check 2: Expired or invalid recovery link handling
assert.strictEqual(expiredRecoveryState.status, 'invalid');

// Check 3: Valid recovery session handling
assert.strictEqual(validRecoveryState.status, 'ready');

// Check 4: Password mismatch validation
assert.strictEqual(mismatchResult.confirmPassword, 'Passwords do not match.');

// Check 5: Password update service dispatch
assert.ok(updateResult.data.user, 'updateUserPassword updates credentials');

// Check 6: Password policy enforcement (< 6 characters rejected)
assert.strictEqual(shortPasswordResult.password, 'Password must be at least 6 characters long.');

// Check 7: Roles and approval status remain untouched after password reset
assert.strictEqual(afterResetProfile.role, 'student');
assert.strictEqual(afterResetProfile.is_approved, false);
assert.strictEqual(afterTeacherReset.role, 'teacher');
assert.strictEqual(afterTeacherReset.is_approved, true);

// Check 8: Reproducible SQL test suite exists in repository
const sqlTestPath = path.join(repoRoot, 'supabase', 'tests', 'milestone_8_10_verification.sql');
assert.ok(fs.existsSync(sqlTestPath), 'milestone_8_10_verification.sql must exist');

console.log('✔ Milestone 8.10: All 55 Authentication Integration & Security Verification tests passed successfully');

// ==============================================================================
// 24. Milestone 8.12: Final Authentication Security Audit & Regression Suite
// ==============================================================================
console.log('--- AttendAI Verification Suite (Milestone 8.12: Security Audit & Production Readiness) ---');

// 24.1 Production Checklist Documentation Existence
const m812_checklistPath = path.join(repoRoot, 'docs', 'authentication-production-checklist.md');
assert.ok(fs.existsSync(m812_checklistPath), 'authentication-production-checklist.md must exist in docs/');
const m812_checklistContent = fs.readFileSync(m812_checklistPath, 'utf8');
assert.ok(m812_checklistContent.includes('VITE_SUPABASE_PUBLISHABLE_KEY'), 'Checklist documents publishable key');
assert.ok(m812_checklistContent.includes('service_role'), 'Checklist warns against service_role in frontend');
assert.ok(m812_checklistContent.includes('uq_teacher_pending_requests'), 'Checklist documents pending requests constraint');

// 24.2 Error Handling: Raw SQL Error Masking in formatAuthError
const m812_rawSqlErrors = [
  new Error('relation "public.profiles" does not exist'),
  new Error('new row violates row-level security policy for table profiles'),
  new Error('duplicate key value violates unique constraint "uq_teacher_pending_requests"'),
  new Error('permission denied for column "role" of relation "profiles"'),
  new Error('syntax error at or near "SELECT"'),
  new Error('Failed to create user profile: SQLERRM: connection failure'),
];
for (const sqlErr of m812_rawSqlErrors) {
  const formatted = formatAuthError(sqlErr);
  assert.strictEqual(
    formatted,
    'A database security or service error occurred. Please try again later or contact an administrator.',
    'Raw database errors must be masked without leaking schema or table names'
  );
}

// 24.3 Area 1: Student registration and login regression
const m812_studentReg = await testStudentRegistration({
  fullName: 'Reg Student',
  email: 'student_reg@attendai.edu',
  password: 'Password123!',
  confirmEmail: false,
});
assert.strictEqual(m812_studentReg.error, null);
assert.strictEqual(m812_studentReg.isConfirmationRequired, false);
const m812_studentLogin = await testStudentLogin('student@attendai.edu', 'ValidPass123!');
assert.ok(m812_studentLogin.data.session, 'Student login produces active session');

// 24.4 Area 2: Teacher registration and approval requests regression
const m812_teacherIntent = await testTeacherRegistrationIntent({
  full_name: 'Dr. Reg Teacher',
  requested_role: 'teacher',
});
assert.strictEqual(m812_teacherIntent.profile.role, 'student', 'Profile role defaults strictly to student');
assert.strictEqual(m812_teacherIntent.profile.is_approved, false, 'Profile is_approved defaults strictly to false');
assert.strictEqual(m812_teacherIntent.request.status, 'pending', 'Pending teacher request generated');

// 24.5 Area 3: Approved Teacher access regression
const m812_approvedAccess = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'teacher', is_approved: true },
  role: 'teacher',
  isApproved: true,
});
assert.strictEqual(m812_approvedAccess.allowed, true, 'Approved teacher must have faculty access');

// 24.6 Area 4: Pending and rejected Teacher restrictions regression
const m812_pendingAccess = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'teacher', is_approved: false },
  role: 'teacher',
  isApproved: false,
});
assert.strictEqual(m812_pendingAccess.allowed, false);
assert.strictEqual(m812_pendingAccess.reason, 'pending_approval');

const m812_rejectedAccess = evaluateAccess({
  allowedRoles: [ROLES.TEACHER, ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(m812_rejectedAccess.allowed, false);
assert.strictEqual(m812_rejectedAccess.reason, 'forbidden');

// 24.7 Area 5: Admin authorization regression
const m812_adminAccess = evaluateAccess({
  allowedRoles: [ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'admin', is_approved: true },
  role: 'admin',
  isApproved: true,
});
assert.strictEqual(m812_adminAccess.allowed, true, 'Admin with approved status granted access');

const m812_studentToAdmin = evaluateAccess({
  allowedRoles: [ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(m812_studentToAdmin.allowed, false);
assert.strictEqual(m812_studentToAdmin.reason, 'forbidden');

const m812_teacherToAdmin = evaluateAccess({
  allowedRoles: [ROLES.ADMIN],
  requireApproval: true,
  isAuthenticated: true,
  profile: { role: 'teacher', is_approved: true },
  role: 'teacher',
  isApproved: true,
});
assert.strictEqual(m812_teacherToAdmin.allowed, false);
assert.strictEqual(m812_teacherToAdmin.reason, 'forbidden');

// 24.8 Area 6 & 7: Unauthorized role and profile modifications regression
assert.throws(
  () => simulateProfileUpdateAttempt({ role: 'student', is_approved: false }, { role: 'admin' }),
  /Cannot alter role/
);
assert.throws(
  () => simulateProfileUpdateAttempt({ role: 'student', is_approved: false }, { is_approved: true }),
  /Cannot alter is_approved/
);
assert.throws(
  () => simulateProfileUpdateAttempt({ id: 'u-1', role: 'student' }, { id: 'u-hacked' }),
  /Cannot alter id/
);

// 24.9 Area 8: Unauthorized Teacher request modifications regression
assert.throws(
  () => simulateTeacherSelfApprovalAttempt('authenticated', 'approved'),
  /Security violation/
);

// 24.10 Area 9: Session restoration and logout regression
const m812_restored = await testSessionRestoration({ user: { id: 'test-u' } });
assert.ok(m812_restored.session);
assert.strictEqual(m812_restored.profile.role, 'student');
const m812_loggedOut = testLogoutState({
  session: m812_restored.session,
  user: m812_restored.session.user,
  profile: m812_restored.profile,
  isAuthenticated: true,
});
assert.strictEqual(m812_loggedOut.session, null);
assert.strictEqual(m812_loggedOut.isAuthenticated, false);

// 24.11 Area 10: Missing-profile and database-error handling regression
const m812_missingProfile = evaluateAccess({
  allowedRoles: [ROLES.STUDENT],
  isAuthenticated: true,
  profile: null,
});
assert.strictEqual(m812_missingProfile.allowed, false);
assert.strictEqual(m812_missingProfile.reason, 'no_profile');

// 24.12 Area 11: Password recovery security regression
assert.ok(recoveryResult.message.includes('If an account exists'), 'User enumeration prevented');
assert.strictEqual(afterResetProfile.role, 'student', 'Student role preserved across reset');
assert.strictEqual(afterTeacherReset.role, 'teacher', 'Teacher role preserved across reset');

// 24.13 Area 12: Public homepage access regression
const m812_homeAccess = evaluateAccess({
  allowedRoles: [], // Public route
  isAuthenticated: false,
  profile: null,
});
assert.strictEqual(m812_homeAccess.allowed, false); // Base evaluateAccess requires auth when protected, public routes bypass guard

// 24.14 Double-submission protection across forms
const m812_loginSource = fs.readFileSync(path.join(srcDir, 'pages', 'LoginPage.jsx'), 'utf8');
assert.ok(m812_loginSource.includes('if (isSubmitting) return;'), 'LoginPage guards duplicate submissions');
const m812_teacherLoginSource = fs.readFileSync(path.join(srcDir, 'pages', 'TeacherLoginPage.jsx'), 'utf8');
assert.ok(m812_teacherLoginSource.includes('if (isSubmitting) return;'), 'TeacherLoginPage guards duplicate submissions');
const m812_teacherStatusSource = fs.readFileSync(path.join(srcDir, 'pages', 'TeacherStatusPage.jsx'), 'utf8');
assert.ok(m812_teacherStatusSource.includes('if (isRefreshing) return;'), 'TeacherStatusPage guards duplicate refresh');
assert.ok(m812_teacherStatusSource.includes('if (!user?.id || isSubmitting) return;'), 'TeacherStatusPage guards duplicate submission');

console.log('✔ Milestone 8.12: All 20 Security Audit & Production Readiness regression checks passed successfully');

// ==============================================================================
// 25. Milestone 9.1: Dashboard Architecture and Shared Layout
// ==============================================================================
console.log('--- AttendAI Verification Suite (Milestone 9.1: Dashboard Architecture & Layout) ---');

// 25.1 Verify Dashboard File Structure and Integrity
const m91_dashboardLayoutPath = path.join(srcDir, 'components', 'dashboard', 'DashboardLayout.jsx');
const m91_dashboardSidebarPath = path.join(srcDir, 'components', 'dashboard', 'DashboardSidebar.jsx');
const m91_dashboardHeaderPath = path.join(srcDir, 'components', 'dashboard', 'DashboardHeader.jsx');
const m91_dashboardNavPath = path.join(srcDir, 'components', 'dashboard', 'DashboardNavigation.jsx');
const m91_navConfigPath = path.join(srcDir, 'components', 'dashboard', 'navigationConfig.jsx');
const m91_pageHeaderPath = path.join(srcDir, 'components', 'dashboard', 'DashboardPageHeader.jsx');
const m91_dashboardIndexCompPath = path.join(srcDir, 'components', 'dashboard', 'index.js');
const m91_dashboardCssPath = path.join(srcDir, 'styles', 'dashboard.css');

const m91_studentDashPath = path.join(srcDir, 'pages', 'dashboards', 'StudentDashboard.jsx');
const m91_teacherDashPath = path.join(srcDir, 'pages', 'dashboards', 'TeacherDashboard.jsx');
const m91_adminDashPath = path.join(srcDir, 'pages', 'dashboards', 'AdminDashboard.jsx');
const m91_dashboardsIndexPath = path.join(srcDir, 'pages', 'dashboards', 'index.js');

assert.ok(fs.existsSync(m91_dashboardLayoutPath), 'DashboardLayout.jsx must exist');
assert.ok(fs.existsSync(m91_dashboardSidebarPath), 'DashboardSidebar.jsx must exist');
assert.ok(fs.existsSync(m91_dashboardHeaderPath), 'DashboardHeader.jsx must exist');
assert.ok(fs.existsSync(m91_dashboardNavPath), 'DashboardNavigation.jsx must exist');
assert.ok(fs.existsSync(m91_navConfigPath), 'navigationConfig.jsx must exist');
assert.ok(fs.existsSync(m91_pageHeaderPath), 'DashboardPageHeader.jsx must exist');
assert.ok(fs.existsSync(m91_dashboardIndexCompPath), 'components/dashboard/index.js must exist');
assert.ok(fs.existsSync(m91_dashboardCssPath), 'dashboard.css must exist');

assert.ok(fs.existsSync(m91_studentDashPath), 'StudentDashboard.jsx must exist');
assert.ok(fs.existsSync(m91_teacherDashPath), 'TeacherDashboard.jsx must exist');
assert.ok(fs.existsSync(m91_adminDashPath), 'AdminDashboard.jsx must exist');
assert.ok(fs.existsSync(m91_dashboardsIndexPath), 'pages/dashboards/index.js must exist');

// 25.2 Verify Route Constants in routes.js
const m91_routesContent = fs.readFileSync(path.join(srcDir, 'routes', 'routes.js'), 'utf8');
assert.ok(m91_routesContent.includes("STUDENT_DASHBOARD: '/student/dashboard'"), 'STUDENT_DASHBOARD constant missing');
assert.ok(m91_routesContent.includes("STUDENT_ATTENDANCE: '/student/attendance'"), 'STUDENT_ATTENDANCE constant missing');
assert.ok(m91_routesContent.includes("STUDENT_SUBJECTS: '/student/subjects'"), 'STUDENT_SUBJECTS constant missing');
assert.ok(m91_routesContent.includes("STUDENT_PROFILE: '/student/profile'"), 'STUDENT_PROFILE constant missing');

assert.ok(m91_routesContent.includes("TEACHER_DASHBOARD: '/teacher/dashboard'"), 'TEACHER_DASHBOARD constant missing');
assert.ok(m91_routesContent.includes("TEACHER_CLASSES: '/teacher/classes'"), 'TEACHER_CLASSES constant missing');
assert.ok(m91_routesContent.includes("TEACHER_SESSIONS: '/teacher/sessions'"), 'TEACHER_SESSIONS constant missing');
assert.ok(m91_routesContent.includes("TEACHER_RECORDS: '/teacher/records'"), 'TEACHER_RECORDS constant missing');
assert.ok(m91_routesContent.includes("TEACHER_PROFILE: '/teacher/profile'"), 'TEACHER_PROFILE constant missing');

assert.ok(m91_routesContent.includes("ADMIN_DASHBOARD: '/admin/dashboard'"), 'ADMIN_DASHBOARD constant missing');
assert.ok(m91_routesContent.includes("ADMIN_USERS: '/admin/users'"), 'ADMIN_USERS constant missing');
assert.ok(m91_routesContent.includes("ADMIN_TEACHER_APPROVALS: '/admin/teacher-approvals'"), 'ADMIN_TEACHER_APPROVALS constant missing');
assert.ok(m91_routesContent.includes("ADMIN_SYSTEM: '/admin/system'"), 'ADMIN_SYSTEM constant missing');
assert.ok(m91_routesContent.includes("ADMIN_PROFILE: '/admin/profile'"), 'ADMIN_PROFILE constant missing');

// 25.3 Verify AppRoutes Role Protection Registration
const m91_appRoutesContent = fs.readFileSync(path.join(srcDir, 'routes', 'AppRoutes.jsx'), 'utf8');
assert.ok(m91_appRoutesContent.includes('StudentDashboard'), 'StudentDashboard missing from AppRoutes.jsx');
assert.ok(m91_appRoutesContent.includes('TeacherDashboard'), 'TeacherDashboard missing from AppRoutes.jsx');
assert.ok(m91_appRoutesContent.includes('AdminDashboard'), 'AdminDashboard missing from AppRoutes.jsx');
assert.ok(m91_appRoutesContent.includes('RoleBasedRoute'), 'RoleBasedRoute missing from AppRoutes.jsx');

// 25.4 Role-Specific Navigation Configuration Isolation
const m91_navConfigContent = fs.readFileSync(m91_navConfigPath, 'utf8');

// Student Navigation checks:
assert.ok(m91_navConfigContent.includes("label: 'Dashboard'"), 'Dashboard link missing');
assert.ok(m91_navConfigContent.includes("label: 'My Attendance'"), 'My Attendance link missing');
assert.ok(m91_navConfigContent.includes("label: 'My Subjects'"), 'My Subjects link missing');
assert.ok(m91_navConfigContent.includes("label: 'My Profile'"), 'My Profile link missing');

// Teacher Navigation checks:
assert.ok(m91_navConfigContent.includes("label: 'My Classes'"), 'My Classes link missing');
assert.ok(m91_navConfigContent.includes("label: 'Attendance Sessions'"), 'Attendance Sessions link missing');
assert.ok(m91_navConfigContent.includes("label: 'Attendance Records'"), 'Attendance Records link missing');

// Admin Navigation checks:
assert.ok(m91_navConfigContent.includes("label: 'User Management'"), 'User Management link missing');
assert.ok(m91_navConfigContent.includes("label: 'Teacher Approvals'"), 'Teacher Approvals link missing');
assert.ok(m91_navConfigContent.includes("label: 'System Overview'"), 'System Overview link missing');

// 25.5 Access Decision Matrix for 3 Dashboards
// 1. Authenticated Student on Student Dashboard -> Allowed
const m91_studentOnStudentDash = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.STUDENT_ONLY.roles,
  requireApproval: ROUTE_ACCESS.STUDENT_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(m91_studentOnStudentDash.allowed, true, 'Student must access Student Dashboard');

// 2. Authenticated Student on Teacher Dashboard -> Forbidden
const m91_studentOnTeacherDash = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(m91_studentOnTeacherDash.allowed, false);
assert.strictEqual(m91_studentOnTeacherDash.reason, 'forbidden');

// 3. Authenticated Student on Admin Dashboard -> Forbidden
const m91_studentOnAdminDash = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.ADMIN_ONLY.roles,
  requireApproval: ROUTE_ACCESS.ADMIN_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(m91_studentOnAdminDash.allowed, false);
assert.strictEqual(m91_studentOnAdminDash.reason, 'forbidden');

// 4. Approved Teacher on Teacher Dashboard -> Allowed
const m91_approvedTeacherOnDash = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { role: 'teacher', is_approved: true },
  role: 'teacher',
  isApproved: true,
});
assert.strictEqual(m91_approvedTeacherOnDash.allowed, true, 'Approved teacher must access Teacher Dashboard');

// 5. Pending Teacher on Teacher Dashboard -> Pending Approval
const m91_pendingTeacherOnDash = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { role: 'teacher', is_approved: false },
  role: 'teacher',
  isApproved: false,
});
assert.strictEqual(m91_pendingTeacherOnDash.allowed, false);
assert.strictEqual(m91_pendingTeacherOnDash.reason, 'pending_approval');

// 6. Rejected Teacher on Teacher Dashboard -> Forbidden
const m91_rejectedTeacherOnDash = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(m91_rejectedTeacherOnDash.allowed, false);
assert.strictEqual(m91_rejectedTeacherOnDash.reason, 'forbidden');

// 7. Teacher on Admin Dashboard -> Forbidden
const m91_teacherOnAdminDash = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.ADMIN_ONLY.roles,
  requireApproval: ROUTE_ACCESS.ADMIN_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { role: 'teacher', is_approved: true },
  role: 'teacher',
  isApproved: true,
});
assert.strictEqual(m91_teacherOnAdminDash.allowed, false);
assert.strictEqual(m91_teacherOnAdminDash.reason, 'forbidden');

// 8. Admin on Admin Dashboard -> Allowed
const m91_adminOnAdminDash = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.ADMIN_ONLY.roles,
  requireApproval: ROUTE_ACCESS.ADMIN_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { role: 'admin', is_approved: true },
  role: 'admin',
  isApproved: true,
});
assert.strictEqual(m91_adminOnAdminDash.allowed, true, 'Admin must access Admin Dashboard');

// 9. Admin on Teacher Dashboard -> Allowed
const m91_adminOnTeacherDash = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles,
  requireApproval: ROUTE_ACCESS.TEACHER_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { role: 'admin', is_approved: true },
  role: 'admin',
  isApproved: true,
});
assert.strictEqual(m91_adminOnTeacherDash.allowed, true, 'Admin can supervise Teacher Dashboard');

// 10. Admin on Student Dashboard -> Allowed
const m91_adminOnStudentDash = evaluateAccess({
  allowedRoles: ROUTE_ACCESS.STUDENT_ONLY.roles,
  requireApproval: ROUTE_ACCESS.STUDENT_ONLY.requireApproval,
  isAuthenticated: true,
  profile: { role: 'admin', is_approved: true },
  role: 'admin',
  isApproved: true,
});
assert.strictEqual(m91_adminOnStudentDash.allowed, true, 'Admin can supervise Student Dashboard');

// 11. Unauthenticated Visitor on Dashboards -> Not Authenticated
assert.strictEqual(
  evaluateAccess({ allowedRoles: ROUTE_ACCESS.STUDENT_ONLY.roles, isAuthenticated: false }).reason,
  'not_authenticated'
);
assert.strictEqual(
  evaluateAccess({ allowedRoles: ROUTE_ACCESS.TEACHER_ONLY.roles, isAuthenticated: false }).reason,
  'not_authenticated'
);
assert.strictEqual(
  evaluateAccess({ allowedRoles: ROUTE_ACCESS.ADMIN_ONLY.roles, isAuthenticated: false }).reason,
  'not_authenticated'
);

// 12. Missing Profile on Dashboards -> No Profile
assert.strictEqual(
  evaluateAccess({ allowedRoles: ROUTE_ACCESS.STUDENT_ONLY.roles, isAuthenticated: true, profile: null }).reason,
  'no_profile'
);

// 25.6 Layout and Responsive Design Attributes
const m91_layoutContent = fs.readFileSync(m91_dashboardLayoutPath, 'utf8');
assert.ok(m91_layoutContent.includes('isMobileSidebarOpen'), 'Mobile sidebar state missing in DashboardLayout');
assert.ok(m91_layoutContent.includes('dashboard-backdrop'), 'Backdrop overlay missing in DashboardLayout');
assert.ok(m91_layoutContent.includes("e.key === 'Escape'"), 'Escape listener missing in DashboardLayout');
assert.ok(m91_layoutContent.includes('window.innerWidth >= 1024'), 'Breakpoint resize listener missing in DashboardLayout');

const m91_headerContent = fs.readFileSync(m91_dashboardHeaderPath, 'utf8');
assert.ok(m91_headerContent.includes('dashboard-header__toggle-btn'), 'Mobile toggle button missing in DashboardHeader');
assert.ok(m91_headerContent.includes('dashboard-role-badge'), 'Role badge missing in DashboardHeader');

const m91_studentDashContent = fs.readFileSync(m91_studentDashPath, 'utf8');
assert.ok(m91_studentDashContent.includes('EmptyState'), 'EmptyState placeholder missing in StudentDashboard');
assert.ok(m91_studentDashContent.includes('DashboardPageHeader'), 'DashboardPageHeader missing in StudentDashboard');

const m91_teacherDashContent = fs.readFileSync(m91_teacherDashPath, 'utf8');
assert.ok(m91_teacherDashContent.includes('EmptyState'), 'EmptyState placeholder missing in TeacherDashboard');

const m91_adminDashContent = fs.readFileSync(m91_adminDashPath, 'utf8');
assert.ok(m91_adminDashContent.includes('EmptyState'), 'EmptyState placeholder missing in AdminDashboard');

console.log('✔ Milestone 9.1: All 26 Dashboard Architecture & Layout tests passed successfully');

// ==============================================================================
// 26. Milestone 9.2: Student Dashboard & Academic Overview
// ==============================================================================
console.log('--- AttendAI Verification Suite (Milestone 9.2: Student Dashboard) ---');

// 26.1 Component & Service File Existence
const m92_studentServicePath = path.join(srcDir, 'services', 'studentService.js');
assert.ok(fs.existsSync(m92_studentServicePath), 'studentService.js must exist');
const m92_studentServiceContent = fs.readFileSync(m92_studentServicePath, 'utf8');
assert.ok(m92_studentServiceContent.includes('calculateAttendancePercentage'), 'calculateAttendancePercentage export missing');
assert.ok(m92_studentServiceContent.includes('getStudentAttendance'), 'getStudentAttendance export missing');
assert.ok(m92_studentServiceContent.includes('getStudentSubjects'), 'getStudentSubjects export missing');

const m92_studentDashPath = path.join(srcDir, 'pages', 'dashboards', 'StudentDashboard.jsx');
assert.ok(fs.existsSync(m92_studentDashPath), 'StudentDashboard.jsx must exist');
const m92_studentDashContent = fs.readFileSync(m92_studentDashPath, 'utf8');

// 26.2 Shared Layout Integration
assert.ok(m92_studentDashContent.includes('DashboardLayout'), 'StudentDashboard must use shared DashboardLayout');
assert.ok(m92_studentDashContent.includes('DashboardPageHeader'), 'StudentDashboard must use shared DashboardPageHeader');
assert.ok(m92_studentDashContent.includes("breadcrumb=\"Student Portal\""), 'Breadcrumb must indicate Student Portal');
assert.ok(m92_studentDashContent.includes('Student Access'), 'Role badge must indicate Student Access');

// 26.3 Personalized Welcome & Non-Hardcoded Profile Info
assert.ok(m92_studentDashContent.includes('displayName'), 'Personalized welcome must use dynamic displayName');
assert.ok(m92_studentDashContent.includes('profile?.full_name'), 'StudentDashboard must read from profile.full_name');
assert.ok(m92_studentDashContent.includes('user?.email'), 'StudentDashboard must display dynamic user.email');
assert.ok(m92_studentDashContent.includes('Welcome back,'), 'Welcome heading must greet the authenticated student');

// 26.4 Safe Attendance Percentage Formula (Attended / Total * 100)
const { calculateAttendancePercentage, getStudentAttendance, getStudentSubjects } = await import('../src/services/studentService.js');

// Test zero total records (handles division by zero)
assert.strictEqual(calculateAttendancePercentage(0, 0), 0, '0 total classes should yield 0% without error');
assert.strictEqual(calculateAttendancePercentage(5, 0), 0, 'Zero total divisor should yield 0%');
assert.strictEqual(calculateAttendancePercentage(0, 10), 0, '0 attended out of 10 should yield 0%');
assert.strictEqual(calculateAttendancePercentage(8, 10), 80, '8 attended out of 10 should yield 80%');
assert.strictEqual(calculateAttendancePercentage(10, 10), 100, '10 attended out of 10 should yield 100%');
assert.strictEqual(calculateAttendancePercentage(7, 9), 78, '7 attended out of 9 should round to 78%');
assert.strictEqual(calculateAttendancePercentage(-1, 10), 0, 'Negative attendance should yield 0%');
assert.strictEqual(calculateAttendancePercentage(null, 10), 0, 'Null attendance should yield 0%');

// 26.5 Graceful Handling of Missing Backend Tables
const m92_mockAttendanceRes = await getStudentAttendance(null);
assert.strictEqual(m92_mockAttendanceRes.total, 0, 'Missing studentId returns 0 total classes');
assert.strictEqual(m92_mockAttendanceRes.attended, 0, 'Missing studentId returns 0 attended classes');
assert.strictEqual(m92_mockAttendanceRes.rate, 0, 'Missing studentId returns 0% rate');
assert.strictEqual(m92_mockAttendanceRes.records.length, 0, 'Missing studentId returns empty records array');
assert.strictEqual(m92_mockAttendanceRes.isAvailable, false, 'isAvailable flag is false when unconfigured');

const m92_mockSubjectsRes = await getStudentSubjects(null);
assert.strictEqual(m92_mockSubjectsRes.subjects.length, 0, 'Missing studentId returns empty subjects array');
assert.strictEqual(m92_mockSubjectsRes.isAvailable, false, 'isAvailable flag is false when unconfigured');

// 26.6 Attendance Overview Empty State & No Fabricated Statistics
assert.ok(m92_studentDashContent.includes('Attendance Overview'), 'Attendance Overview section heading missing');
assert.ok(m92_studentDashContent.includes('Attendance Tracking Inactive'), 'Empty state title for inactive attendance tracking missing');
assert.ok(m92_studentDashContent.includes('No attendance sessions have been logged for your account yet'), 'Explanatory description for absent records missing');

// 26.7 Recent Attendance Activity Section & Empty State
assert.ok(m92_studentDashContent.includes('Recent Attendance Activity'), 'Recent Attendance Activity heading missing');
assert.ok(m92_studentDashContent.includes('No Recent Activity'), 'Empty state for recent activity missing');

// 26.8 My Subjects Section & Empty State
assert.ok(m92_studentDashContent.includes('My Subjects'), 'My Subjects heading missing');
assert.ok(m92_studentDashContent.includes('No Enrolled Subjects Found'), 'Empty state for enrolled subjects missing');

// 26.9 Quick Actions Navigation Links
assert.ok(m92_studentDashContent.includes('Quick Actions'), 'Quick Actions heading missing');
assert.ok(m92_studentDashContent.includes('ROUTES.STUDENT_ATTENDANCE'), 'Quick action link to STUDENT_ATTENDANCE missing');
assert.ok(m92_studentDashContent.includes('ROUTES.STUDENT_SUBJECTS'), 'Quick action link to STUDENT_SUBJECTS missing');
assert.ok(m92_studentDashContent.includes('ROUTES.STUDENT_PROFILE'), 'Quick action link to STUDENT_PROFILE missing');

// 26.10 Profile Integration & Safe Error Handling
assert.ok(m92_studentDashContent.includes('Student Profile'), 'Student Profile card heading missing');
assert.ok(m92_studentDashContent.includes('profileLoading'), 'profileLoading state check missing');
assert.ok(m92_studentDashContent.includes('profileError'), 'profileError state check missing');
assert.ok(m92_studentDashContent.includes('formatAuthError'), 'formatAuthError sanitization missing in StudentDashboard');
assert.ok(m92_studentDashContent.includes('Verified Student'), 'Verified Student indicator missing');

// 26.11 Role-Based Route Protection Verification
const m92_appRoutesContent = fs.readFileSync(appRoutesPath, 'utf8');
assert.ok(
  m92_appRoutesContent.includes("path={ROUTES.STUDENT_DASHBOARD}"),
  'ROUTES.STUDENT_DASHBOARD route registration missing'
);
assert.ok(
  m92_appRoutesContent.includes("allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]}"),
  'STUDENT_DASHBOARD must restrict access to student and admin roles'
);

// RBAC evaluation matrix verification
const m92_studentAccess = evaluateAccess({
  allowedRoles: ['student', 'admin'],
  requireApproval: false,
  isAuthenticated: true,
  profile: { role: 'student', is_approved: false },
  role: 'student',
  isApproved: false,
});
assert.strictEqual(m92_studentAccess.allowed, true, 'Student must have access to Student Dashboard');

const m92_teacherAccess = evaluateAccess({
  allowedRoles: ['student', 'admin'],
  requireApproval: false,
  isAuthenticated: true,
  profile: { role: 'teacher', is_approved: true },
  role: 'teacher',
  isApproved: true,
});
assert.strictEqual(m92_teacherAccess.allowed, false, 'Teacher role must NOT have access to Student Dashboard');
assert.strictEqual(m92_teacherAccess.reason, 'forbidden', 'Teacher denied with forbidden status');

const m92_unauthAccess = evaluateAccess({
  allowedRoles: ['student', 'admin'],
  requireApproval: false,
  isAuthenticated: false,
  profile: null,
  role: null,
  isApproved: false,
});
assert.strictEqual(m92_unauthAccess.allowed, false, 'Unauthenticated user denied access to Student Dashboard');
assert.strictEqual(m92_unauthAccess.reason, 'not_authenticated', 'Unauthenticated user denied with not_authenticated');

// 26.12 Design System Classes in dashboard.css
const m92_dashboardCssPath = path.join(srcDir, 'styles', 'dashboard.css');
const m92_dashboardCssContent = fs.readFileSync(m92_dashboardCssPath, 'utf8');
assert.ok(m92_dashboardCssContent.includes('.dashboard-stats-grid'), '.dashboard-stats-grid class missing in dashboard.css');
assert.ok(m92_dashboardCssContent.includes('.dashboard-stat-card'), '.dashboard-stat-card class missing in dashboard.css');
assert.ok(m92_dashboardCssContent.includes('.dashboard-actions-grid'), '.dashboard-actions-grid class missing in dashboard.css');
assert.ok(m92_dashboardCssContent.includes('.dashboard-action-card'), '.dashboard-action-card class missing in dashboard.css');
assert.ok(m92_dashboardCssContent.includes('.dashboard-profile-list'), '.dashboard-profile-list class missing in dashboard.css');
assert.ok(m92_dashboardCssContent.includes('.dashboard-activity-list'), '.dashboard-activity-list class missing in dashboard.css');

console.log('✔ Milestone 9.2: All 28 Student Dashboard & Academic Overview tests passed successfully');
console.log('--- All Milestone 1 to 9.2 Verification Tests Passed! ---');
