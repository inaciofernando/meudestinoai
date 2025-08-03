import { 
  Home, 
  Map, 
  Calendar, 
  Wallet, 
  FileText, 
  MapPin, 
  Settings,
  Plus
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigation = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Minhas Viagens", url: "/viagens", icon: Map },
  { title: "Planejamento", url: "/planejamento", icon: Calendar },
  { title: "Orçamento", url: "/orcamento", icon: Wallet },
  { title: "Documentos", url: "/documentos", icon: FileText },
  { title: "Pontos de Interesse", url: "/pontos", icon: MapPin },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavClass = (active: boolean) =>
    active 
      ? "bg-primary/10 text-primary border-r-2 border-primary" 
      : "hover:bg-primary/5 hover:text-primary";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r border-border">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-border">
          {!isCollapsed ? (
            <h1 className="text-xl font-bold text-primary">TravelManager</h1>
          ) : (
            <div className="w-8 h-8 bg-gradient-ocean rounded-lg"></div>
          )}
        </div>

        {/* Quick Action */}
        <div className="p-4">
          <Button 
            variant="travel" 
            size={isCollapsed ? "icon" : "default"} 
            className="w-full"
          >
            <Plus className="w-4 h-4" />
            {!isCollapsed && <span>Nova Viagem</span>}
          </Button>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">
            {!isCollapsed && "Navegação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(isActive(item.url))}
                    >
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <div className="mt-auto p-4 border-t border-border">
          <SidebarMenuButton asChild>
            <NavLink 
              to="/configuracoes" 
              className={getNavClass(isActive("/configuracoes"))}
            >
              <Settings className="w-5 h-5" />
              {!isCollapsed && <span>Configurações</span>}
            </NavLink>
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}