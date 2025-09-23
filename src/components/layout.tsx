import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Sidebar overlay */}
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden animate-in fade-in hover:cursor-pointer"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col h-full w-full overflow-x-hidden">
        <header className="h-14 shrink-0 border-b flex items-center px-4 gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((o) => !o)}
            className="hover:cursor-pointer"
            aria-expanded={open}
            aria-controls="sidebar"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation</span>
          </Button>
          <Link
            to="/home"
            className="font-bold text-sm tracking-tight hover:cursor-pointer select-none"
          >
            Wisecore
          </Link>
        </header>
        <main className="flex-1 overflow-auto p-3 bg-muted/50 min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}