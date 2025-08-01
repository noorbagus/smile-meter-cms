// app/dashboard/layout.tsx
'use client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // AuthProvider + ClientLayout sudah handle semua auth logic
  // Layout ini hanya untuk struktur UI, bukan auth protection
  
  return <>{children}</>;
}