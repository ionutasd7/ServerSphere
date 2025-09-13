import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  Database, 
  Settings, 
  Server, 
  FileText,
  AlertTriangle
} from "lucide-react";
import { useLocation } from "wouter";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Server Configuration",
    url: "/servers",
    icon: Server,
  }
];

const adItems = [
  {
    title: "Users",
    url: "/ad/users",
    icon: Users,
    badge: "245"
  },
  {
    title: "Groups", 
    url: "/ad/groups",
    icon: Users,
    badge: "58"
  },
  {
    title: "Organizational Units",
    url: "/ad/ous", 
    icon: FileText,
  }
];

const adcsItems = [
  {
    title: "Certificate Authority",
    url: "/adcs/ca",
    icon: Shield,
  },
  {
    title: "Certificate Templates",
    url: "/adcs/templates",
    icon: FileText,
    badge: "12"
  },
  {
    title: "Issued Certificates",
    url: "/adcs/certificates",
    icon: Shield,
    badge: "1,247"
  }
];

const dnsItems = [
  {
    title: "DNS Zones",
    url: "/dns/zones",
    icon: Database,
    badge: "8"
  },
  {
    title: "DNS Records",
    url: "/dns/records",
    icon: Database,
  }
];

export default function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Server Console</h2>
          <p className="text-sm text-muted-foreground">Windows Management</p>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Active Directory */}
        <SidebarGroup>
          <SidebarGroupLabel>Active Directory</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-ad-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ADCS */}
        <SidebarGroup>
          <SidebarGroupLabel>Certificate Services</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adcsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-adcs-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* DNS */}
        <SidebarGroup>
          <SidebarGroupLabel>DNS Server</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dnsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-dns-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-testid="nav-settings">
              <a href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Connection Status */}
        <div className="p-4 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Connected to DC01</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}