import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building2,
  Database,
  ShieldCheck,
  BookOpen,
  FileCode2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Credit Unions", href: "/credit-unions", icon: Building2 },
  { name: "Ingestion Jobs", href: "/ingestion", icon: Database },
  { name: "Data Quality", href: "/data-quality", icon: ShieldCheck },
  { name: "Canonical Schema", href: "/canonical-schema", icon: BookOpen },
  { name: "Documentation", href: "/docs", icon: FileCode2 },
];

function ExlLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 22" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="EXL">
      <text x="1" y="18" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="20" fill="#FF5A1F" letterSpacing="-0.5">EXL</text>
    </svg>
  );
}

function AppSidebar() {
  const [location, navigate] = useLocation();
  const { setOpenMobile, toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { data: health } = useHealthCheck({ query: { queryKey: ["/api/healthz"], refetchInterval: 60000 } });

  function handleSignOut() {
    navigate("/");
  }

  return (
    <Sidebar
      collapsible="icon"
      className="!top-16 !h-[calc(100svh-4rem)] border-r border-sidebar-border"
    >
      {/* Collapse / expand button lives at the top of the sidebar */}
      <div className="flex items-center border-b border-sidebar-border px-2 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-9 h-9 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed
                ? <PanelLeftOpen className="w-5 h-5" />
                : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isCollapsed ? "Expand" : "Collapse"}
          </TooltipContent>
        </Tooltip>
      </div>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  onClick={() => setOpenMobile(false)}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-2">
        {isCollapsed ? (
          <div className="flex justify-center py-1">
            <div className={`w-2 h-2 rounded-full ${health?.status === "ok" ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50 px-2 py-1">
            <div className={`w-2 h-2 rounded-full shrink-0 ${health?.status === "ok" ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
            <span>System {health?.status === "ok" ? "Online" : "Offline"}</span>
          </div>
        )}

        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center p-2 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign out</span>
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* Full-width top bar — SmartIngest branding on the left */}
      <header className="fixed top-0 left-0 right-0 h-16 z-20 flex items-center px-5 bg-sidebar border-b border-sidebar-border gap-3">
        {/* SmartIngest logo */}
        <div className="w-8 h-8 bg-accent rounded flex items-center justify-center text-white shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <span className="font-bold text-lg tracking-tight text-sidebar-foreground whitespace-nowrap">
          SmartIngest
        </span>
        {/* Divider */}
        <span className="text-sidebar-foreground/20 font-light text-xl select-none">|</span>
        {/* EXL logo */}
        <ExlLogo className="h-5 w-auto" />

        <div className="flex-1" />

        {/* Right side user info */}
        <span className="text-sm font-medium text-sidebar-foreground/60 hidden sm:block">
          Data Operations
        </span>
        <div className="w-8 h-8 rounded-full bg-sidebar-accent text-sidebar-foreground flex items-center justify-center font-bold text-xs">
          DO
        </div>
      </header>

      {/* Page body — sidebar + content below the fixed top bar */}
      <div className="flex w-full pt-16 min-h-screen">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-background min-w-0">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
