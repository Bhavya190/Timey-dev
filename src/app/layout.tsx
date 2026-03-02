import "./globals.css";
import { AppThemeProvider } from "./providers";
import { Toaster } from "react-hot-toast";

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* body just hooks into background / foreground tokens */}
      <body className="min-h-screen bg-background text-foreground">
        <AppThemeProvider>
          {children}
          <Toaster position="bottom-right" />
        </AppThemeProvider>
      </body>
    </html>
  );
}
