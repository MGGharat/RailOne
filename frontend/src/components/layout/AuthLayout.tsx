import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Train } from 'lucide-react';

// ─── AuthLayout ───────────────────────────────────────────────────────────────
// Full-screen gradient shell for login / register pages.
// The auth form is rendered via <Outlet />.

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950">

      {/* Decorative background blobs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-blue-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-900/20 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* Brand header */}
        <Link
          to="/"
          className="flex flex-col items-center gap-3 mb-8 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-900/60 group-hover:bg-blue-500 transition-colors duration-200 ring-4 ring-blue-500/20">
            <Train size={34} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none">
              Rail<span className="text-blue-400">One</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">
              India's trusted railway booking platform
            </p>
          </div>
        </Link>

        {/* Auth form card */}
        <div className="w-full max-w-md">
          <div className="bg-slate-800/70 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            <Outlet />
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>Secure &amp; Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>PCI DSS Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-5 border-t border-slate-800/60">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 px-4">
          <p className="text-slate-600 text-xs text-center">
            &copy; {new Date().getFullYear()} RailOne. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/privacy"
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-700 text-xs">·</span>
            <Link
              to="/terms"
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-slate-700 text-xs">·</span>
            <Link
              to="/help"
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
            >
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export { AuthLayout };
export default AuthLayout;
