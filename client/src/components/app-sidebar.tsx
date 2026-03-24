import { LayoutDashboard, Briefcase, Bot, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Jobs", url: "/jobs", icon: Briefcase },
];

const AGENT_INFO: Record<string, { label: string; candidate: string; type: string; color: string }> = {
  venuja1: { label: "VenuJA1", candidate: "Venu Darur", type: "W2 Full-time", color: "hsl(174 72% 46%)" },
  krishnaja1: { label: "KrishnaJA1", candidate: "V Krishna", type: "C2C Contract", color: "hsl(262 72% 56%)" },
  udayja1: { label: "UdayJA1", candidate: "Uday Kumar Chitturi", type: "C2C Contract", color: "hsl(38 92% 50%)" },
  shasheeja1: { label: "ShasheeJA1", candidate: "Shashi Kumar", type: "C2C DevOps/SRE", color: "hsl(340 75% 55%)" },
  rajja1: { label: "RajJA1", candidate: "Raja Vamshi", type: "C2C Java Fullstack", color: "hsl(200 80% 50%)" },
  dunteesja1: { label: "DunteesJA1", candidate: "Dunteesh", type: "C2C Python Developer", color: "hsl(25 90% 55%)" },
  purvaja1: { label: "PurvaJA1", candidate: "Purva", type: "C2C Technical Writer", color: "hsl(290 70% 55%)" },
  ramanaja1: { label: "RamanaJA1", candidate: "Ramana", type: "C2C React Developer", color: "hsl(150 70% 45%)" },
};

function AgentHubLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Agent Hub Logo"
    >
      <rect width="32" height="32" rx="8" fill="hsl(174 72% 46%)" />
      <circle cx="10" cy="16" r="3" fill="hsl(220 16% 6%)" />
      <circle cx="22" cy="10" r="3" fill="hsl(220 16% 6%)" />
      <circle cx="22" cy="22" r="3" fill="hsl(220 16% 6%)" />
      <line x1="12.5" y1="15" x2="19.5" y2="11" stroke="hsl(220 16% 6%)" strokeWidth="1.5" />
      <line x1="12.5" y1="17" x2="19.5" y2="21" stroke="hsl(220 16% 6%)" strokeWidth="1.5" />
    </svg>
  );
}

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <AgentHubLogo />
          <div>
            <h1 className="text-sm font-bold tracking-tight">Balaji Agent Hub</h1>
            <p className="text-[11px] text-muted-foreground">Job Agent Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.url === "/"
                    ? location === "/" || location === ""
                    : location.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Agents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-3">
              {Object.entries(AGENT_INFO).map(([key, info]) => (
                <div key={key} className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ background: info.color }}
                    />
                    <span className="font-medium">{info.label}</span>
                  </div>
                  <div className="pl-4 text-[11px] text-muted-foreground">
                    {info.candidate} · {info.type}
                  </div>
                </div>
              ))}
              <div className="pt-1 text-[11px] text-muted-foreground/70 border-t border-border mt-2">
                Coordinator: Balaji
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-2 pb-2">
        <PerplexityAttribution />
      </SidebarFooter>
    </Sidebar>
  );
}
