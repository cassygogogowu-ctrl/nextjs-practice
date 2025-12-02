import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';

export const metadata = { 
  title: {
    template: '%s | Acme Dashboard',
    default: 'Acme Dashboard',
  }, // template for dynamic titles e.g. 'Invoices | Acme Dashboard'
  description: 'A sample dashboard application built with Next.js',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
