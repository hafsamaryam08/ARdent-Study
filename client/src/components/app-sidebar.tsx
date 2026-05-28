import {
  BookOpen,
  Brain,
  Camera,
  Home,
  Network,
  Settings,
  Trophy,
  BarChart3,
  Users,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Scan Content",
    url: "/scan",
    icon: Camera,
  },
  {
    title: "My Concepts",
    url: "/concepts",
    icon: BookOpen,
  },
  {
    title: "AR Visualizer",
    url: "/ar-viewer",
    icon: Brain,
  },
  {
    title: "Knowledge Graph",
    url: "/knowledge-graph",
    icon: Network,
  },
  {
    title: "Quizzes",
    url: "/quizzes",
    icon: Trophy,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Leaderboard",
    url: "/leaderboard",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const activeMenuItems = [
    ...menuItems,
    ...(user?.role === "admin" ? [{ title: "Admin Panel", url: "/admin", icon: ShieldAlert }] : [])
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="h-14 px-4 py-8 mb-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center p-1 border border-primary/20 shadow-sm">
                <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-xl font-display font-bold tracking-tight text-foreground">ARdent Study</span>
            </Link>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activeMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
          <div className="p-4 mt-auto">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => logout()}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  data-testid="button-logout"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
