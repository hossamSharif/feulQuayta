'use client';

import { AuthProvider } from '@/app/context/AuthContext';
import { ReactNode } from 'react';

export const AppAuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};