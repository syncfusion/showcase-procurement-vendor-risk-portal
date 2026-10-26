import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import "@syncfusion/ej2-tailwind3-theme/styles/tailwind3.css";
// Tailwind theme for the pure React components (sf- classes). Colours come from tokens.css.
import '@syncfusion/react-tailwind-theme/styles/tailwind.css';
// Semantic and component tokens, then app styles. Both themes.
import './theme/tokens.css';
import './theme/app.css';
import { ThemeProvider } from './theme/ThemeProvider';
import { SessionProvider } from './domain/session';
import { App } from './App';
import { registerLicense as rL } from '@syncfusion/react-base';
import { registerLicense } from '@syncfusion/ej2-base';

// Register the Syncfusion license for React components and Pure React components from the build environment.

const licenseKey = import.meta.env.VITE_SYNCFUSION_LICENSE_KEY;
if (licenseKey) {
  rL(licenseKey); //Pure React components license registration
  registerLicense(licenseKey); // EJ2 React components license registration
}
   
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SessionProvider>
        <App />
      </SessionProvider>
    </ThemeProvider>
  </StrictMode>
);