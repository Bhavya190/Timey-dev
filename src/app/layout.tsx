// app/layout.tsx
import "./globals.css";
import { AppThemeProvider } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* body just hooks into background / foreground tokens */}
      <body className="min-h-screen bg-background text-foreground">
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
