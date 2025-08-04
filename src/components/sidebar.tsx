import { NavLink } from "react-router-dom";
import { Home, FileText, Search, LayoutTemplate} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import clsx from "classnames";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/templates", label: "Templates", icon: LayoutTemplate }, // Assuming templates is a home-like section
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/search", label: "Search", icon: Search },
];

export default function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <aside
      className={clsx(
        "h-full border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-18" : "w-40"
      )}
    >
      <div className="h-14 flex items-center justify-center">
        <span className="font-bold text-sm tracking-tight">Wisecore</span>
      </div>

      <Separator />

      <nav className="px-2 pt-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {!isCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}