"use client"

import Navbar from "@/components/navbar";
import FullView from "@/components/fullView";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <div> 
      <Navbar />
      <FullView />
      <Toaster />
    </div>
  );
}
