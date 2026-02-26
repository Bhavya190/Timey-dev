"use client";

import { ThemeProvider } from "next-themes";
import { UserProvider } from "@/components/UserProvider";

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={["light", "dark"]}
    >
      <UserProvider>{children}</UserProvider>
    </ThemeProvider>
  );
}
