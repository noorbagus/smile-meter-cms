// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/providers/auth-provider';
import ClientLayout from '@/components/layout/client-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Smile Meter CMS',
  description: 'Content Management System for Smile Meter AR Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}