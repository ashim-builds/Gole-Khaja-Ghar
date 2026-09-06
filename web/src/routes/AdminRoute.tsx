import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { api } from '@/lib/api';

export default function AdminRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    async function checkAdminAuth() {
      try {
        // Ping admin live-updates or stats to verify admin token
        const res = await api.orders.getAdminLiveUpdates();
        if (active) {
          setIsAuthenticated(res.success);
        }
      } catch {
        if (active) {
          setIsAuthenticated(false);
        }
      }
    }
    checkAdminAuth();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-400 text-sm font-semibold">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
