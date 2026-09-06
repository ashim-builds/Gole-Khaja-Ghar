import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import CartDrawer from '@/components/CartDrawer';
import StoreClosedNotice from '@/components/StoreClosedNotice';

export default function ShopLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <StoreClosedNotice variant="banner" />
      <CartDrawer />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
