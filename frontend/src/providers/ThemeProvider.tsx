"use client";
import { ThemeProvider as NextThemeProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      defaultTheme="dark-neural"
      themes={["dark-neural", "light-clinic", "midnight-blue", "warm-amber"]}
      enableSystem={false}
    >
      {children}
    </NextThemeProvider>
  );
}