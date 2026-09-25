import Link from "next/link";

interface SidebarLink {
  href: string;
  label: string;
  icon: string;
}

const adminLinks: SidebarLink[] = [
  { href: "/admin/overages", label: "Overage Requests", icon: "⚠️" },
  { href: "/admin/payments", label: "Payments", icon: "💰" },
  { href: "/admin/quotas", label: "Quota Management", icon: "📊" },
  { href: "/admin/quota-reset", label: "Quota Reset", icon: "🔄" },
  { href: "/admin/reports", label: "Reports", icon: "📈" },
];

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-background border-r p-4">
      <nav className="space-y-2">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 bg-background">{children}</main>
    </div>
  );
}