/**
 * AttendAI Application Entry Point
 * Mounts the React application with design tokens and global styles.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Centralized styles imported in explicit cascade order:
// 1. Tokens and variables
// 2. CSS Reset
// 3. Global typography and base utilities
import './styles/variables.css';
import './styles/reset.css';
import './styles/global.css';

import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
