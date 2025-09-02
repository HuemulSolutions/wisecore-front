import { NavLink } from "react-router-dom";
import { Home, FileText, Search, LayoutTemplate, X, Building2, LibraryBig } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import clsx from "classnames";
import { useEffect } from "react";

const navItems = [
	{ to: "/home", label: "Home", icon: Home },
  { to: "/organizations", label: "Organizations", icon: Building2 },
	{ to: "/templates", label: "Templates", icon: LayoutTemplate },
	{ to: "/documents", label: "Create Knowledge", icon: FileText },
	{ to: "/search", label: "Search", icon: Search },
	{ to: "/", label: "Library", icon: LibraryBig },
];

export default function Sidebar({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose?: () => void;
}) {
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose?.();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [isOpen, onClose]);

	return (
		<aside
			className={clsx(
				"fixed inset-y-0 left-0 z-40 w-64 border-r bg-background shadow-lg transition-transform duration-300 ease-in-out",
				!isOpen && "-translate-x-full"
			)}
			aria-hidden={!isOpen}
			aria-label="Main navigation"
		>
			<div className="h-14 flex items-center justify-between px-4">
				<span className="font-bold text-sm tracking-tight">Wisecore</span>
				<Button
					variant="ghost"
					size="icon"
					onClick={onClose}
					className="hover:cursor-pointer"
				>
					<X className="h-5 w-5" />
					<span className="sr-only">Close navigation</span>
				</Button>
			</div>

			<Separator />

			<nav className="px-2 pt-4 space-y-1">
				{navItems.map(({ to, label, icon: Icon }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) =>
							clsx(
								"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground hover:cursor-pointer",
								isActive && "bg-accent text-accent-foreground"
							)
						}
						onClick={onClose}
					>
						<Icon className="h-5 w-5" />
						<span>{label}</span>
					</NavLink>
				))}
			</nav>
		</aside>
	);
}