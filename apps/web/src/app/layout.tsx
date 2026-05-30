import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ToastContainer } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Blink Social',
  description: 'A social media platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-text antialiased">
        <ThemeProvider>
          {children}
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
