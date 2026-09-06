import React from 'react';
import { Outlet } from 'react-router-dom';
import { UserProvider } from '@/context/UserContext';
import { CartProvider } from '@/context/CartContext';
import SplashScreen from '@/components/SplashScreen';
import DisableDevtools from '@/components/DisableDevtools';
import PushNotificationSetup from '@/components/PushNotificationSetup';

export default function RootLayout() {
  return (
    <UserProvider>
      <CartProvider>
        <DisableDevtools />
        <SplashScreen />
        <PushNotificationSetup />
        <Outlet />
      </CartProvider>
    </UserProvider>
  );
}
