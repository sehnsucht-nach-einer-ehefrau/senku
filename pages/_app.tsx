// pages/_app.tsx
import "../app/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/sonner"

import { ThemeProvider } from "@/components/theme-provider";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
      <Component {...pageProps} />
      <Toaster />
    </ThemeProvider>
  );
}

export default MyApp;
