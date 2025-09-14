import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { 
  Search, 
  User,
  MoreHorizontal,
  Settings,
  LogOut,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PWAHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

export const PWAHeader = ({ title, subtitle, onBack }: PWAHeaderProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="w-full border-b border-border bg-background" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - Navegação */}
        <div className="flex items-center gap-4">
          {title ? (
            // Com título da página
            <div className="flex items-center gap-3">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="h-9 w-9 p-0 hover:bg-muted rounded-lg"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
          ) : (
            // Sem título definido
            <div></div>
          )}
        </div>

        {/* Center - Search (hidden on mobile) */}
        <div className="relative max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Buscar viagens, destinos..." 
            className="pl-10 bg-background/50 w-64"
          />
        </div>

        {/* Right side - User Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
               {/* User Menu */}
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-primary/10">
                     <Avatar className="w-8 h-8">
                       <AvatarImage src={user.user_metadata?.avatar_url} />
                       <AvatarFallback className="bg-primary text-primary-foreground">
                         <User className="w-4 h-4" />
                       </AvatarFallback>
                     </Avatar>
                     <span className="hidden md:inline text-sm font-medium text-foreground">
                       {user.user_metadata?.full_name || user.email?.split('@')[0]}
                     </span>
                     <MoreHorizontal className="w-4 h-4 text-foreground" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent 
                   align="end" 
                   className="w-56 z-[9999] bg-background border border-border shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/95"
                   sideOffset={8}
                 >
                   <DropdownMenuItem 
                     onClick={() => navigate("/perfil")} 
                     className="cursor-pointer hover:bg-primary/10 text-foreground focus:bg-primary/10 focus:text-foreground"
                   >
                     <Settings className="w-4 h-4 mr-2" />
                     Configurações
                   </DropdownMenuItem>
                   <DropdownMenuItem 
                     onClick={handleSignOut} 
                     className="cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 text-destructive focus:text-destructive"
                   >
                     <LogOut className="w-4 h-4 mr-2" />
                     Sair
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} variant="outline">
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};