import { 
  Home, 
  Map, 
  Calendar, 
  User 
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigation = [
  { title: "Início", url: "/viagens", icon: Home, key: "home" },
  { title: "Viagens", url: "/minhas-viagens", icon: Map, key: "trips" },
  { title: "Planos", url: "/planejamento", icon: Calendar, key: "planning" },
  
  { title: "Perfil", url: "/perfil", icon: User, key: "profile" },
];

export const PWAFooter = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <nav className="container px-2 py-2">
        <div className="flex items-center justify-around">
          {navigation.map((item) => {
            const active = isActive(item.url);
            return (
              <NavLink
                key={item.key}
                to={item.url}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-smooth min-w-0 flex-1",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-smooth",
                  active && "scale-110"
                )} />
                <span className="text-xs font-medium truncate">
                  {item.title}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </footer>
  );
};