import React from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { ShieldAlert, LogOut, Home } from 'lucide-react';
import { useUser } from '@/context/UserContext';

interface RoleRouteProps {
  allowedRoles: string[];
  title?: string;
  description?: string;
}

export default function RoleRoute({
  allowedRoles,
  title = 'Restricted Staff Portal',
  description = 'This section requires specific staff role permissions.',
}: RoleRouteProps) {
  const { user, isLoading, logout } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-100">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-stone-400 uppercase tracking-widest">
          Verifying Permissions...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  const userRole = (user.role || '').toUpperCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  const isAuthorized =
    userRole === 'ADMIN' ||
    userRole === 'SUPER_ADMIN' ||
    normalizedAllowed.includes(userRole);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-red-950/80 border border-red-700/50 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-950/40">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-950 text-red-400 rounded-full border border-red-800">
              Access Restricted
            </span>
            <h2 className="text-xl font-black text-white">{title}</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800/80 text-left space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-500">
              <span>Logged In As:</span>
              <strong className="text-stone-200">{user.name}</strong>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Your Current Role:</span>
              <span className="font-mono font-bold text-amber-400 uppercase">
                {user.role}
              </span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Required Role:</span>
              <span className="font-mono font-bold text-emerald-400 uppercase">
                {allowedRoles.join(' or ')}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              to={userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' ? '/admin' : '/'}
              className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Home className="w-4 h-4" />
              <span>
                {userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
                  ? 'Return to Admin Dashboard'
                  : 'Return to Home'}
              </span>
            </Link>

            <button
              onClick={async () => {
                await logout();
              }}
              className="w-full py-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Login with Different Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
