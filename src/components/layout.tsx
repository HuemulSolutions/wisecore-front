import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isCollapsed={collapsed} />

      <div className="flex flex-1 flex-col">
        {/* barra superior */}
        <header className="h-14 shrink-0 border-b flex items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((c) => !c)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation</span>
          </Button>
        </header>

        {/* contenido */}
        <main className="flex-1 overflow-auto p-6 bg-muted/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}