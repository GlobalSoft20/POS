import SALayout from './(dashboard)/layout-client';

export default function SuperAdminRootLayout({ children }: { children: React.ReactNode }) {
  return <SALayout>{children}</SALayout>;
}
