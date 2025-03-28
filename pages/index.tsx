import Navbar from "@/components/navbar";
import FullView from "@/components/fullView";
import BookForm from "./bookForm";

import { ThemeProvider } from "@/components/theme-provider";

import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <div>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Navbar />
        <FullView />
        <Toaster />
      </ThemeProvider>
    </div>
  );
}
