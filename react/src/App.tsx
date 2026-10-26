import { Suspense, lazy, useEffect, type MouseEvent, type ReactNode } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardCheck, FileText, Sparkles, Moon, Sun, RotateCcw } from 'lucide-react';
import { AppShell, type NavItem } from './shell/AppShell';
import { ThemeProvider, useTheme } from './theme/ThemeProvider';
import { SessionProvider } from './domain/session';
import { useSession } from './domain/session';
import { LoadingState } from './LoadingState';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Vendors = lazy(() => import('./pages/Vendors'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Documents = lazy(() => import('./pages/Documents'));
const Ai = lazy(() => import('./pages/Ai'));

const ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Risk Dashboard', href: '/', icon: LayoutDashboard },
  { id: 'vendors', label: 'Vendor Register', href: '/vendors', icon: Users },
  { id: 'approvals', label: 'Onboarding Approvals', href: '/approvals', icon: ClipboardCheck },
  { id: 'documents', label: 'Vendor Documents', href: '/documents', icon: FileText },
  { id: 'ai', label: 'AI Assistant', href: '/ai', icon: Sparkles }
];

const ROUTE_TO_ID: Record<string, string> = { '': 'dashboard', vendors: 'vendors', approvals: 'approvals', documents: 'documents', ai: 'ai' };

function PageFallback() {
  const labels: Record<string, string> = { dashboard: 'Risk Dashboard', vendors: 'Vendor Register', approvals: 'Onboarding Approvals', documents: 'Vendor Documents', ai: 'AI Assistant' };
  const location = useLocation();
  const key = (location.pathname.replace(/\//g, '') || 'dashboard');
  return <LoadingState label={`Loading ${labels[key] ?? 'page'}…`} />;
}

function HeaderActions() {
  const { theme, toggle } = useTheme();
  const { dispatch } = useSession();
  return (
    <>
      <button type="button" className="app-shell-icon-button" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} onClick={toggle}>
        {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      </button>
      <button type="button" className="app-shell-icon-button" aria-label="Reset session to demo data"
        onClick={() => dispatch({ type: 'reset' })}>
        <RotateCcw size={18} aria-hidden="true" />
      </button>
    </>
  );
}

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSession();
  const key = location.pathname.replace(/\//g, '') || 'dashboard';
  const currentId = ROUTE_TO_ID[key] ?? 'dashboard';

  const onNavigate = (id: string, event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const href = ITEMS.find(i => i.id === id)?.href ?? '/';
    navigate(href);
  };

  const title = ITEMS.find(i => i.id === currentId)?.label ?? '';
  return (
    <AppShell
      appName="Procurement & Vendor Risk"
      appSubtitle="Vendor Risk Portal"
      logo="PV"
      items={ITEMS}
      currentId={currentId}
      onNavigate={onNavigate}
      storageKey="procurement-vendor-risk-portal-nav-collapsed"
      headerStart={<strong>{title}</strong>}
      headerEnd={<HeaderActions />}
      footer={<span>Built with Syncfusion</span>}
    >
      <Suspense fallback={<PageFallback />}>
        {currentId === 'dashboard' && <Dashboard />}
        {currentId === 'vendors' && <Vendors />}
        {currentId === 'approvals' && <Approvals />}
        {currentId === 'documents' && <Documents />}
        {currentId === 'ai' && <Ai />}
      </Suspense>
    </AppShell>
  );
}

function BootGate({ children }: { children: React.ReactNode }) {
  const { ready } = useTheme();
  // Remove the static startup frame once the theme bundle has loaded. The shell has no layout without it.
  useEffect(() => {
    if (ready) document.getElementById('app-boot')?.remove();
  }, [ready]);
  if (!ready) return null;
  return <>{children}</>;
}

export function App() {
  return (
    <ThemeProvider>
      <BootGate>
        <SessionProvider>
          <BrowserRouter>
            <Shell />
          </BrowserRouter>
        </SessionProvider>
      </BootGate>
    </ThemeProvider>
  );
}