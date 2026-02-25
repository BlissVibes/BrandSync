import { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, UserSearch, Sun, Moon, Zap, FlaskConical, X } from 'lucide-react';
import { Toaster } from 'sonner';
import Dashboard from './components/Dashboard/Dashboard';
import SEOAnalyzer from './components/SEOAnalyzer/SEOAnalyzer';
import VetClient from './components/VetClient/VetClient';
import { IS_MOCK_MODE } from './services/api';

const TABS = [
  { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { id: 'seo', label: 'SEO Analyzer', icon: TrendingUp },
  { id: 'vet', label: 'Vet New Client', icon: UserSearch },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [dark, setDark] = useState(() => {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
  });
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Toaster richColors position="top-right" />

      {/* Demo mode banner */}
      {IS_MOCK_MODE && !demoBannerDismissed && (
        <div className="bg-brand-600 text-white text-xs px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 justify-center">
            <FlaskConical className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              <strong>Demo mode</strong> — running with embedded seed data. No backend required.
              {' '}To connect a live backend, set the <code className="bg-white/20 px-1 rounded">VITE_API_URL</code> secret in your GitHub repository settings.
            </span>
          </div>
          <button onClick={() => setDemoBannerDismissed(true)} className="flex-shrink-0 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top navbar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-base tracking-tight">BrandSync</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono">v0.1</span>
          </div>

          {/* Tab navigation */}
          <nav className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-800/60 rounded-lg p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${tab === id ? 'tab-active' : 'tab-inactive'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </nav>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(d => !d)}
            className="btn-ghost"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile tab navigation */}
        <div className="sm:hidden flex border-t border-gray-100 dark:border-gray-800">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-all ${
                tab === id
                  ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'seo' && <SEOAnalyzer />}
        {tab === 'vet' && <VetClient />}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-900">
        BrandSync v0.1.0 — Marketing Director's Dashboard
      </footer>
    </div>
  );
}
